const Notification = require('./notification')
const pushType = require('./constants/push-type')
const priority = require('./constants/priority')

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
      pushType: (options.topic.endsWith(".voip"))? pushType.voip : pushType.background,
      priority: priority.throttled,
      badge: options.badge,
      topic: options.topic,
      expiration: options.expiration,
      data: options.data
    })
  }
}

module.exports = SilentNotification
