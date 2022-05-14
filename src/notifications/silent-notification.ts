import { Notification, NotificationOptions, PushType, Priority } from './notification'

export class SilentNotification extends Notification {
  constructor(deviceToken: string, options: NotificationOptions = {}) {
    super(deviceToken, {
      contentAvailable: true,
      type: PushType.background,
      priority: Priority.throttled,
      ...options
    })
  }
}
