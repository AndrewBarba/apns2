APNS2
=====

Node client for connecting to Apple's Push Notification Service using the new HTTP/2 protocol with JSON web tokens or signed certificates.

## Basic Usage

#### Certificates

```javascript
const APNS = require('apns2');
const BasicNotification = APNS.BasicNotification;
const SilentNotification = APNS.SilentNotification;

let client = new APNS({
  cert: fs.readFileSync(`${__dirname}/path/to/cert.pem`, 'utf8'),
  key: fs.readFileSync(`${__dirname}/path/to/key.pem`, 'utf8')
});

// Send a basic notification with message
let bn = new BasicNotification(deviceToken, 'Hello, World');
client.send(bn);

// Send a silent notification using `content-available` key
let sn = new SilentNotification(deviceToken);
client.send(sn);
```

#### JSON Web Tokens

Coming soon. [https://developer.apple.com/videos/play/wwdc2016/724/](https://developer.apple.com/videos/play/wwdc2016/724/)

## Requirements

`apns2` is written entirely in ES2015 and therefore requires Node.js v4 or later.
