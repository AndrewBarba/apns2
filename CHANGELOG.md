# Change Log

`apns2` follows [Semantic Versioning](http://semver.org/)

---

## [12.2.0](https://github.com/AndrewBarba/apns2/releases/tag/12.2.0)

1. Send http2 ping frames for better support of long lived node processes
2. Remove native typescript enums in favor of regular JS constants

## [12.1.0](https://github.com/AndrewBarba/apns2/releases/tag/12.1.0)

1. Add back commonjs support

## [12.0.0](https://github.com/AndrewBarba/apns2/releases/tag/12.0.0)

1. Migrate to Undici v7
2. ESM
3. Drop support for Node 16 and 18

## [11.7.1](https://github.com/AndrewBarba/apns2/releases/tag/11.7.1)

1. Fix issue with `expiration` option
   [#88](https://github.com/AndrewBarba/apns2/issues/88)

## [11.7.0](https://github.com/AndrewBarba/apns2/releases/tag/11.7.0)

1. Update `fast-jwt` to v4

## [11.6.0](https://github.com/AndrewBarba/apns2/releases/tag/11.6.0)

1. Fix issue with `contentAvailable`
2. Add support for `mutableContent`

## [11.5.0](https://github.com/AndrewBarba/apns2/releases/tag/11.5.0)

1. Add `ApnsClient.keepAlive`
2. Deprecate `ApnsClient.pingInterval`

## [11.4.0](https://github.com/AndrewBarba/apns2/releases/tag/11.4.0)

1. Add `location` push type
2. Add `pushtotalk` push type

## [11.3.0](https://github.com/AndrewBarba/apns2/releases/tag/11.3.0)

1. Add `Priority.low`
2. Fix options `requestTimeout` and `pingInterval`
3. Convert to [Biome](https://biomejs.dev)

## [11.2.0](https://github.com/AndrewBarba/apns2/releases/tag/11.2.0)

1. Define new `Host` enum for specifying APNS host
2. Add `liveactivity` push type

Thank you [278204](https://github.com/278204) and
[icodebuster](https://github.com/icodebuster)

## [11.1.0](https://github.com/AndrewBarba/apns2/releases/tag/11.1.0)

1. Accept all options when sending a silent notification

## [11.0.1](https://github.com/AndrewBarba/apns2/releases/tag/11.0.1)

1. Add back support for Node.js 16.x

## [11.0.0](https://github.com/AndrewBarba/apns2/releases/tag/11.0.0)

1. Built for Node.js 18
2. Drops support for all versions of Node <18

## [10.1.0](https://github.com/AndrewBarba/apns2/releases/tag/10.1.0)

1. Add support for alert subtitle

## [10.0.1](https://github.com/AndrewBarba/apns2/releases/tag/10.0.1)

1. Re-written in TypeScript
2. Adjust distribution files
3. Only allow data options in `SilentNotification` constructor

## [10.0.0](https://github.com/AndrewBarba/apns2/releases/tag/10.0.0)

1. Re-written in TypeScript

## [9.3.0](https://github.com/AndrewBarba/apns2/releases/tag/9.3.0)

1. Update token refresh logic to avoid `TooManyProviderTokenUpdates`

## [9.2.0](https://github.com/AndrewBarba/apns2/releases/tag/9.2.0)

1. Allow disabling pingInterval
2. Fix issue with missing ping callback

## [9.1.0](https://github.com/AndrewBarba/apns2/releases/tag/9.1.0)

1. Correctly handle socket error events
2. Lazily connect on first request
3. Keeps socket alive with ping request every 60s

## [9.0.0](https://github.com/AndrewBarba/apns2/releases/tag/9.0.0)

1. Full code cleanup
2. Removes tarn
3. Requires Node v12 or newer
4. Rename `destroy()` to `close()`

## [8.5.0](https://github.com/AndrewBarba/apns2/releases/tag/8.5.0)

1. Fix TypeScript typings
2. New push types and error constants
3. Add prettier

## [8.4.0](https://github.com/AndrewBarba/apns2/releases/tag/8.4.0)

1. Add `client.destroy()` to kill all outstanding connections to apns servers.
2. Upgrade tarn to v3

## [8.3.0](https://github.com/AndrewBarba/apns2/releases/tag/8.3.0)

1. Add voip support

## [8.2.0](https://github.com/AndrewBarba/apns2/releases/tag/8.2.0)

1. Add correct TypeScript definitions for `NotificationOptions`

## [8.1.0](https://github.com/AndrewBarba/apns2/releases/tag/8.1.0)

1. Add missing TypeScript interface for `NotificationOptions`
2. Remove lodash dependency

## [8.0.0](https://github.com/AndrewBarba/apns2/releases/tag/8.0.0)

1. Require Node.js v10 or higher

## [7.0.0](https://github.com/AndrewBarba/apns2/releases/tag/7.0.0)

1. Support
   [apns-push-type](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns)
   and iOS 13

## [6.1.0](https://github.com/AndrewBarba/apns2/releases/tag/6.1.0)

1. Support
   [thread-id](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/PayloadKeyReference.html)

## [6.0.0](https://github.com/AndrewBarba/apns2/releases/tag/6.0.0)

1. Remove Bluebird
2. Remove concurrency option, instead relies on the connection pool and max
   connections
3. Accept a `Date` for the apns expiration

## [5.0.0](https://github.com/AndrewBarba/apns2/releases/tag/5.0.0)

1. Update code to use async/await

## [4.0.4](https://github.com/AndrewBarba/apns2/releases/tag/4.0.4)

1. Fix connection pool not releasing resources

## [4.0.3](https://github.com/AndrewBarba/apns2/releases/tag/4.0.3)

1. Listen for `error` event when connecting an http2 session

## [4.0.2](https://github.com/AndrewBarba/apns2/releases/tag/4.0.2)

1. Reset signing token every 59 minutes to prevent `TooManyProviderTokenUpdates`
   error

## [4.0.1](https://github.com/AndrewBarba/apns2/releases/tag/4.0.1)

1. Updated Typescript definitions for v4.0

## [4.0.0](https://github.com/AndrewBarba/apns2/releases/tag/4.0.0)

1. Remove support for Node versions less than v8.10
2. High-performance connection pool using
   [tarn](https://github.com/vincit/tarn.js)
3. More friendly require API, see README for updated usage

## [3.0.1](https://github.com/AndrewBarba/apns2/releases/tag/3.0.1)

1. Fix Typescript definitions

## [3.0.0](https://github.com/AndrewBarba/apns2/releases/tag/3.0.1)

1. Introduces support for the native `http2` module in Node.js v8.4.0 or later
   with fall back to `node-spdy` in earlier versions of Node.js.

To use the new `http2` library you must start your node process with
`node --expose-http2` and apns2 will automatically use the native module. Later
versions of Node.js may expose the native module without the need for a command
line flag. In this case, apns2 will automatically use the native module without
any additional steps on your end.
