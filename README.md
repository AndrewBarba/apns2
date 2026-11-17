# apns2

[![npm version](https://badge.fury.io/js/apns2.svg)](https://badge.fury.io/js/apns2)
[![Twitter](https://img.shields.io/badge/twitter-@andrew_barba-blue.svg?style=flat)](http://twitter.com/andrew_barba)

Node client for connecting to Apple's Push Notification Service using the new HTTP/2 protocol with JSON web tokens.

---

## Create Client

Create an APNS client using a signing key:

```typescript
import { readFileSync } from 'node:fs'
import { ApnsClient } from 'apns2'

const client = new ApnsClient({
  team: `TFLP87PW54`,
  keyId: `123ABC456`,
  signingKey: readFileSync(new URL('./path/to/auth.p8', import.meta.url)),
  defaultTopic: `com.tablelist.Tablelist`,
  requestTimeout: 300000, // optional, Default: 300000 (5 minutes). 0 disables timeouts, including detection of dead connections
  keepAlive: true, // optional, Default: true
})
```

## Sending Notifications

#### Basic

Send a basic notification with message:

```typescript
import { Notification } from 'apns2'

const bn = new Notification(deviceToken, { alert: 'Hello, World' })

try {
  const response = await client.send(bn)
  console.log(response.apnsId)
} catch (err) {
  console.error(err.reason)
}
```

`send()` resolves with an `ApnsSendResponse`:

| Property | Description |
|---|---|
| `notification` | The notification that was sent |
| `statusCode` | HTTP status code from APNs (`200`) |
| `headers` | Response headers from APNs |
| `apnsId` | The `apns-id` APNs assigned to the notification, or the one you set with the `id` option |
| `apnsUniqueId` | The `apns-unique-id` for debugging with Apple's tools. Only returned by the development environment |

Device tokens must be hex strings. If you have the raw bytes in a `Buffer`, pass `token.toString('hex')`.

Send a basic notification with message and options:

```typescript
import { Notification } from 'apns2'

const bn = new Notification(deviceToken, {
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
import { ApnsError, Notification } from 'apns2'

const notifications = [
  new Notification(deviceToken1, { alert: 'Hello, World' }),
  new Notification(deviceToken2, { alert: 'Hello, World' })
]

const results = await client.sendMany(notifications)

for (const result of results) {
  if ('error' in result) {
    if (result.error instanceof ApnsError) {
      // Rejected by APNs
      console.error(result.notification.deviceToken, result.error.reason)
    } else {
      // Transport error, e.g. a dropped connection; you may want to retry
      console.error(result.notification.deviceToken, result.error.message)
    }
  } else {
    console.log(result.apnsId)
  }
}
```

`sendMany()` never rejects. It resolves with one result per notification, in the same order: either an `ApnsSendResponse` or `{ notification, error }`.

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

#### Live Activities

Live Activity updates use the `liveactivity` push type, and the topic must be your bundle ID with `.push-type.liveactivity` appended:

```typescript
import { Notification, Priority, PushType } from 'apns2'

const notification = new Notification(liveActivityPushToken, {
  type: PushType.liveactivity,
  topic: 'com.example.app.push-type.liveactivity',
  priority: Priority.immediate,
  aps: {
    timestamp: Math.floor(Date.now() / 1000),
    event: 'update',
    'content-state': { progress: 0.5 },
  },
})

await client.send(notification)
```

The same pattern applies to the other push types (`PushType.controls`, `PushType.widgets`, and so on). Each has its own topic suffix; see Apple's [push type documentation](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns#Know-when-to-use-push-types).

#### Notification IDs

Set the `apns-id` header with the `id` option. It must be a canonical UUID. If you leave it out, APNs generates one:

```typescript
import { randomUUID } from 'node:crypto'

const notification = new Notification(deviceToken, { alert: 'Hello', id: randomUUID() })
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

// Errors include the APNs response headers, e.g. err.apnsId

// Listen for any error
client.on(Errors.error, (err) => {
  console.error(err.reason, err.statusCode, err.notification.deviceToken)
})
```
## Environments

By default the APNS client connects to the production push notification server. This is identical to passing in the options:

```typescript
const client = new ApnsClient({
  host: 'api.push.apple.com'
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

`apns2` requires Node.js v24 or later. It also runs on [Bun](https://bun.sh)
