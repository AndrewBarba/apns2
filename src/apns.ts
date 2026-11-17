import { EventEmitter } from "node:events"

import { type PrivateKey, createSigner } from "fast-jwt"
// Import undici by file path: Bun replaces the bare "undici" specifier with a
// partial built-in whose Pool#request is a no-op, ignoring the installed package
import { type Dispatcher, Pool } from "undici/index.js"

import { ApnsError, type ApnsResponseError, type ApnsResponseHeaders, Errors } from "./errors.js"
import { getHeader, undici_getClientHttp2Session, undici_getPoolClients } from "./internals.js"
import { type Notification, Priority } from "./notifications/notification.js"

// APNS version
const API_VERSION = 3

// Signing algorithm for JSON web token
const SIGNING_ALGORITHM = "ES256"

// Reset our signing token every 55 minutes as reccomended by Apple
const RESET_TOKEN_INTERVAL_MS = 55 * 60 * 1000

// Ping the server every 10 minutes as reccomended by Apple
const PING_INTERVAL_MS = 10 * 60 * 1000

// Keep idle http2 sessions open well past the ping interval. Undici closes
// idle sessions after 4 seconds by default, and pings do not reset that timer
const KEEP_ALIVE_TIMEOUT_MS = 60 * 60 * 1000

// Upper bound on concurrent streams per http2 connection. APNs advertises its
// own limit (1 until the first authorized request, then typically 500-1000)
// and undici uses the lower of the two, so the server's limit is the ceiling
const MAX_CONCURRENT_STREAMS = 1000

export const Host = {
  production: "api.push.apple.com",
  development: "api.sandbox.push.apple.com",
} as const

export type Host = (typeof Host)[keyof typeof Host]

export interface SigningToken {
  value: string
  timestamp: number
}

export interface ApnsOptions {
  team: string
  signingKey: string | Buffer | PrivateKey
  keyId: string
  defaultTopic?: string
  host?: Host | string
  requestTimeout?: number
  keepAlive?: boolean
}

export interface ApnsSendResponse {
  notification: Notification
  statusCode: number
  headers: ApnsResponseHeaders
  // Unique id for the notification, from the apns-id response header
  apnsId?: string
  // Only returned by the development environment, useful for debugging
  apnsUniqueId?: string
}

export interface ApnsSendFailure {
  notification: Notification
  // ApnsError for APNs responses, or a transport error (e.g. a dropped
  // connection) without a reason, which callers may want to retry
  error: ApnsError | Error
}

export type ApnsSendManyResult = ApnsSendResponse | ApnsSendFailure

export class ApnsClient extends EventEmitter {
  readonly team: string
  readonly keyId: string
  readonly host: Host | string
  readonly signingKey: string | Buffer | PrivateKey
  readonly defaultTopic?: string
  readonly keepAlive: boolean
  readonly client: Pool

  private _token: SigningToken | null

  constructor(options: ApnsOptions) {
    super()
    this.team = options.team
    this.keyId = options.keyId
    this.signingKey = options.signingKey
    this.defaultTopic = options.defaultTopic
    this.host = options.host ?? Host.production
    this.keepAlive = options.keepAlive ?? true
    this.client = new Pool(`https://${this.host}:443`, {
      connections: this.keepAlive ? 32 : 1,
      pipelining: this.keepAlive ? 1 : 0,
      allowH2: true,
      bodyTimeout: options.requestTimeout,
      headersTimeout: options.requestTimeout,
      keepAliveTimeout: this.keepAlive ? KEEP_ALIVE_TIMEOUT_MS : undefined,
      h2Options: {
        maxConcurrentStreams: MAX_CONCURRENT_STREAMS,
        // Undici sends http2 PING frames on every session; 0 disables them
        pingInterval: this.keepAlive ? PING_INTERVAL_MS : 0,
      },
    })
    this._token = null
  }

