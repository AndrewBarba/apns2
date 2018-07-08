const _ = require('lodash')
const Promise = require('bluebird')
const { EventEmitter } = require('events')
const { Pool } = require('tarn')
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
 * @desc Number of connections to open up with apns API
 */
const MAX_CONNECTIONS = 10

/**
 * @const
 * @desc Max notifications to send concurrently
 */
const CONCURRENCY = 64

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
 * @desc Reset our signing token every 59 minutes as reccomended by Apple
 */
const RESET_TOKEN_INTERVAL = 59 * 60 * 1000

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
    this._clients = this._createClientPool({ host, port, connections })
    this._interval = setInterval(() => this._resetSigningToken(), RESET_TOKEN_INTERVAL).unref()
    this.on(Errors.expiredProviderToken, () => this._resetSigningToken())
  }

  /**
   * @private
   * @method _createClientPool
   * @param {String} host
   * @param {Number} port
   * @return {Pool}
   */
  _createClientPool({ host, port, connections }) {
    return new Pool({
      create: cb => new Http2Client(host, port).connect().asCallback(cb),
      validate: client => client.ready,
      destroy: client => client.destroy(),
      min: 0,
      max: connections
    })
  }

  /**
   * @private
   * @method _acquireClient
   * @return {Promise}
   */
  async _acquireClient() {
    return this._clients.acquire().promise
  }

  /**
   * @private
   * @method _acquireClient
   * @return {Promise}
   */
  _releaseClient(client) {
    return this._clients.release(client)
  }

  /**
   * @method send
   * @param {Array<Notification>|Notification} notifications
   * @return {Promise}
   */
  async send(notifications) {
    if (!_.isArray(notifications)) {
      return this._send(notifications)
    }

    return Promise.map(notifications, async notification => {
      try {
        return await this._send(notification)
      } catch(error) {
        return { error }
      }
    }, {
      concurrency: this._concurrency
    })
  }

  /**
   * @private
   * @method _send
   * @param {Notification} notification
   * @return {Promise}
   */
  async _send(notification) {
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

    let client = await this._acquireClient()
    try {
      let res = await client.post(options, body)
      this._releaseClient(client)
      return this._handleServerResponse(res, notification)
    } catch(err) {
      this._releaseClient(client)
      throw err
    }
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
    } catch(err) {
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
    } catch(err) {
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
