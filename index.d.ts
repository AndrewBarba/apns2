import { EventEmitter } from "events"

export class APNS extends EventEmitter {
  constructor(options: APNSOptions)
  send(notification: Notification): Promise<Notification>
  sendMany(notifications: Notification[]): Promise<Notification[]>
}

export class Notification {
  constructor(deviceToken: string, options?: NotificationOptions)
  static readonly priority: NotificationPriority
  readonly deviceToken: string
  readonly priority: number
  readonly expiration: number
  readonly topic: string
  readonly collapseId: string
}

export class BasicNotification extends Notification {
  constructor(deviceToken: string, message: string, options?: NotificationOptions)
}

export class SilentNotification extends Notification {
  constructor(deviceToken: string, options?: NotificationOptions)
}

export const Errors: {
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

declare interface APNSOptions {
  team: string
  keyId: string
  signingKey: string
  defaultTopic?: string
  host?: string
  port?: number
  connections?: number
}

declare interface NotificationPriority {
  immediate: number
  throttled: number
}
