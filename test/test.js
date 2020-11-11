const should = require('should')
const HTTP2Client = require('../lib/http2-client')
const { APNS, Notification, BasicNotification, SilentNotification, Errors } = require('../')

describe('http2', () => {
  describe('client', () => {
    let client

    before(() => {
      client = new HTTP2Client('www.google.com', 443)
    })

    it('should make a get request', async () => {
      const res = await client.request({ method: 'GET', path: '/' })
      res.statusCode.should.equal(200)
    })

    it('should make a post request', async () => {
      const res = await client.request({ method: 'POST', path: '/' })
      res.statusCode.should.equal(405)
    })
  })
})

describe('apns', () => {
  const deviceToken = process.env.APNS_PUSH_TOKEN

  describe('signing token', () => {
    let apns

    before(() => {
      apns = new APNS({
        team: `TFLP87PW54`,
        keyId: `7U6GT5Q49J`,
        signingKey: process.env.APNS_SIGNING_KEY,
        defaultTopic: `com.tablelist.Tablelist`,
        pingInterval: 100
      })
    })

    it('should send a basic notification', async () => {
      const basicNotification = new BasicNotification(deviceToken, `Hello, Basic`)
      return apns.send(basicNotification)
    })

    it('should send a basic notification with options', async () => {
      const basicNotification = new BasicNotification(deviceToken, `Hello, 1`, {
        badge: 1
      })
      return apns.send(basicNotification)
    })

    it('should send a basic notification with additional data', async () => {
      const basicNotification = new BasicNotification(deviceToken, `Hello, ICON`, {
        badge: 0,
        data: {
          url: `venue/icon`
        }
      })
      return apns.send(basicNotification)
    })

    it('should send a silent notification', async () => {
      const silentNotification = new SilentNotification(deviceToken)
      return apns.send(silentNotification)
    })

    it('should send a notification', async () => {
      const notification = new Notification(deviceToken, {
        aps: {
          alert: {
            body: `Hello, Tablelist`
          }
        }
      })
      return apns.send(notification)
    })

    it('should send a notification with a thread-id', async () => {
      const notification = new Notification(deviceToken, {
        aps: {
          alert: {
            body: `Hello, Tablelist`
          }
        },
        threadId: `hello`
      })
      return apns.send(notification)
    })

    it('should send both notifications', async () => {
      const basicNotification = new BasicNotification(deviceToken, `Hello, Multiple`)
      const silentNotification = new SilentNotification(deviceToken)
      const results = await apns.sendMany([basicNotification, silentNotification])
      should.exist(results)
      results.length.should.equal(2)
    })

    it('should send a lot of notifications', async () => {
      const notifications = []
      for (let i = 0; i < 500; i++) {
        notifications.push(new BasicNotification(deviceToken, `Hello #${i}`))
      }
      const results = await apns.sendMany(notifications)
      should.exist(results)
      results.length.should.equal(notifications.length)
    })

    it('should fail to send a notification', async () => {
      const noti = new BasicNotification(`fakedevicetoken`, `Hello, bad token`)
      try {
        await apns.send(noti)
        throw new Error('Should not have sent notification')
      } catch (err) {
        should.exist(err)
        err.reason.should.equal(Errors.badDeviceToken)
      }
    })

    it('should fail to send a notification and emit an error', (done) => {
      apns.once(Errors.error, (err) => {
        should.exist(err)
        err.reason.should.equal(Errors.badDeviceToken)
        done()
      })

      const noti = new BasicNotification(`fakedevicetoken`, `Hello, bad token`)
      apns.send(noti).catch(should.exist)
    })

    it('should fail to send a notification and emit an error', (done) => {
      apns.once(Errors.badDeviceToken, (err) => {
        should.exist(err)
        err.reason.should.equal(Errors.badDeviceToken)
        done()
      })

      const noti = new BasicNotification(`fakedevicetoken`, `Hello, bad token`)
      apns.send(noti).catch(should.exist)
    })
  })
})
