const Notification = require('./notification')

/**
 * @class BasicNotification
 */
class BasicNotification extends Notification {
  /**
   * @constructor
   * @param {String} deviceToken
   * @param {Message} message
   * @param {Object} [options] - see super class
   */
  constructor(deviceToken, message, options) {
    options = options || {}
    options.alert = options.alert || {}
    options.alert.body = message
    super(deviceToken, options)
  }
}

module.exports = BasicNotification
