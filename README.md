APNS2
=====

[![npm version](https://badge.fury.io/js/apns2.svg)](https://badge.fury.io/js/apns2)

Node client for connecting to Apple's Push Notification Service using the new HTTP/2 protocol with JSON web tokens or signed certificates.

> **Warning** This project is under heavy development. It uses the experimental `http2` package so I would not recommend using this in production until HTTP/2 is officially merged into Node.js core.

## Create Client

#### JSON Web Tokens

Create an APNS client using a signing key:

```javascript
const APNS = require('apns2');

let client = new APNS({
  team: `TFLP87PW54`,
  signingKey: `ubChWXENWGhLDqbABTqvqQ7f`
});
```

Coming soon. [https://developer.apple.com/videos/play/wwdc2016/724/](https://developer.apple.com/videos/play/wwdc2016/724/)

#### Certificates

Create an APNS client using signed certificates:

```javascript
const fs = require('fs');
const APNS = require('apns2');

let client = new APNS({
  cert: fs.readFileSync(`${__dirname}/path/to/cert.pem`),
  key: fs.readFileSync(`${__dirname}/path/to/key.pem`)
});
```

## Sending Notifications

#### Basic

Send a basic notification with message:

```javascript
const BasicNotification = APNS.BasicNotification;

let bn = new BasicNotification(deviceToken, 'Hello, World');

client.send(bn).then(() => {
  // sent successfully
}).catch(err => {
  console.error(err.reason);
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
  console.error(err.reason);
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
  console.error(err.reason);
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
  console.error(err.reason);
});
```

#### Advanced

For complete control over the push notification packet use the base `Notification` class:

```javascript
const Notification = APNS.Notification;

let notification = new Notification(deviceToken, {
  aps: { ... }
});

client.send(notification).then(() => {
  // sent successfully
}).catch(err => {
  console.error(err.reason);
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
  cert: fs.readFileSync(`${__dirname}/path/to/cert.pem`),
  key: fs.readFileSync(`${__dirname}/path/to/key.pem`)
});
```

To connect to the development push notification server, pass the options:

```javascript
let client = new APNS({
  host: 'api.development.push.apple.com',
  port: 443,
  cert: fs.readFileSync(`${__dirname}/path/to/cert.pem`),
  key: fs.readFileSync(`${__dirname}/path/to/key.pem`)
});
```

## Setup Certificates

After adding a certificate in the developer portal, download the `aps.cer` file, open it, and add it to your login keychain.

Then find the newly added certificate in Keychain Access, expand it, and right-click the private key to export it. Save it as `key.p12`.

Move `aps.cer` and `key.p12` to the same directory, perhaps your desktop, and perform the following in that directory:

```bash
$ openssl x509 -in aps.cer -inform DER -outform PEM -out cert.pem
$ openssl pkcs12 -in key.p12 -out key.pem -nodes
```

You can now move the generated `cert.pem` and `key.pem` into your application directory so you can pass in the file path to the `APNS` constructor.

## Requirements

`apns2` is written entirely in ES2015 and therefore requires Node.js v6 or later. I intended to get this working on Node v4 LTS which also supports the relevant ES2015 features, however, v4 does not support [ALPN](https://github.com/nodejs/node-v0.x-archive/issues/5945).
