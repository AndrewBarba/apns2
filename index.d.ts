import { EventEmitter } from 'events'

export class APNS extends EventEmitter {
  constructor(options: APNSOptions)
  send(notification: Notification): Promise<Notification | ResponseError>
  sendMany(notifications: Notification[]): Promise<(Notification | ResponseError)[]>
  close(): Promise<void>
}

export class Notification {
  constructor(deviceToken: string, options?: NotificationOptions)
  static readonly priority: NotificationPriority
  static readonly pushType: PushType
  readonly deviceToken: string
  readonly pushType: string
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

type ResponseError = {
  error: {
    reason: string
    statusCode: number
    notification: Notification
  }
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
  invalidPushType: string
  invalidSigningKey: string
  methodNotAllowed: string
  missingDeviceToken: string
  missingProviderToken: string
  missingTopic: string
  payloadEmpty: string
  payloadTooLarge: string
  serviceUnavailable: string
  shutdown: string
  tooManyProviderTokenUpdates: string
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
  requestTimeout?: number
  pingInterval?: number
}

declare interface NotificationOptions {
  alert?:
    | string
    | {
        title?: string
        subtitle?: string
        body: string
        'title-loc-key'?: string
        'title-loc-args'?: string[]
        'subtitle-loc-key'?: string
        'subtitle-loc-args'?: string[]
        'loc-key'?: string
        'loc-args'?: string[]
        'action-loc-key'?: string
        'launch-image'?: string
      }
  aps?: any
  badge?: number
  category?: string
  collapseId?: string
  contentAvailable?: boolean
  data?: { [key: string]: any }
  expiration?: number
  priority?: number
  pushType?: keyof PushType
  sound?: string
  threadId?: string
  topic?: string
}

declare interface NotificationPriority {
  immediate: number
  throttled: number
}

declare interface PushType {
  alert: string
  background: string
  voip: string
  complication: string
  fileprovider: string
  mdm: string
}
