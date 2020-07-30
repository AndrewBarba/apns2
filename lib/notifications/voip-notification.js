const Notification = require('./notification')
const pushType = require('./constants/push-type')
const priority = require('./constants/priority')

/**
 * @class VoipNotification
 */
class VoipNotification extends Notification {
  /**
   * @constructor
   * @param {String} deviceVoipToken
   * @param {Object} [options] - see super class
   */
  constructor(deviceVoipToken, options) {
    options = options || {}
    super(deviceVoipToken, {
      contentAvailable: true,
      pushType: options.pushType || pushType.voip,
      priority: options.priority || priority.throttled,
      topic: options.topic,
      expiration: options.expiration,
      data: options.data
    })

    // modify the super class' default topic
    if (!options.topic) this.topic = `${this.topic}.voip`
  }
}

module.exports = VoipNotification
