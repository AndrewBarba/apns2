const fs = require('fs')
const should = require('should')

// Package
const HTTP2Client = require('../lib/http2-client')
const {
  APNS,
  Notification,
  BasicNotification,
  SilentNotification,
  Errors
} = require('../')

describe('http2', () => {

  describe('success', () => {
    let client

    before(async () => {
      client = new HTTP2Client('www.google.com', 443)
      return client.connect()
    })

    it('should make a get request', async () => {
      let res = await client.get({ path: '/' })
      res.statusCode.should.equal(200)
    })

    it('should make a post request', async () => {
      let res = await client.post({ path: '/' })
      res.statusCode.should.equal(405)
    })
  })

  describe('error', () => {
    let client

    before(() => {
      client = new HTTP2Client('bogus.google.com', 443, { timeout: 500 })
    })

    it('should not connect', async () => {
      try {
        await client.connect()
        throw new Error('Should not have worked')
      } catch(err) {
        should.exist(err)
      }
    })
  })
})

describe('apns', () => {

  let deviceToken = `5ab4be4b2e511acfc64405be02a9544295f29b6157b75e3fbc5b2f5300eeda45`

  describe('signing token', () => {

    let apns

    before(() => {
      apns = new APNS({
        team: `TFLP87PW54`,
        keyId: `7U6GT5Q49J`,
        signingKey:
          process.env.APNS_SIGNING_KEY ?
          process.env.APNS_SIGNING_KEY.replace(/\\n/gi, '\n') :
          fs.readFileSync(`${__dirname}/certs/token.p8`, 'utf8'),
        defaultTopic: `com.tablelist.Tablelist`
      })
    })

    it('should send a basic notification', async () => {
      let basicNotification = new BasicNotification(deviceToken, `Hello, Basic`)
      return apns.send(basicNotification)
    })

    it('should send a basic notification with options', async () => {
      let basicNotification = new BasicNotification(deviceToken, `Hello, 1`, {
        badge: 1
      })
      return apns.send(basicNotification)
    })

    it('should send a basic notification with additional data', async () => {
      let basicNotification = new BasicNotification(deviceToken, `Hello, ICON`, {
        badge: 0,
        data: {
          url: `venue/icon`
        }
      })
      return apns.send(basicNotification)
    })

    it('should send a silent notification', async () => {
      let silentNotification = new SilentNotification(deviceToken)
      return apns.send(silentNotification)
    })

    it('should send a notification', async () => {
      let notification = new Notification(deviceToken, {
        aps: {
          alert: {
            body: `Hello, Tablelist`
          }
        }
      })
      return apns.send(notification)
    })

    it('should send a notification with a thread-id', async () => {
      let notification = new Notification(deviceToken, {
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
      let basicNotification = new BasicNotification(deviceToken, `Hello, Multiple`)
      let silentNotification = new SilentNotification(deviceToken)
      let results = await apns.sendMany([basicNotification, silentNotification])
      should.exist(results)
      results.length.should.equal(2)
    })

    it('should send a lot of notifications', async () => {
      let notifications = []
      for (let i = 0; i < 500; i++) {
        notifications.push(new BasicNotification(deviceToken, `Hello #${i}`))
      }
      let results = await apns.sendMany(notifications)
      should.exist(results)
      results.length.should.equal(notifications.length)
    })

    it('should fail to send a notification', async () => {
      let noti = new BasicNotification(`fakedevicetoken`, `Hello, bad token`)
      try {
        await apns.send(noti)
        throw new Error('Should not have sent notification')
      } catch(err) {
        should.exist(err)
        err.reason.should.equal(Errors.badDeviceToken)
      }
    })

    it('should fail to send a notification and emit an error', done => {
      apns.once(Errors.error, err => {
        should.exist(err)
        err.reason.should.equal(Errors.badDeviceToken)
        done()
      })

      let noti = new BasicNotification(`fakedevicetoken`, `Hello, bad token`)
      apns.send(noti).catch(should.exist)
    })

    it('should fail to send a notification and emit an error', done => {
      apns.once(Errors.badDeviceToken, err => {
        should.exist(err)
        err.reason.should.equal(Errors.badDeviceToken)
        done()
      })

      let noti = new BasicNotification(`fakedevicetoken`, `Hello, bad token`)
      apns.send(noti).catch(should.exist)
    })
  })
})
