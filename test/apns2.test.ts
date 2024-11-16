import { assert } from "chai"
import { beforeAll, describe, it } from "vitest"
import { ApnsClient, Errors, Notification, SilentNotification } from "../src"

describe("apns", () => {
  const deviceToken = process.env.APNS_PUSH_TOKEN ?? ""

  describe("signing token", () => {
    let apns: ApnsClient

    beforeAll(() => {
      apns = new ApnsClient({
        team: "TFLP87PW54",
        keyId: "7U6GT5Q49J",
        signingKey: process.env.APNS_SIGNING_KEY ?? "",
        defaultTopic: "com.tablelist.Tablelist",
      })
    })

    it("should send a basic notification", async () => {
      const basicNotification = new Notification(deviceToken, {
        alert: "Hello",
      })
      return apns.send(basicNotification)
    })

    it("should send a basic notification with options", async () => {
      const basicNotification = new Notification(deviceToken, {
        alert: "Hello",
        badge: 1,
      })
      return apns.send(basicNotification)
    })

    it("should send a basic notification with additional data", async () => {
      const basicNotification = new Notification(deviceToken, {
        alert: "Hello",
        badge: 0,
        data: {
          url: "venue/icon",
        },
      })
      return apns.send(basicNotification)
    })

    it("should send a silent notification", async () => {
      const silentNotification = new SilentNotification(deviceToken)
      return apns.send(silentNotification)
    })

    it("should send a notification", async () => {
      const notification = new Notification(deviceToken, {
        aps: {
          alert: {
            body: "Hello, Tablelist",
          },
        },
      })
      return apns.send(notification)
    })

    it("should send a notification with a thread-id", async () => {
      const notification = new Notification(deviceToken, {
        aps: {
          alert: {
            body: "Hello, Tablelist",
          },
        },
        threadId: "hello",
      })
      return apns.send(notification)
    })

    it("should send both notifications", async () => {
      const basicNotification = new Notification(deviceToken, {
        alert: "Hello",
      })
      const silentNotification = new SilentNotification(deviceToken)
      const results = await apns.sendMany([basicNotification, silentNotification])
      assert.equal(results.length, 2)
    })

    it("should send a lot of notifications", async () => {
      const notifications: Notification[] = []
      for (let i = 0; i < 500; i++) {
        notifications.push(new Notification(deviceToken, { alert: "Hello" }))
      }
      const results = await apns.sendMany(notifications)
      assert.equal(results.length, notifications.length)
    })

    it("should fail to send a notification", async () => {
      const noti = new Notification("fakedevicetoken", { alert: "Hello" })
      try {
        await apns.send(noti)
        throw new Error("Should not have sent notification")
      } catch (err) {
        assert.equal(err.reason, Errors.badDeviceToken)
      }
    })

    it("should fail to send a notification and emit an error", () => {
      const promise = new Promise((resolve) => {
        apns.once(Errors.badDeviceToken, (err) => {
          assert.equal(err.reason, Errors.badDeviceToken)
          resolve(null)
        })
      })
      const noti = new Notification("fakedevicetoken", { alert: "Hello" })
      apns.send(noti).catch(assert)
      return promise
    })

    it("should fail to send a notification and emit an error", () => {
      const promise = new Promise((resolve) => {
        apns.once(Errors.badDeviceToken, (err) => {
          assert.equal(err.reason, Errors.badDeviceToken)
          resolve(null)
        })
      })
      const noti = new Notification("fakedevicetoken", { alert: "Hello" })
      apns.send(noti).catch(assert)
      return promise
    })
  })
})