  // Never rejects: each result is an ApnsSendResponse or an ApnsSendFailure,
  // in the same order as the notifications
  sendMany(notifications: Notification[]): Promise<ApnsSendManyResult[]> {
    const promises = notifications.map((notification) =>
      this.send(notification).catch((error: ApnsError | Error): ApnsSendFailure => ({
        notification,
        error,
      })),
    )
    return Promise.all(promises)
  }

  async send(notification: Notification): Promise<ApnsSendResponse> {
    if (Array.isArray(notification)) {
      throw new TypeError("send() expects a single Notification, use sendMany() for arrays")
    }
    if (typeof notification?.buildApnsOptions !== "function") {
      throw new TypeError("send() expects a Notification instance")
    }

    const headers: Record<string, string | undefined> = {
      authorization: `bearer ${this._getSigningToken()}`,
      "apns-push-type": notification.pushType,
      "apns-topic": notification.options.topic ?? this.defaultTopic,
    }

    if (notification.options.id) {
      headers["apns-id"] = notification.options.id
    }

    if (notification.priority !== Priority.immediate) {
      headers["apns-priority"] = notification.priority.toString()
    }

    const expiration = notification.options.expiration
    if (typeof expiration !== "undefined") {
      headers["apns-expiration"] =
        typeof expiration === "number"
          ? expiration.toFixed(0)
          : (expiration.getTime() / 1000).toFixed(0)
    }

    if (notification.options.collapseId) {
      headers["apns-collapse-id"] = notification.options.collapseId
    }

    const res = await this.client.request({
      path: `/${API_VERSION}/device/${encodeURIComponent(notification.deviceToken)}`,
      method: "POST",
      headers: headers,
      body: JSON.stringify(notification.buildApnsOptions()),
      idempotent: true,
      blocking: false,
    })

    return this._handleServerResponse(res, notification)
  }

  async ping() {
    const sessions = undici_getPoolClients(this.client)
      .map(undici_getClientHttp2Session)
      .filter((session) => session !== null)
      .filter((session) => !session.destroyed && !session.connecting && !session.closed)
    const promises = sessions.map((session) => {
      return new Promise<void>((resolve, reject) => {
        session.ping((err) => (err ? reject(err) : resolve()))
      })
    })
    return Promise.allSettled(promises)
  }

  async close() {
    await this.client.close()
  }

  async destroy(err?: Error | null) {
    await this.client.destroy(err ?? null)
  }

  private async _handleServerResponse(
    res: Dispatcher.ResponseData,
    notification: Notification,
  ): Promise<ApnsSendResponse> {
    if (res.statusCode === 200) {
      await res.body.dump()
      return {
        notification,
        statusCode: res.statusCode,
        headers: res.headers,
        apnsId: getHeader(res.headers, "apns-id"),
        apnsUniqueId: getHeader(res.headers, "apns-unique-id"),
      }
    }

    const responseError = await res.body.json().catch(() => ({
      reason: Errors.unknownError,
      timestamp: Date.now(),
    }))

    const error = new ApnsError({
      statusCode: res.statusCode,
      notification: notification,
      response: responseError as ApnsResponseError,
      headers: res.headers,
    })

    // Reset signing token if expired
    if (error.reason === Errors.expiredProviderToken) {
      this._token = null
    }

    // Emit specific and generic errors
    this.emit(error.reason, error)
    this.emit(Errors.error, error)

    throw error
  }

  private _getSigningToken(): string {
    if (this._token && Date.now() - this._token.timestamp < RESET_TOKEN_INTERVAL_MS) {
      return this._token.value
    }

    const claims = {
      iss: this.team,
      iat: Math.floor(Date.now() / 1000),
    }

    const signer = createSigner({
      key: this.signingKey,
      algorithm: SIGNING_ALGORITHM,
      kid: this.keyId,
    })

    const token = signer(claims)

    this._token = {
      value: token,
      timestamp: Date.now(),
    }

    return token
  }
}
