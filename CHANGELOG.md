Change Log
==========

`apns2` follows [Semantic Versioning](http://semver.org/)

---

## [6.1.0](https://github.com/AndrewBarba/apns2/releases/tag/6.1.0)

1. Support [thread-id](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/PayloadKeyReference.html)

## [6.0.0](https://github.com/AndrewBarba/apns2/releases/tag/6.0.0)

1. Remove Bluebird
2. Remove concurrency option, instead relies on the connection pool and max connections
3. Accept a `Date` for the apns expiration

## [5.0.0](https://github.com/AndrewBarba/apns2/releases/tag/5.0.0)

1. Update code to use async/await

## [4.0.4](https://github.com/AndrewBarba/apns2/releases/tag/4.0.4)

1. Fix connection pool not releasing resources

## [4.0.3](https://github.com/AndrewBarba/apns2/releases/tag/4.0.3)

1. Listen for `error` event when connecting an http2 session

## [4.0.2](https://github.com/AndrewBarba/apns2/releases/tag/4.0.2)

1. Reset signing token every 59 minutes to prevent `TooManyProviderTokenUpdates` error

## [4.0.1](https://github.com/AndrewBarba/apns2/releases/tag/4.0.1)

1. Updated Typescript definitions for v4.0

## [4.0.0](https://github.com/AndrewBarba/apns2/releases/tag/4.0.0)

1. Remove support for Node versions less than v8.10
2. High-performance connection pool using [tarn](https://github.com/vincit/tarn.js)
3. More friendly require API, see README for updated usage

## [3.0.1](https://github.com/AndrewBarba/apns2/releases/tag/3.0.1)

1. Fix Typescript definitions

## [3.0.0](https://github.com/AndrewBarba/apns2/releases/tag/3.0.1)

1. Introduces support for the native `http2` module in Node.js v8.4.0 or later with fall back to `node-spdy` in earlier versions of Node.js.

To use the new `http2` library you must start your node process with `node --expose-http2` and apns2 will automatically use the native module. Later versions of Node.js may expose the native module without the need for a command line flag. In this case, apns2 will automatically use the native module without any additional steps on your end.
