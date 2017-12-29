const _ = require('lodash')
const apnsErrors = require('./errors')
const EventEmitter = require('events').EventEmitter
const jwt = require('jsonwebtoken')
const Promise = require('bluebird')

// Notifications
const Notification = require('./notifications/notification')
const BasicNotification = require('./notifications/basic-notification')
const SilentNotification = require('./notifications/silent-notification')

// HTTP/2 Client
const HTTP2Client = (() => {
  try {
    // try native module
    return require('./http2-client')
  } catch(err) {
    // else fallback to spdy
    return require('./spdy-client')
  }
})()

/**
 * @const
 * @desc APNS version
 */
const API_VERSION = 3

/**
 * @const
 * @desc Number of connections to open up with apns API
 */
const MAX_CONNECTIONS = 8

/**
 * @const
 * @desc Max notifications to send concurrently
 */
const CONCURRENCY = 32

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
 * @desc Reset our signing token every 20 minutes as reccomended by Apple
 */
const RESET_TOKEN_INTERVAL = 20 * 60 * 1000

/**
 * @class APNS
 */
class APNS extends EventEmitter {

  /**
   * @static
   * @prop {Class} Notification
   */
  static get Notification() {
    return Notification
  }

  /**
   * @static
   * @prop {Class} BasicNotification
   */
  static get BasicNotification() {
    return BasicNotification
  }

  /**
   * @static
   * @prop {Class} SilentNotification
   */
  static get SilentNotification() {
    return SilentNotification
  }

  /**
   * @static
   * @prop {Object} errors
   */
  static get errors() {
    return apnsErrors
  }

  /**
   * @constructor
   * @param {Object} options
   * @param {String} [options.team]
   * @param {String} [options.signingKey]
   * @param {String} [options.key]
   * @param {String} [options.host]
   * @param {Int} [options.port]
   * @param {Int} [options.concurrency]
   */
  constructor({ team, keyId, signingKey, defaultTopic=null, host=HOST, port=PORT, concurrency=CONCURRENCY, connections=MAX_CONNECTIONS }) {
    if (!team) throw new Error(`team is required`)
    if (!keyId) throw new Error(`keyId is required`)
    if (!signingKey) throw new Error(`signingKey is required`)
    super()
    this._team = team
    this._keyId = keyId
    this._signingKey = signingKey
    this._defaultTopic = defaultTopic
    this._concurrency = concurrency
    this._clients = _.times(connections, () => new HTTP2Client(host, port))
    this._clientIndex = 0
    this._interval = setInterval(() => this._resetSigningToken(), RESET_TOKEN_INTERVAL).unref()
    this.on(apnsErrors.expiredProviderToken, () => this._resetSigningToken())
  }

  /**
   * @method send
   * @param {Array<Notification>|Notification} notifications
   * @return {Promise}
   */
  send(notifications) {
    if (!_.isArray(notifications)) {
      return this._send(notifications)
    }

    return Promise.map(notifications, notification => {
      return this._send(notification).reflect()
    }, {
      concurrency: this._concurrency
    })
  }

  /**
   * @private
   * @param {HTTP2Client} _nextClient
   */
  get _nextClient() {
    let client = this._clients[this._clientIndex]
    let nextIndex = this._clientIndex + 1
    this._clientIndex = nextIndex < this._clients.length ? nextIndex : 0
    return client
  }

  /**
   * @private
   * @method _send
   * @param {Notification} notification
   * @return {Promise}
   */
  _send(notification) {
    let options = {
      path: `/${API_VERSION}/device/${encodeURIComponent(notification.deviceToken)}`,
      headers: {
        'authorization': `bearer ${this._getSigningToken()}`,
        'apns-priority': notification.priority,
        'apns-topic': notification.topic || this._defaultTopic
      }
    }

    if (notification.expiration) {
      options.headers['apns-expiration'] = parseInt(notification.expiration / 1000)
    }

    if (notification.collapseId) {
      options.headers['apns-collapse-id'] = notification.collapseId
    }

    let body = JSON.stringify(notification.APNSOptions())

    return this._nextClient.post(options, body)
      .then(res => this._handleServerResponse(res, notification))
  }

  /**
   * @private
   * @method _handleServerResponse
   * @param {ServerResponse} res
   * @return {Promise}
   */
  _handleServerResponse(res, notification) {
    let json = {
      success: res.statusCode === 200 ? true : false,
      status: res.statusCode,
      token: notification._deviceToken,
      reason: null,
      notification: notification
    }

    if (res.statusCode === 200)
      return Promise.resolve(json)
    try {
      let body = JSON.parse(res.body)
      if (body.reason) json.reason = body.reason
    } catch(err) {
      json.reason = apnsErrors.unknownError
    }

    this.emit(json.reason, json)
    this.emit(apnsErrors.error, json)

    return Promise.reject(json)
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
      token = this._token = jwt.sign(claims, key, options)
    } catch(err) {
      token = this._token = null
      this.emit(apnsErrors.invalidSigningKey)
    }

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

module.exports = APNS
