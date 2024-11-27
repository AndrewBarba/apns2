import { Notification, type NotificationOptions, Priority, PushType } from "./notification.js"

export class SilentNotification extends Notification {
  constructor(
    deviceToken: string,
    options: Omit<NotificationOptions, "type" | "alert" | "priority" | "contentAvailable"> = {},
  ) {
    super(deviceToken, {
      contentAvailable: true,
      type: PushType.background,
      priority: Priority.throttled,
      ...options,
    })
  }
}
