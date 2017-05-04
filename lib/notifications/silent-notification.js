const Notification = require('./notification')
const priority = require('./priority')

/**
 * @class SilentNotification
 */
class SilentNotification extends Notification {

  /**
   * @constructor
   * @param {String} deviceToken
   * @param {Object} [options] - see super class
   */
  constructor(deviceToken, options) {
    options = options || {}
    super(deviceToken, {
      contentAvailable: true,
      priority: priority.throttled,
      badge: options.badge,
      topic: options.topic,
      expiration: options.expiration,
      data: options.data
    })
  }
}

module.exports = SilentNotification
