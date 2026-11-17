import { getHeader } from "./internals.js"
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

export type ApnsResponseHeaders = Record<string, string | string[] | undefined>

export interface ApnsResponseError {
  reason: string
  timestamp: number
}

export class ApnsError extends Error {
  readonly statusCode: number
  readonly notification: Notification
  readonly response: ApnsResponseError
  readonly headers: ApnsResponseHeaders

  constructor(props: {
    statusCode: number
    notification: Notification
    response: ApnsResponseError
    headers?: ApnsResponseHeaders
  }) {
    super(`APNS Error: ${props.statusCode} - ${props.response.reason}`)
    this.name = "ApnsError"
    this.statusCode = props.statusCode
    this.notification = props.notification
    this.response = props.response
    this.headers = props.headers ?? {}
  }

  // The apns-id APNs assigned to (or echoed for) the rejected request
  get apnsId() {
    return getHeader(this.headers, "apns-id")
  }

  // Only returned by the development environment
  get apnsUniqueId() {
    return getHeader(this.headers, "apns-unique-id")
  }

  get reason() {
    return this.response.reason
  }

  get timestamp() {
    return this.response.timestamp
  }
}
