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
const RESET_TOKEN_INTERVAL_MS = 55 * 60 * 1000

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
    port = PORT,
    requestTimeout = 5000,
    pingInterval = 60000
  }) {
    if (!team) throw new Error(`team is required`)
    if (!keyId) throw new Error(`keyId is required`)
    if (!signingKey) throw new Error(`signingKey is required`)
    super()
    this._team = team
    this._keyId = keyId
    this._signingKey = signingKey
    this._defaultTopic = defaultTopic
    this._client = new Http2Client(host, { port, requestTimeout, pingInterval })
    this._token = null
    this.on(Errors.expiredProviderToken, () => this._resetSigningToken())
  }

  /**
   * @method send
   * @param {Array<Notification>|Notification} notifications
   * @return {Promise}
   */
  send(notification) {
    return this._sendOne(notification)
  }

  /**
   * @method sendMany
   * @param {Array<Notification>} notifications
   * @return {Promise}
   */
  sendMany(notifications) {
    const promises = notifications.map((notification) => {
      return this._sendOne(notification).catch((error) => ({ error }))
    })
    return Promise.all(promises)
  }

  /**
   * @method close
   * @return {Promise}
   */
  close() {
    return this._client.close()
  }

  /**
   * @private
   * @method _sendOne
   * @param {Notification} notification
   * @return {Promise}
   */
  _sendOne(notification) {
    const options = {
      method: 'POST',
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

    return this._client
      .request({
        ...options,
        body: JSON.stringify(notification.APNSOptions())
      })
      .then((res) => this._handleServerResponse(res, notification))
  }

  /**
   * @private
   * @method _handleServerResponse
   * @param {ServerResponse} res
   * @return {Promise}
   */
  _handleServerResponse(res, notification) {
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
      iss: this._team,
      iat: parseInt(Date.now() / 1000)
    }

    const key = this._signingKey

    const options = {
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

    this._token = {
      value: token,
      timestamp: Date.now()
    }

    return token
  }

  /**
   * @private
   * @method _resetSigningToken
   */
  _resetSigningToken() {
    this._token = null
  }
}

module.exports = {
  APNS,
  Errors,
  Notification,
  BasicNotification,
  SilentNotification
}
