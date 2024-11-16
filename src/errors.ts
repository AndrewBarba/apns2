import type { Notification } from "./notifications/notification"

export enum Errors {
  badCertificate = "BadCertificate",
  badCertificateEnvironment = "BadCertificateEnvironment",
  badCollapseId = "BadCollapseId",
  badDeviceToken = "BadDeviceToken",
  badExpirationDate = "BadExpirationDate",
  badMessageId = "BadMessageId",
  badPath = "BadPath",
  badPriority = "BadPriority",
  badTopic = "BadTopic",
  deviceTokenNotForTopic = "DeviceTokenNotForTopic",
  duplicateHeaders = "DuplicateHeaders",
  error = "Error",
  expiredProviderToken = "ExpiredProviderToken",
  forbidden = "Forbidden",
  idleTimeout = "IdleTimeout",
  internalServerError = "InternalServerError",
  invalidProviderToken = "InvalidProviderToken",
  invalidPushType = "InvalidPushType",
  invalidSigningKey = "InvalidSigningKey",
  methodNotAllowed = "MethodNotAllowed",
  missingDeviceToken = "MissingDeviceToken",
  missingProviderToken = "MissingProviderToken",
  missingTopic = "MissingTopic",
  payloadEmpty = "PayloadEmpty",
  payloadTooLarge = "PayloadTooLarge",
  serviceUnavailable = "ServiceUnavailable",
  shutdown = "Shutdown",
  tooManyProviderTokenUpdates = "TooManyProviderTokenUpdates",
  tooManyRequests = "TooManyRequests",
  topicDisallowed = "TopicDisallowed",
  unknownError = "UnknownError",
  unregistered = "Unregistered",
}

export interface ApnsResponseError {
  reason: string
  timestamp: number
}

export class ApnsError extends Error {
  readonly statusCode: number
  readonly notification: Notification
  readonly response: ApnsResponseError

  constructor(props: {
    statusCode: number
    notification: Notification
    response: ApnsResponseError
  }) {
    super("APNS Error")
    this.statusCode = props.statusCode
    this.notification = props.notification
    this.response = props.response
  }
}
