'use strict';

const _ = require('lodash');
const apnsErrors = require('./errors');
const HTTP2Client = require('./http2-client');
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
const CONCURRENCY = 8;

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
 * @desc Return a rejected promise if sending the push fails
 */
const REJECT_ON_ERROR = false;

/**
 * @class APNS
 */
class APNS {

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
   * @constructor
   * @param {Object} options
   * @param {String} options.key
   * @param {String} [options.host]
   * @param {Int} [options.port]
   * @param {Int} [options.concurrency]
   * @param {Boolean} [options.rejectOnError]
   */
  constructor(options) {
    this._key = options.key;
    this._concurrency = `concurrency` in options ? options.concurrency : CONCURRENCY;
    this._rejectOnError = `rejectOnError` in options ? options.rejectOnError : REJECT_ON_ERROR;
    this._client = new HTTP2Client(options.host || HOST, options.port || PORT);
  }

  /**
   * @prop {Object} errors
   */
  get errors() {
    return apnsErrors;
  }

  /**
   * @method send
   * @param {Array<Notification>|Notification} notifications
   * @return {Promise}
   */
  send(notifications) {
    let isArray = _.isArray(notifications);
    notifications = isArray ? notifications : [notifications];

    return Promise.map(notifications, notification => {
      return this._send(notification);
    }, {
      concurrency: this._concurrency
    }).then(results => {
      return Promise.resolve(isArray ? results : results[0]);
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
      path: `/${API_VERSION}/device/${encodeURIComponent(notification.deviceToken)}`
    };

    let body = JSON.stringify(notification.APNSOptions());

    return this._client.post(options, body)
      .then(res => this._parseServerResponse(res));
  }

  /**
   * @private
   * @method _parseServerResponse
   * @param {ServerResponse} res
   * @return {Promise}
   */
  _parseServerResponse(res) {
    if (res.statusCode === 200) {
      return Promise.resolve();
    }

    let json;

    try {
      json = JSON.parse(res.body);
    } catch(err) {
      json = { reason: apnsErrors.unknownError };
    }

    return this._rejectOnError ? Promise.reject(json) : Promise.resolve(json);
  }
}

module.exports = APNS;
