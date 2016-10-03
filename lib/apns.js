'use strict';

const _ = require('lodash');
const apnsErrors = require('./errors');
const EventEmitter = require('events').EventEmitter;
const HTTP2Client = require('./http2-client');
const jwt = require('jsonwebtoken');
const Promise = require('bluebird');

// Notifications
const Notification = require('./notifications/notification');
const BasicNotification = require('./notifications/basic-notification');
const SilentNotification = require('./notifications/silent-notification');

/**
 * @const
 * @desc APNS version
 */
const API_VERSION = 3;

/**
 * @const
 * @desc Max notifications to send concurrently
 */
const CONCURRENCY = 32;

/**
 * @const
 * @desc Default host to send request
 */
const HOST = `api.push.apple.com`;

/**
 * @const
 * @desc Default port to send request
 */
const PORT = 443;

/**
 * @const
 * @desc Signing algorithm for JSON web token
 */
const SIGNING_ALGORITHM = `ES256`;

/**
 * @const
 * @desc Reset our signing token every 20 minutes as reccomended by Apple
 */
const RESET_TOKEN_INTERVAL = 20 * 60 * 1000;

/**
 * @class APNS
 */
class APNS extends EventEmitter {

  /**
   * @static
   * @prop {Class} Notification
   */
  static get Notification() {
    return Notification;
  }

  /**
   * @static
   * @prop {Class} BasicNotification
   */
  static get BasicNotification() {
    return BasicNotification;
  }

  /**
   * @static
   * @prop {Class} SilentNotification
   */
  static get SilentNotification() {
    return SilentNotification;
  }

  /**
   * @static
   * @prop {Object} errors
   */
  static get errors() {
    return apnsErrors;
  }

  /**
   * @constructor
   * @param {Object} options
   * @param {String} [options.team]
   * @param {String} [options.signingKey]
   * @param {String} [options.key]
   * @param {String} [options.cert]
   * @param {String} [options.host]
   * @param {Int} [options.port]
   * @param {Int} [options.concurrency]
   */
  constructor(options) {
    super();
    this._team = options.team;
    this._key = options.key;
    this._cert = options.cert;
    this._pfx = options.pfx;
    this._passphrase = options.passphrase;
    this._signingKey = options.signingKey;
    this._keyId = options.keyId;
    this._defaultTopic = options.defaultTopic;
    this._concurrency = options.concurrency || CONCURRENCY;
    this._client = new HTTP2Client(options.host || HOST, options.port || PORT);
    this._interval = setInterval(() => this._resetSigningToken(), RESET_TOKEN_INTERVAL).unref();
    this.on(apnsErrors.expiredProviderToken, () => this._resetSigningToken());
  }

  /**
   * @method send
   * @param {Array<Notification>|Notification} notifications
   * @return {Promise}
   */
  send(notifications) {
    if (!_.isArray(notifications)) {
      return this._send(notifications);
    }

    return Promise.map(notifications, notification => {
      return new Promise(resolve => {
        this._send(notification).finally(resolve);
      });
    }, {
      concurrency: this._concurrency
    });
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
        'apns-priority': notification.priority,
      }
    };

    if (notification.expiration) {
      options.headers['apns-expiration'] = parseInt(notification.expiration / 1000);
    }

    if (this._defaultTopic) {
      options.headers['apns-topic'] = this._defaultTopic;
    }

    if (notification.topic) {
      options.headers['apns-topic'] = notification.topic;
    }

    if (notification.collapseId) {
      options.headers['apns-collapse-id'] = notification.collapseId;
    }

    if (this._cert) {
      options.cert = this._cert;
    }

    if (this._key) {
      options.key = this._key;
    }

    if (this._pfx) {
      options.pfx = this._pfx;
    }

    if (this._passphrase) {
      options.passphrase = this._passphrase;
    }

    if (this._signingKey) {
      options.headers.authorization = `bearer ${this._getSigningToken()}`;
    }

    let body = JSON.stringify(notification.APNSOptions());

    return this._client.post(options, body)
      .then(res => this._handleServerResponse(res, notification));
  }

  /**
   * @private
   * @method _handleServerResponse
   * @param {ServerResponse} res
   * @return {Promise}
   */
  _handleServerResponse(res, notification) {
    if (res.statusCode === 200) {
      return Promise.resolve(notification);
    }

    let json;

    try {
      json = JSON.parse(res.body);
    } catch(err) {
      json = { reason: apnsErrors.unknownError };
    }

    json.statusCode = res.statusCode;
    json.notification = notification;

    this.emit(json.reason, json);
    this.emit(apnsErrors.error, json);

    return Promise.reject(json);
  }

  /**
   * @private
   * @method _getSigningToken
   * @return {String}
   */
  _getSigningToken() {
    if (this._token) {
      return this._token;
    }

    let claims = {
      iss: this._team,
      iat: parseInt(Date.now() / 1000)
    };

    let key = this._signingKey;

    let options = {
      algorithm: SIGNING_ALGORITHM,
      header: {
        alg: SIGNING_ALGORITHM,
        kid: this._keyId
      }
    };

    let token;

    try {
      token = this._token = jwt.sign(claims, key, options);
    } catch(err) {
      token = this._token = null;
      this.emit(apnsErrors.invalidSigningKey);
    }

    return token;
  }

  /**
   * @private
   * @method _resetSigningToken
   */
  _resetSigningToken() {
    this._token = null;
    return this._getSigningToken();
  }
}

module.exports = APNS;
