const pushType = require('./constants/push-type')
const priority = require('./constants/priority')

/**
 * @class Notification
 */
class Notification {
  /**
   * @static
   * @prop {Object} pushType
   */
  static get pushType() {
    return pushType
  }

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
   * @prop {Number} pushType
   * @default alert
   */
  get pushType() {
    return this._options.pushType || pushType.alert
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
    if (typeof this._options.contentAvailable === 'boolean') {
      result.aps[`content-available`] = 1
    }

    // Check for sound
    if (typeof this._options.sound === 'string') {
      result.aps.sound = this._options.sound
    }

    // Check for category
    if (typeof this._options.category === 'string') {
      result.aps.category = this._options.category
    }

    // Check for badge
    if (typeof this._options.badge === 'number') {
      result.aps.badge = this._options.badge
    }

    // Check for threadId
    if (typeof this._options.threadId === 'string') {
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
