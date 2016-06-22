'use strict';

const Notification = require('./notification');
const priority = require('./priority');

/**
 * @class SilentNotification
 */
class SilentNotification extends Notification {

  /**
   * @constructor
   * @param {String} deviceToken
   * @param {Object} [options] - see super class
   */
  constructor(deviceToken) {
    super(deviceToken, {
      contentAvailable: true,
      priority: priority.throttled
    });
  }
}

module.exports = SilentNotification;
