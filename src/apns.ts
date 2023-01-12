import { sign, Secret } from 'jsonwebtoken'
import { EventEmitter } from 'events'
import { fetch, RequestInit, Response } from 'fetch-http2'
import { Errors } from './errors'
import { Notification } from './notifications/notification'

/**
 * @const
 * @desc APNS version
 */
const API_VERSION = 3

/**
 * @const
 * @desc Default host to send request
 */
const HOST = `api.push.apple.com`

/**
 * @const
 * @desc Signing algorithm for JSON web token
 */
const SIGNING_ALGORITHM = `ES256`

/**
 * @const
 * @desc Reset our signing token every 55 minutes as reccomended by Apple
 */
const RESET_TOKEN_INTERVAL_MS = 55 * 60 * 1000

export interface ApnsOptions {
  team: string
  signingKey: Secret
  keyId: string
  defaultTopic?: string
  host?: string
  port?: number
  requestTimeout?: number
  pingInterval?: number
  connections?: number
}

export class ApnsClient extends EventEmitter {
  readonly team: string
  readonly keyId: string
  readonly host: string
  readonly signingKey: Secret
  readonly defaultTopic?: string

  private _token: { value: string | null; timestamp: number } | null

  constructor(options: ApnsOptions) {
    super()
    this.team = options.team
    this.keyId = options.keyId
    this.signingKey = options.signingKey
    this.defaultTopic = options.defaultTopic
    this.host = options.host ?? HOST
    this._token = null
    this.on(Errors.expiredProviderToken, () => this._resetSigningToken())
  }

  send(notification: Notification) {
    return this._send(notification)
  }

  sendMany(notifications: Notification[]) {
    const promises = notifications.map((notification) => {
      return this._send(notification).catch((error: any) => ({ error }))
    })
    return Promise.all(promises)
  }

  private async _send(notification: Notification) {
    const token = encodeURIComponent(notification.deviceToken)
    const url = `https://${this.host}/${API_VERSION}/device/${token}`
    const options: RequestInit = {
      method: 'POST',
      headers: {
        authorization: `bearer ${this._getSigningToken()}`,
        'apns-push-type': notification.pushType,
        'apns-priority': notification.priority.toString(),
        'apns-topic': notification.options.topic ?? this.defaultTopic
      },
      body: JSON.stringify(notification.buildApnsOptions())
    }

    if (notification.options.expiration) {
      options.headers!['apns-expiration'] =
        typeof notification.options.expiration === 'number'
          ? notification.options.expiration.toFixed(0)
          : (notification.options.expiration.getTime() / 1000).toFixed(0)
    }

    if (notification.options.collapseId) {
      options.headers!['apns-collapse-id'] = notification.options.collapseId
    }

    const res = await fetch(url, options)

    return this._handleServerResponse(res, notification)
  }

  /**
   * @private
   * @method _handleServerResponse
   * @param {ServerResponse} res
   * @return {Promise}
   */
  async _handleServerResponse(res: Response, notification: Notification) {
    if (res.status === 200) {
      return notification
    }

    let json

    try {
      json = await res.json()
    } catch (err) {
      json = { reason: Errors.unknownError }
    }

    json.statusCode = res.status
    json.notification = notification

    this.emit(json.reason, json)
    this.emit(Errors.error, json)

    throw json
  }

  /**
   * @private
   * @method _getSigningToken
   * @return {String}
   */
  _getSigningToken() {
    if (this._token && Date.now() - this._token.timestamp < RESET_TOKEN_INTERVAL_MS) {
      return this._token.value
    }

    const claims = {
      iss: this.team,
      iat: Math.floor(Date.now() / 1000)
    }

    let token: string | null

    try {
      token = sign(claims, this.signingKey, {
        algorithm: SIGNING_ALGORITHM,
        header: {
          alg: SIGNING_ALGORITHM,
          kid: this.keyId
        }
      })
    } catch (err) {
      token = null
      this.emit(Errors.invalidSigningKey)
    }

    this._token = {
      value: token,
      timestamp: Date.now()
    }

    return token
  }

  _resetSigningToken() {
    this._token = null
  }
}
