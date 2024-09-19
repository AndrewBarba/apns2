import { EventEmitter } from "node:events"
import { type PrivateKey, createSigner } from "fast-jwt"
import { type RequestInit, type Response, fetch } from "fetch-http2"
import { Errors } from "./errors"
import { type Notification, Priority } from "./notifications/notification"

// APNS version
const API_VERSION = 3

// Signing algorithm for JSON web token
const SIGNING_ALGORITHM = "ES256"

// Reset our signing token every 55 minutes as reccomended by Apple
const RESET_TOKEN_INTERVAL_MS = 55 * 60 * 1000

export enum Host {
  production = "api.push.apple.com",
  development = "api.sandbox.push.apple.com",
}

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
  keepAlive?: boolean | number

  // @deprecated Use keepAlive instead
  pingInterval?: number
}

export class ApnsClient extends EventEmitter {
  readonly team: string
  readonly keyId: string
  readonly host: Host | string
  readonly signingKey: string | Buffer | PrivateKey
  readonly defaultTopic?: string
  readonly requestTimeout?: number
  readonly keepAlive?: boolean | number

  // @deprecated Use keepAlive instead
  readonly pingInterval?: number

  private _token: SigningToken | null

  constructor(options: ApnsOptions) {
    super()
    this.team = options.team
    this.keyId = options.keyId
    this.signingKey = options.signingKey
    this.defaultTopic = options.defaultTopic
    this.host = options.host ?? Host.production
    this.requestTimeout = options.requestTimeout
    this.keepAlive = options.keepAlive
    this.pingInterval = options.pingInterval
    this._token = null
    this.on(Errors.expiredProviderToken, () => this._resetSigningToken())
  }

  send(notification: Notification) {
    return this._send(notification)
  }

  sendMany(notifications: Notification[]) {
    const promises = notifications.map((notification) => {
      return this._send(notification).catch((error: unknown) => ({ error }))
    })
    return Promise.all(promises)
  }

  private async _send(notification: Notification) {
    const token = encodeURIComponent(notification.deviceToken)
    const url = `https://${this.host}/${API_VERSION}/device/${token}`
    const headers: Record<string, string | undefined> = {
      authorization: `bearer ${this._getSigningToken()}`,
      "apns-push-type": notification.pushType,
      "apns-topic": notification.options.topic ?? this.defaultTopic,
    }
    const options: RequestInit = {
      method: "POST",
      headers: headers,
      body: JSON.stringify(notification.buildApnsOptions()),
      timeout: this.requestTimeout,
      keepAlive: this.keepAlive ?? this.pingInterval ?? 5000,
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

    const res = await fetch(url, options)

    return this._handleServerResponse(res, notification)
  }

  private async _handleServerResponse(res: Response, notification: Notification) {
    if (res.status === 200) {
      return notification
    }

    let json: {
      statusCode?: number
      notification?: Notification
      reason?: string
    }

    try {
      json = await res.json()
    } catch (err) {
      json = { reason: Errors.unknownError }
    }

    json.statusCode = res.status
    json.notification = notification

    // Emit specific error
    if (json.reason) {
      this.emit(json.reason, json)
    }

    // Emit generic error
    this.emit(Errors.error, json)

    throw json
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

  private _resetSigningToken() {
    this._token = null
  }
}
