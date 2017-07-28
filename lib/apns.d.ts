import { EventEmitter } from "events"

declare class APNS extends EventEmitter {
  constructor(options: APNS.Options)
  send(notification: APNS.Notification): Promise<APNS.Notification>
  send(notifications: APNS.Notification[]): Promise<APNS.Notification[]>
}

declare namespace APNS {
  export interface Options {
    team: string
    keyId: string
    signingKey: string
    defaultTopic?: string
    host?: string
    port?: number
  }

  export interface NotificationAlert {
    title: string
    body: string
  }

  export interface NotificationOptions {
    alert?: string | NotificationAlert
    badge?: number
    sound?: string
    category?: string
    data?: object
    contentAvailable?: boolean
    priority?: number
    aps?: object
  }

  export class Notification {
    constructor(deviceToken: string, options?: NotificationOptions)
    static readonly priority: Notification.Priority
    readonly deviceToken: string
    readonly priority: number
    readonly expiration: number
    readonly topic: string
    readonly collapseId: string
  }

  export namespace Notification {
    export interface Priority {
      immediate: number
      throttled: number
    }
  }

  export class BasicNotification extends Notification {
    constructor(deviceToken: string, message: string, options?: NotificationOptions)
  }

  export class SilentNotification extends Notification {
    constructor(deviceToken: string, options?: NotificationOptions)
  }

  export interface Errors {
    badCertificate: string
    badCertificateEnvironment: string
    badCollapseId: string
    badDeviceToken: string
    badExpirationDate: string
    badMessageId: string
    badPath: string
    badPriority: string
    badTopic: string
    deviceTokenNotForTopic: string
    duplicateHeaders: string
    error: string
    expiredProviderToken: string
    forbidden: string
    idleTimeout: string
    internalServerError: string
    invalidProviderToken: string
    invalidSigningKey: string
    methodNotAllowed: string
    missingDeviceToken: string
    missingTopic: string
    payloadEmpty: string
    payloadTooLarge: string
    serviceUnavailable: string
    shutdown: string
    tooManyRequests: string
    topicDisallowed: string
    unknownError: string
    unregistered: string
  }
  
  export const errors: Errors
}

export = APNS
