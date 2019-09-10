const Notification = require('./notification')
const pushType = require('./constants/push-type')
const priority = require('./constants/priority')

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
    options.pushType = pushType.alert
    options.priority = priority.immediate
    options.alert = options.alert || {}
    options.alert.body = message
    super(deviceToken, options)
  }
}

module.exports = BasicNotification
