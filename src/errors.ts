import type { IncomingHttpHeaders } from "undici/types/header.js"
import type { Notification } from "./notifications/notification.js"

export const Errors = {
  badCertificate: "BadCertificate",
  badCertificateEnvironment: "BadCertificateEnvironment",
  badCollapseId: "BadCollapseId",
  badDeviceToken: "BadDeviceToken",
  badExpirationDate: "BadExpirationDate",
  badMessageId: "BadMessageId",
  badPath: "BadPath",
  badPriority: "BadPriority",
  badTopic: "BadTopic",
  deviceTokenNotForTopic: "DeviceTokenNotForTopic",
  duplicateHeaders: "DuplicateHeaders",
  error: "Error",
  expiredProviderToken: "ExpiredProviderToken",
  forbidden: "Forbidden",
  idleTimeout: "IdleTimeout",
  internalServerError: "InternalServerError",
  invalidProviderToken: "InvalidProviderToken",
  invalidPushType: "InvalidPushType",
  invalidSigningKey: "InvalidSigningKey",
  methodNotAllowed: "MethodNotAllowed",
  missingDeviceToken: "MissingDeviceToken",
  missingProviderToken: "MissingProviderToken",
  missingTopic: "MissingTopic",
  payloadEmpty: "PayloadEmpty",
  payloadTooLarge: "PayloadTooLarge",
  serviceUnavailable: "ServiceUnavailable",
  shutdown: "Shutdown",
  tooManyProviderTokenUpdates: "TooManyProviderTokenUpdates",
  tooManyRequests: "TooManyRequests",
  topicDisallowed: "TopicDisallowed",
  unknownError: "UnknownError",
  unregistered: "Unregistered",
} as const

export type Error = (typeof Errors)[keyof typeof Errors]

export interface ApnsResponseError {
  reason: string
  timestamp: number
}

export class ApnsError extends Error {
  readonly statusCode: number
  readonly notification: Notification
  readonly response: ApnsResponseError
  readonly headers: IncomingHttpHeaders

  constructor(props: {
    statusCode: number
    notification: Notification
    response: ApnsResponseError
    headers: IncomingHttpHeaders
  }) {
    super(`APNS Error: ${props.statusCode} - ${props.response.reason}`)
    this.statusCode = props.statusCode
    this.notification = props.notification
    this.response = props.response
    this.headers = props.headers
  }

  get reason() {
    return this.response.reason
  }

  get timestamp() {
    return this.response.timestamp
  }
}
