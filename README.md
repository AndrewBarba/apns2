APNS2
=====

[![npm version](https://badge.fury.io/js/apns2.svg)](https://badge.fury.io/js/apns2)
[![Twitter](https://img.shields.io/badge/twitter-@andrew_barba-blue.svg?style=flat)](http://twitter.com/andrew_barba)

Node client for connecting to Apple's Push Notification Service using the new HTTP/2 protocol with JSON web tokens.

> Now uses the native `http2` module in Node.js v8.4.0 when exposed with `--expose-http2`

> On earlier versions of Node.js we fallback to the `node-spdy` module

---

## Create Client

Create an APNS client using a signing key:

```javascript
const APNS = require('apns2');

let client = new APNS({
  team: `TFLP87PW54`,
  keyId: `123ABC456`,
  signingKey: fs.readFileSync(`${__dirname}/path/to/auth.p8`),
  defaultTopic: `com.tablelist.Tablelist`
});
```

## Sending Notifications

#### Basic

Send a basic notification with message:

```javascript
const { BasicNotification } = APNS;

let bn = new BasicNotification(deviceToken, 'Hello, World');

client.send(bn).then(() => {
  // sent successfully
}).catch(err => {
  console.error(err.reason);
});
```

Send a basic notification with message and options:

```javascript
const { BasicNotification } = APNS;

let bn = new BasicNotification(deviceToken, 'Hello, World', {
  badge: 4,
  data: {
    userId: user.getUserId
  }
});

client.send(bn).then(() => {
  // sent successfully
}).catch(err => {
  console.error(err.reason);
});
```

#### Silent

Send a silent notification using `content-available` key:

```javascript
const { SilentNotification } = APNS;

let sn = new SilentNotification(deviceToken);

client.send(sn).then(() => {
  // sent successfully
}).catch(err => {
  console.error(err.reason);
});
```

Note: [Apple recommends](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CreatingtheNotificationPayload.html#//apple_ref/doc/uid/TP40008194-CH10-SW8) that no options other than the `content-available` flag be sent in order for a notification to truly be silent and wake up your app in the background. Therefore this class does not accept any additional options in the constructor.

#### Advanced

For complete control over the push notification packet use the base `Notification` class:

```javascript
const { Notification } = APNS;

let notification = new Notification(deviceToken, {
  aps: { ... }
});

client.send(notification).then(() => {
  // sent successfully
}).catch(err => {
  console.error(err.reason);
});
```

Available options can be found at [APNS Payload Options](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/PayloadKeyReference.html#//apple_ref/doc/uid/TP40008194-CH17-SW1)

## Error Handling

All errors are defined in `./lib/errors.js` and come directly from [APNS Table 8-6](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CommunicatingwithAPNs.html#//apple_ref/doc/uid/TP40008194-CH11-SW17)

You can easily listen for these errors by attaching an error handler to the APNS client:

```javascript
const errors = APNS.errors;

// Listen for a specific error
client.on(errors.badDeviceToken, err => {
  // Handle accordingly...
  // Perhaps delete token from your database
  console.error(err.reason, err.statusCode, err.notification.deviceToken);
});

// Listen for any error
client.on(errors.error, err => {
  console.error(err.reason, err.statusCode, err.notification.deviceToken);
});
```

## Environments

By default the APNS client connects to the production push notification server. This is identical to passing in the options:

```javascript
let client = new APNS({
  host: 'api.push.apple.com',
  port: 443,
  ...
});
```

To connect to the development push notification server, pass the options:

```javascript
let client = new APNS({
  host: 'api.development.push.apple.com'
  ...
});
```

## Requirements

`apns2` requires Node.js v6

#### Native http2

To use the new built in `http2` library in Node.js v8.4.0 you must start your node process with `node --expose-http2`. apns2 will automatically pick up the native module and use it instead of `node-spdy`.
