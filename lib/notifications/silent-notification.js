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
  constructor(deviceToken, options) {
    options = options || {};
    options.priority = priority.throttled;
    options.silent = true;
    super(deviceToken, options);
  }
}

module.exports = SilentNotification;
