const _ = require('lodash')
const priority = require('./priority')

/**
 * @class Notification
 */
class Notification {

  /**
   * @static
   * @prop {Object} priority
   */
  static get priority() {
    return priority
  }

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
   * @param {Boolean} [options.contentAvailable]
   * @param {Number} [options.priority]
   * @param {String} [options.topic]
   * @param {String} [options.collapseId]
   * @param {String} [options.threadId]
   * @param {Object} [options.aps] - override all setters
   */
  constructor(deviceToken, options) {
    this._deviceToken = deviceToken
    this._options = options || {}
  }

  /**
   * @prop {String} deviceToken
   */
  get deviceToken() {
    return this._deviceToken
  }

  /**
   * @prop {Number} priority
   * @default 10
   */
  get priority() {
    return this._options.priority || priority.immediate
  }

  /**
   * @prop {Number} expiration
   */
  get expiration() {
    return this._options.expiration
  }

  /**
   * @prop {String} topic
   */
  get topic() {
    return this._options.topic
  }

  /**
   * @prop {String} collapseId
   */
  get collapseId() {
    return this._options.collapseId
  }

  /**
   * @method APNSOptions
   * @return {Object}
   */
  APNSOptions() {

    let result = {
      aps: this._options.aps || {}
    }

    // Check for alert
    if (this._options.alert) {
      result.aps.alert = this._options.alert
    }

    // Check for "silent" notification
    if (_.isBoolean(this._options.contentAvailable)) {
      result.aps[`content-available`] = 1
    }

    // Check for sound
    if (_.isString(this._options.sound)) {
      result.aps.sound = this._options.sound
    }

    // Check for category
    if (_.isString(this._options.category)) {
      result.aps.category = this._options.category
    }

    // Check for badge
    if (_.isNumber(this._options.badge)) {
      result.aps.badge = this._options.badge
    }

    // Check for threadId
    if (_.isString(this._options.threadId)) {
      result.aps[`thread-id`] = this._options.threadId
    }

    // Add optional message data
    for (let key in this._options.data) {
      result[key] = this._options.data[key]
    }

    return result
  }
}

module.exports = Notification
