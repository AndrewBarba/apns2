# APNS2

[![npm version](https://badge.fury.io/js/apns2.svg)](https://badge.fury.io/js/apns2)
[![Twitter](https://img.shields.io/badge/twitter-@andrew_barba-blue.svg?style=flat)](http://twitter.com/andrew_barba)

Node client for connecting to Apple's Push Notification Service using the new HTTP/2 protocol with JSON web tokens.

---

## Create Client

Create an APNS client using a signing key:

```typescript
import { ApnsClient } from 'apns2'

const client = new ApnsClient({
  team: `TFLP87PW54`,
  keyId: `123ABC456`,
  signingKey: fs.readFileSync(`${__dirname}/path/to/auth.p8`),
  defaultTopic: `com.tablelist.Tablelist`
})
```

## Sending Notifications

#### Basic

Send a basic notification with message:

```typescript
import { Notification } from 'apns2'

const bn = new Notification(deviceToken, { alert: 'Hello, World' })

try {
  await client.send(bn)
} catch (err) {
  console.error(err.reason)
}
```

Send a basic notification with message and options:

```typescript
import { Notification } from 'apns2'

const bn = new BasicNotification(deviceToken, {
  alert: 'Hello, World',
  badge: 4,
  data: {
    userId: user.getUserId
  }
})

try {
  await client.send(bn)
} catch (err) {
  console.error(err.reason)
}
```

#### Silent

Send a silent notification using `content-available` key:

```typescript
import { SilentNotification } from 'apns2'

const sn = new SilentNotification(deviceToken)

try {
  await client.send(sn)
} catch (err) {
  console.error(err.reason)
}
```

Note: [Apple recommends](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/pushing_background_updates_to_your_app#2980040) that no options other than the `content-available` flag be sent in order for a notification to truly be silent and wake up your app in the background. Therefore this class does not accept any additional options in the constructor.

#### Many

Send multiple notifications concurrently:

```typescript
import { Notification } from 'apns2'

const notifications = [
  new Notification(deviceToken1, { alert: 'Hello, World' }),
  new Notification(deviceToken2, { alert: 'Hello, World' })
]

try {
  await client.sendMany(notifications)
} catch (err) {
  console.error(err.reason)
}
```

#### Advanced

For complete control over the push notification packet use the base `Notification` class:

```typescript
import { Notification } from 'apns2'

const notification = new Notification(deviceToken, {
  aps: { ... }
})

try {
  await client.send(notification)
} catch(err) {
  console.error(err.reason)
}
```

Available options can be found at [APNS Payload Options](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification#2943363)

## Error Handling

All errors are defined in `./lib/errors.js` and come directly from [APNS Table 4](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/handling_notification_responses_from_apns#3394535)

You can easily listen for these errors by attaching an error handler to the APNS client:

```typescript
import { Errors } from 'apns2'

// Listen for a specific error
client.on(Errors.badDeviceToken, (err) => {
  // Handle accordingly...
  // Perhaps delete token from your database
  console.error(err.reason, err.statusCode, err.notification.deviceToken)
})

// Listen for any error
client.on(Errors.error, (err) => {
  console.error(err.reason, err.statusCode, err.notification.deviceToken)
})
```

## Close Connections

If you need to close connections to Apple's APNS servers in order to allow the Node process to exit, you can tear down the APNS client:

```typescript
await client.close()
```

Once a client is closed you will not be able to use it again. Instead you should instantiate a new client with `new ApnsClient()`.

## Environments

By default the APNS client connects to the production push notification server. This is identical to passing in the options:

```typescript
const client = new ApnsClient({
  host: 'api.push.apple.com',
  port: 443,
  ...
})
```

To connect to the development push notification server, pass the options:

```typescript
const client = new ApnsClient({
  host: 'api.sandbox.push.apple.com'
  ...
})
```

## Requirements

`apns2` requires Node.js v16.14 or later
