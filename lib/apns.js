const { EventEmitter } = require('events')
const jwt = require('jsonwebtoken')
const Http2Client = require('./http2-client')
const Errors = require('./errors')
const Notification = require('./notifications/notification')
const BasicNotification = require('./notifications/basic-notification')
const SilentNotification = require('./notifications/silent-notification')

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
const RESET_TOKEN_INTERVAL = 55 * 60 * 1000

/**
 * @class APNS
 */
class APNS extends EventEmitter {
  /**
   * @constructor
   * @param {Object} options
   * @param {String} [options.team]
   * @param {String} [options.signingKey]
   * @param {String} [options.key]
   * @param {String} [options.host]
   * @param {Int} [options.port]
   * @param {Int} [options.connections]
   */
  constructor({
    team,
    keyId,
    signingKey,
    defaultTopic = null,
    host = HOST,
    port = PORT
  }) {
    if (!team) throw new Error(`team is required`)
    if (!keyId) throw new Error(`keyId is required`)
    if (!signingKey) throw new Error(`signingKey is required`)
    super()
    this._team = team
    this._keyId = keyId
    this._signingKey = signingKey
    this._defaultTopic = defaultTopic
    this._host = host
    this._port = port
    this._client = null
    this._interval = setInterval(() => this._resetSigningToken(), RESET_TOKEN_INTERVAL).unref()
    this.on(Errors.expiredProviderToken, () => this._resetSigningToken())
  }

  /**
   * @method send
   * @param {Array<Notification>|Notification} notifications
   * @return {Promise}
   */
  async send(notifications) {
    if (Array.isArray(notifications)) {
      console.warn('#send(Array<Notification>) is deprecated. Please use #sendMany()') // eslint-disable-line no-console
      return this.sendMany(notifications)
    } else {
      return this._sendOne(notifications)
    }
  }

  /**
   * @method sendMany
   * @param {Array<Notification>} notifications
   * @return {Promise}
   */
  async sendMany(notifications) {
    let promises = notifications.map(async (notification) => {
      try {
        return await this._sendOne(notification)
      } catch (error) {
        return { error }
      }
    })
    return Promise.all(promises)
  }

  /**
   * @method destroy
   * @return {Promise}
   */
  async destroy() {
    if (this._client) {
      this._client.destroy()
    }
  }

  /**
   * @private
   * @method _sendOne
   * @param {Notification} notification
   * @return {Promise}
   */
  async _sendOne(notification) {
    let options = {
      path: `/${API_VERSION}/device/${encodeURIComponent(notification.deviceToken)}`,
      headers: {
        authorization: `bearer ${this._getSigningToken()}`,
        'apns-push-type': notification.pushType,
        'apns-priority': notification.priority,
        'apns-topic': notification.topic || this._defaultTopic
      }
    }

    if (notification.expiration) {
      options.headers['apns-expiration'] = notification.expiration.getTime
        ? parseInt(notification.expiration.getTime() / 1000)
        : parseInt(notification.expiration)
    }

    if (notification.collapseId) {
      options.headers['apns-collapse-id'] = notification.collapseId
    }

    if (!this._client || !this._client.ready) {
      this._client = new Http2Client(this._host, this._port).connect()
    }

    let body = JSON.stringify(notification.APNSOptions())
    let res = await this._client.post(options, body)
    return this._handleServerResponse(res, notification)
  }

  /**
   * @private
   * @method _handleServerResponse
   * @param {ServerResponse} res
   * @return {Promise}
   */
  async _handleServerResponse(res, notification) {
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
    if (this._token) {
      return this._token
    }

    let claims = {
      iss: this._team,
      iat: parseInt(Date.now() / 1000)
    }

    let key = this._signingKey

    let options = {
      algorithm: SIGNING_ALGORITHM,
      header: {
        alg: SIGNING_ALGORITHM,
        kid: this._keyId
      }
    }

    let token

    try {
      token = jwt.sign(claims, key, options)
    } catch (err) {
      token = null
      this.emit(Errors.invalidSigningKey)
    }

    this._token = token

    return token
  }

  /**
   * @private
   * @method _resetSigningToken
   */
  _resetSigningToken() {
    this._token = null
    return this._getSigningToken()
  }
}

module.exports = {
  APNS,
  Errors,
  Notification,
  BasicNotification,
  SilentNotification
}
