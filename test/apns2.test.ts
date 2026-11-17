import { randomUUID } from "node:crypto"
import { existsSync } from "node:fs"

import { assert } from "chai"
import { beforeAll, describe, it } from "vitest"

import {
  ApnsClient,
  type ApnsSendResponse,
  ApnsError,
  Errors,
  Notification,
  PushType,
  SilentNotification,
} from "../src/index.js"

// Load local credentials from .env when present; CI passes them as env vars
if (existsSync(".env")) {
  process.loadEnvFile()
}

function assertSent(response: ApnsSendResponse, notification: Notification) {
  assert.strictEqual(response.notification, notification)
  assert.equal(response.statusCode, 200)
  assert.isString(response.apnsId)
}

// Every request must get a real APNs response over the multiplexed
// connections; transport or protocol errors fail the test. Valid tokens may
// hit Apple's per-device rate limit given the volume these tests send
function assertBulkResults(
  notifications: Notification[],
  results: Awaited<ReturnType<ApnsClient["sendMany"]>>,
) {
  assert.equal(results.length, notifications.length)
  results.forEach((result, i) => {
    const invalid = notifications[i]?.deviceToken === "fakedevicetoken"
    assert.strictEqual(result.notification, notifications[i])
    if (!("error" in result)) {
      assert.isFalse(invalid, "invalid token should not be delivered")
      assertSent(result, notifications[i] as Notification)
      return
    }
    assert.instanceOf(result.error, ApnsError)
    const expected = invalid ? [Errors.badDeviceToken] : [Errors.tooManyRequests]
    assert.include(expected, result.error.reason)
  })
}

describe("apns", () => {
  const deviceToken = process.env.APNS_PUSH_TOKEN ?? ""

  describe("validation", () => {
    it("should reject a non-string device token", () => {
      assert.throws(
        () => new Notification(Buffer.from("abc") as unknown as string),
        TypeError,
        /hex/,
      )
      assert.throws(() => new Notification(""), TypeError)
    })

    it("should reject arrays and non-notifications in send()", async () => {
      const apns = new ApnsClient({ team: "team", keyId: "key", signingKey: "key" })
      const notification = new Notification("token")
      await apns.send([notification] as unknown as Notification).then(
        () => assert.fail("expected send() to reject"),
        (err) => assert.match(err.message, /sendMany/),
      )
      await apns.send({} as Notification).then(
        () => assert.fail("expected send() to reject"),
        (err) => assert.instanceOf(err, TypeError),
      )
      await apns.close()
    })

    it("should support all APNs push types", () => {
      assert.includeMembers(Object.values(PushType), ["accessory", "controls", "widgets"])
    })
  })

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
      assertSent(await apns.send(basicNotification), basicNotification)
    })

    it("should send a basic notification with options", async () => {
      const basicNotification = new Notification(deviceToken, {
        alert: "Hello",
        badge: 1,
      })
      assertSent(await apns.send(basicNotification), basicNotification)
    })

    it("should send a basic notification with additional data", async () => {
      const basicNotification = new Notification(deviceToken, {
        alert: "Hello",
        badge: 0,
        data: {
          url: "venue/icon",
        },
      })
      assertSent(await apns.send(basicNotification), basicNotification)
    })

    it("should send a silent notification", async () => {
      const silentNotification = new SilentNotification(deviceToken)
      assertSent(await apns.send(silentNotification), silentNotification)
    })

    it("should send a notification", async () => {
      const notification = new Notification(deviceToken, {
        aps: {
          alert: {
            body: "Hello, Tablelist",
          },
        },
      })
      assertSent(await apns.send(notification), notification)
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
      assertSent(await apns.send(notification), notification)
    })

    it("should send a notification with an apns-id", async () => {
      const id = randomUUID()
      const notification = new Notification(deviceToken, { alert: "Hello", id })
      const response = await apns.send(notification)
      assertSent(response, notification)
      assert.equal(response.apnsId?.toLowerCase(), id)
    })

    it("should send both notifications", async () => {
      const basicNotification = new Notification(deviceToken, {
        alert: "Hello",
      })
      const silentNotification = new SilentNotification(deviceToken)
      const notifications = [basicNotification, silentNotification]
      const results = await apns.sendMany(notifications)
      assertBulkResults(notifications, results)
    })

    it("should send a lot of notifications", { timeout: 30_000 }, async () => {
      const notifications: Notification[] = []
      for (let i = 0; i < 500; i++) {
        notifications.push(new Notification(deviceToken, { alert: "Hello" }))
      }
      const results = await apns.sendMany(notifications)
      assertBulkResults(notifications, results)
    })

    it(
      "should send a lot of notifications mixed with invalid tokens",
      { timeout: 30_000 },
      async () => {
        const notifications: Notification[] = []
        for (let i = 0; i < 250; i++) {
          const token = i % 5 === 0 ? "fakedevicetoken" : deviceToken
          notifications.push(new Notification(token, { alert: "Hello" }))
        }
        const results = await apns.sendMany(notifications)
        assertBulkResults(notifications, results)
      },
    )

    it("should fail to send a notification", async () => {
      const noti = new Notification("fakedevicetoken", { alert: "Hello" })
      try {
        await apns.send(noti)
        throw new Error("Should not have sent notification")
      } catch (err) {
        assert.instanceOf(err, ApnsError)
        assert.equal(err.reason, Errors.badDeviceToken)
        assert.strictEqual(err.notification, noti)
        assert.isString(err.apnsId)
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

    it("should fail to send a notification and emit a generic error", () => {
      const promise = new Promise((resolve) => {
        apns.once(Errors.error, (err) => {
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
