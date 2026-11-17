import { Priority } from "./constants/priority.js"
import { PushType } from "./constants/push-type.js"

export { PushType, Priority }

export interface NotificationOptions {
  // Sent as the apns-id header, a canonical UUID. APNs generates one when omitted
  id?: string
  type?: PushType
  alert?: string | { title: string; subtitle?: string; body: string }
  badge?: number
  expiration?: number | Date
  sound?: string | CriticalAlertSoundPayload
  category?: string
  data?: Record<string, unknown>
  contentAvailable?: boolean
  priority?: Priority
  topic?: string
  collapseId?: string
  threadId?: string
  aps?: Record<string, unknown>
  mutableContent?: boolean
}

export interface ApnsPayload {
  aps: Record<string, unknown>
  [key: string]: unknown
}

export interface CriticalAlertSoundPayload {
  critical: 0 | 1
  name?: string
  volume?: number
}

export class Notification {
  readonly deviceToken: string
  readonly options: NotificationOptions

  constructor(deviceToken: string, options?: NotificationOptions) {
    if (typeof deviceToken !== "string" || deviceToken.length === 0) {
      const hint = Buffer.isBuffer(deviceToken) ? ', e.g. token.toString("hex")' : ""
      throw new TypeError(`Notification deviceToken must be a non-empty hex string${hint}`)
    }
    this.deviceToken = deviceToken
    this.options = options ?? {}
  }

  get pushType(): PushType {
    return this.options.type ?? PushType.alert
  }

  get priority(): Priority {
    return this.options.priority ?? Priority.immediate
  }

  buildApnsOptions() {
    const result: ApnsPayload = {
      aps: this.options.aps ?? {},
    }

    // Check for alert
    if (this.options.alert) {
      result.aps.alert = this.options.alert
    }

    // Check for "silent" notification
    if (typeof this.options.contentAvailable === "boolean") {
      result.aps["content-available"] = this.options.contentAvailable ? 1 : 0
    }

    // Check for sound
    if (typeof this.options.sound === "string" || typeof this.options.sound === "object") {
      result.aps.sound = this.options.sound
    }

    // Check for category
    if (typeof this.options.category === "string") {
      result.aps.category = this.options.category
    }

    // Check for badge
    if (typeof this.options.badge === "number") {
      result.aps.badge = this.options.badge
    }

    // Check for threadId
    if (typeof this.options.threadId === "string") {
      result.aps["thread-id"] = this.options.threadId
    }

    // Add optional message data
    for (const key in this.options.data) {
      result[key] = this.options.data[key]
    }

    // Check for mutable content
    if (typeof this.options.mutableContent === "boolean") {
      result.aps["mutable-content"] = this.options.mutableContent ? 1 : 0
    }

    return result
  }
}
