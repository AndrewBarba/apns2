'use strict';

const APNS = require('../index');
const BasicNotification = APNS.BasicNotification;
const SilentNotification = APNS.SilentNotification;

// Create connection
let apns = new APNS({
  team: 'AndrewBarba',
  key: 'abcdefghijklmnopqrstuvwxyz'
});

// Create basic notification
let basicNotification = new BasicNotification('1234', 'Hello, World');

// Create silent notification
let silentNotification = new SilentNotification('1234');

it('should send a notification', () => {
  return apns.send([basicNotification, silentNotification]).then(result => {
    console.log(result);
  }).catch(err => {
    console.error(err);
  });
});
