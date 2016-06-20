APNS2
=====

Node client for connecting to Apple's Push Notification Service using the new HTTP/2 protocol with JSON web tokens or signed certificates.

> **Warning** This project is under heavy development and the API could change at any time. It also uses the experimental `spdy` package so I would not recommend using this in production until HTTP/2 is officially merged into Node.js core.

## Create Client

#### Certificates

Create an APNS client using signed certificates:

```javascript
const APNS = require('apns2');

let client = new APNS({
  cert: fs.readFileSync(`${__dirname}/path/to/cert.pem`, 'utf8'),
  key: fs.readFileSync(`${__dirname}/path/to/key.pem`, 'utf8')
});
```

#### JSON Web Tokens

Create an APNS client using a singing token:

Coming soon. [https://developer.apple.com/videos/play/wwdc2016/724/](https://developer.apple.com/videos/play/wwdc2016/724/)

## Sending Notifications

#### Basic

Send a basic notification with message:

```javascript
const BasicNotification = APNS.BasicNotification;

let bn = new BasicNotification(deviceToken, 'Hello, World');

client.send(bn).then(() => {
  // sent successfully
}).catch(err => {
  console.log(err.reason);
});
```

Send a basic notification with message and options:

```javascript
const BasicNotification = APNS.BasicNotification;

let bn = new BasicNotification(deviceToken, 'Hello, World', {
  badge: 4,
  data: {
    userId: user.getUserId
  }
});

client.send(bn).then(() => {
  // sent successfully
}).catch(err => {
  console.log(err.reason);
});
```

#### Silent

Send a silent notification using `content-available` key:

```javascript
const SilentNotification = APNS.SilentNotification;

let sn = new SilentNotification(deviceToken);

client.send(sn).then(() => {
  // sent successfully
}).catch(err => {
  console.log(err.reason);
});
```

Send a silent notification with options:

```javascript
const SilentNotification = APNS.SilentNotification;

let sn = new SilentNotification(deviceToken, {
  badge: getUnreadNotificationCount()
});

client.send(sn).then(() => {
  // sent successfully
}).catch(err => {
  console.log(err.reason);
});
```

#### Advanced

For complete control over the push notification packet use the base `Notification` class:

```javascript
const Notification = APNS.Notification;

let notification = new Notification(devideToken, {
  aps: { ... }
});

client.send(notification).then(() => {
  // sent successfully
}).catch(err => {
  console.log(err.reason);
});
```

Available options can be found at [APNS Payload Options](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/TheNotificationPayload.html#//apple_ref/doc/uid/TP40008194-CH107-SW1)

## Error Handling

All errors are defined in `./lib/errors.js` and come directly from [APNS Table 6-6](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/APNsProviderAPI.html#//apple_ref/doc/uid/TP40008194-CH101-SW5)

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
client.on('error', err => {
  console.error(err.reason, err.statusCode, err.notification.deviceToken);
});
```

## Environments

By default the APNS client connects to the production push notification server. This is identical to passing in the options:

```javascript
let client = new APNS({
  host: 'api.push.apple.com',
  port: 443,
  cert: fs.readFileSync(`${__dirname}/path/to/cert.pem`, 'utf8'),
  key: fs.readFileSync(`${__dirname}/path/to/key.pem`, 'utf8')
});
```

To connect to the development push notification server, pass the options:

```javascript
let client = new APNS({
  host: 'api.development.push.apple.com',
  port: 443,
  cert: fs.readFileSync(`${__dirname}/path/to/cert.pem`, 'utf8'),
  key: fs.readFileSync(`${__dirname}/path/to/key.pem`, 'utf8')
});
```

## Requirements

`apns2` is written entirely in ES2015 and therefore requires Node.js v4 or later.
