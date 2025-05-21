import { EventEmitter } from "node:events"
import { type PrivateKey, createSigner } from "fast-jwt"
import { type Dispatcher, Pool } from "undici"
import { ApnsError, type ApnsResponseError, Errors } from "./errors.js"
import { undici_getClientHttp2Session, undici_getPoolClients } from "./internals.js"
import { type Notification, Priority } from "./notifications/notification.js"

// APNS version
const API_VERSION = 3

// Signing algorithm for JSON web token
const SIGNING_ALGORITHM = "ES256"

// Reset our signing token every 55 minutes as reccomended by Apple
const RESET_TOKEN_INTERVAL_MS = 55 * 60 * 1000

// Ping the server every 10 minutes as reccomended by Apple
const PING_INTERVAL_MS = 10 * 60 * 1000

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

export class ApnsClient extends EventEmitter {
  readonly team: string
  readonly keyId: string
  readonly host: Host | string
  readonly signingKey: string | Buffer | PrivateKey
  readonly defaultTopic?: string
  readonly keepAlive: boolean
  readonly client: Pool

  private _token: SigningToken | null
  private _pingInterval: NodeJS.Timeout | null

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
      maxConcurrentStreams: 100,
    })
    this._token = null
    this._pingInterval = this.keepAlive
      ? setInterval(() => this.ping(), PING_INTERVAL_MS).unref()
      : null
  }

  sendMany(notifications: Notification[]) {
    const promises = notifications.map((notification) =>
      this.send(notification).catch((error: ApnsError) => ({ error })),
    )
    return Promise.all(promises)
  }

  async send(notification: Notification) {
    const headers: Record<string, string | undefined> = {
      authorization: `bearer ${this._getSigningToken()}`,
      "apns-push-type": notification.pushType,
      "apns-topic": notification.options.topic ?? this.defaultTopic,
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
    if (this._pingInterval) {
      clearInterval(this._pingInterval)
      this._pingInterval = null
    }
    await this.client.close()
  }

  async destroy(err?: Error | null) {
    if (this._pingInterval) {
      clearInterval(this._pingInterval)
      this._pingInterval = null
    }
    await this.client.destroy(err ?? null)
  }

  private async _handleServerResponse(res: Dispatcher.ResponseData, notification: Notification) {
    if (res.statusCode === 200) {
      return notification
    }

    const responseError = await res.body.json().catch(() => ({
      reason: Errors.unknownError,
      timestamp: Date.now(),
    }))

    const error = new ApnsError({
      statusCode: res.statusCode,
      notification: notification,
      response: responseError as ApnsResponseError,
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
