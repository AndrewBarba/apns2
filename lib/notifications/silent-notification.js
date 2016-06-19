'use strict';

const Notification = require('./notification');

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
    options.silent = true;
    super(deviceToken, options);
  }
}

module.exports = SilentNotification;
