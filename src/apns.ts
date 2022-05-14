import { sign } from 'jsonwebtoken'
import { EventEmitter } from 'events'
import { Http2Client, Http2ClientRequestOptions, Http2ClientResponse } from './http2-client'
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
 * @desc Default port to send request
 */
const PORT = 443

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
  signingKey: string
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
  readonly signingKey: string
  readonly client: Http2Client
  readonly defaultTopic?: string

  private _token: { value: string | null; timestamp: number } | null

  constructor(options: ApnsOptions) {
    super()
    this.team = options.team
    this.keyId = options.keyId
    this.signingKey = options.signingKey
    this.defaultTopic = options.defaultTopic
    this.client = new Http2Client(options.host ?? HOST, {
      port: options.port,
      requestTimeout: options.requestTimeout,
      pingInterval: options.pingInterval
    })
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

  close() {
    return this.client.close()
  }

  private _send(notification: Notification) {
    const options: Http2ClientRequestOptions = {
      method: 'POST',
      path: `/${API_VERSION}/device/${encodeURIComponent(notification.deviceToken)}`,
      headers: {
        authorization: `bearer ${this._getSigningToken()}`,
        'apns-push-type': notification.pushType,
        'apns-priority': notification.priority.toString(),
        'apns-topic': notification.options.topic ?? this.defaultTopic
      }
    }

    if (notification.options.expiration) {
      options.headers['apns-expiration'] =
        typeof notification.options.expiration === 'number'
          ? notification.options.expiration.toFixed(0)
          : (notification.options.expiration.getTime() / 1000).toFixed(0)
    }

    if (notification.options.collapseId) {
      options.headers['apns-collapse-id'] = notification.options.collapseId
    }

    return this.client
      .request({
        ...options,
        body: JSON.stringify(notification.buildApnsOptions())
      })
      .then((res) => this._handleServerResponse(res, notification))
  }

  /**
   * @private
   * @method _handleServerResponse
   * @param {ServerResponse} res
   * @return {Promise}
   */
  _handleServerResponse(res: Http2ClientResponse, notification: Notification) {
    if (res.statusCode === 200) {
      return notification
    }

    let json

    try {
      json = JSON.parse(res.body)
    } catch (err) {
      json = { reason: Errors.unknownError }
    }

    json.statusCode = res.statusCode
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

    const key = this.signingKey

    let token: string | null

    try {
      token = sign(claims, key, {
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
