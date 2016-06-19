'use strict';

const _ = require('lodash');

/**
 * @class Notification
 */
class Notification {

  /**
   * @constructor
   * @param {String} deviceToken
   * @param {Object} [options]
   * @param {Object|String} [options.alert]
   * @param {String} [options.alert.title]
   * @param {String} [options.alert.body]
   * @param {Number} [options.badge]
   * @param {String} [options.sound]
   * @param {String} [options.category]
   * @param {Object} [options.data]
   * @param {Number} [options.content-available]
   * @param {Boolean} [options.silent] - Identical to `content-available`: 1
   * @param {Object} [options.aps] - override all setters
   */
  constructor(deviceToken, options) {
    this._deviceToken = deviceToken;
    this._options = options || {};
  }

  /**
   * @prop {String} deviceToken
   */
  get deviceToken() {
    return this._deviceToken;
  }

  /**
   * @prop {Object} options
   */
  get options() {
    return this._options;
  }

  /**
   * @method APNSOptions
   * @return {Object}
   */
  APNSOptions() {

    let result = {
      aps: this._options.aps || {}
    };

    // Check for alert
    if (this._options.alert) {
      result.aps.alert = this._options.alert;
    }

    // Check for "silent" notification
    if (this._options[`content-available`] || this._options.silent) {
      result.aps[`content-available`] = 1;
    }

    // Check for sound
    if (_.isString(this._options.sound)) {
      result.aps.sound = this._options.sound;
    }

    // Check for category
    if (_.isString(this._options.category)) {
      result.aps.category = this._options.category;
    }

    // Check for badge
    if (_.isNumber(this._options.badge)) {
      result.aps.badge = this._options.badge;
    }

    // Add optional message data
    for (let key in this._options.data) {
      result[key] = this._options.data[key];
    }

    return result;
  }
}

module.exports = Notification;
