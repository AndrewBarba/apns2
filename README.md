APNS2
=====

Node client for connecting to Apple's Push Notification Service using the new HTTP/2 protocol with JSON web tokens or signed certificates.

## Basic Usage

#### Certificates

```javascript
const APNS = require('apns2');
const BasicNotification = APNS.BasicNotification;
const SilentNotification = APNS.SilentNotification;

// Create client
let client = new APNS({
  cert: fs.readFileSync(`${__dirname}/path/to/cert.pem`, 'utf8'),
  key: fs.readFileSync(`${__dirname}/path/to/key.pem`, 'utf8')
});

// Send a basic notification with message
let bn = new BasicNotification(deviceToken, 'Hello, World');
client.send(bn).then(() => {
  // sent successfully
}).catch(err => {
  console.log(err.reason);
});

// Send a silent notification using `content-available` key
let sn = new SilentNotification(deviceToken);
client.send(sn).then(() => {
  // sent successfully
}).catch(err => {
  console.log(err.reason);
});

// Send multiple notifications concurrently
client.send([bn, sn]).then(() => {
  // This will always be called
  // Sending multiple notifications at once will never reject the promise
});
```

#### JSON Web Tokens

Coming soon. [https://developer.apple.com/videos/play/wwdc2016/724/](https://developer.apple.com/videos/play/wwdc2016/724/)

## Error Handling

All errors are defined in `./lib/errors.js` and come directly from [APNS Table 6-6](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/APNsProviderAPI.html#//apple_ref/doc/uid/TP40008194-CH101-SW5)

You can easily listen for these errors by attaching error handler to the APNS client:

```javascript
const APNS = require('apns2');
const errors = APNS.errors;

// Create client
let client = new APNS({
  cert: fs.readFileSync(`${__dirname}/path/to/cert.pem`, 'utf8'),
  key: fs.readFileSync(`${__dirname}/path/to/key.pem`, 'utf8')
});

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
