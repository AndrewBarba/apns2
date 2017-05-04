const Notification = require('./notification')
const priority = require('./priority')

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
    options.priority = priority.immediate
    options.alert = options.alert || {}
    options.alert.body = message
    super(deviceToken, options)
  }
}

module.exports = BasicNotification
