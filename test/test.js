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

    before(() => {
      client = new HTTP2Client('www.google.com', 443)
      return client.connect()
    })

    it('should make a get request', () => {
      return client.get({
        path: '/'
      }).then(res => {
        res.statusCode.should.equal(200)
      })
    })

    it('should make a post request', () => {
      return client.post({
        path: '/'
      }).then(res => {
        res.statusCode.should.equal(405)
      })
    })
  })

  describe('error', () => {
    let client

    before(() => {
      client = new HTTP2Client('bogus.google.com', 443, { timeout: 500 })
    })

    it('should not connect', () => {
      return client.connect()
        .then(() => {
          throw new Error('Failed')
        })
        .catch(() => {})
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
        signingKey: process.env.SK || fs.readFileSync(`${__dirname}/certs/token.p8`),
        defaultTopic: `com.tablelist.Tablelist`
      })
    })

    it('should send a basic notification', () => {
      let basicNotification = new BasicNotification(deviceToken, `Hello, Basic`)
      return apns.send(basicNotification)
    })

    it('should send a basic notification with options', () => {
      let basicNotification = new BasicNotification(deviceToken, `Hello, 1`, {
        badge: 1
      })
      return apns.send(basicNotification)
    })

    it('should send a basic notification with additional data', () => {
      let basicNotification = new BasicNotification(deviceToken, `Hello, ICON`, {
        badge: 0,
        data: {
          url: `venue/icon`
        }
      })
      return apns.send(basicNotification)
    })

    it('should send a silent notification', () => {
      let silentNotification = new SilentNotification(deviceToken)
      return apns.send(silentNotification)
    })

    it('should send a notification', () => {
      let notification = new Notification(deviceToken, {
        aps: {
          alert: {
            body: `Hello, Tablelist`
          }
        }
      })
      return apns.send(notification)
    })

    it('should send both notifications', () => {
      let basicNotification = new BasicNotification(deviceToken, `Hello, Multiple`)
      let silentNotification = new SilentNotification(deviceToken)
      return apns.send([basicNotification, silentNotification]).then(result => {
        should.exist(result)
        result.length.should.equal(2)
      })
    })

    it('should send a lot of notifications', () => {
      let notifications = [
        new BasicNotification(deviceToken, 'Hello 1'),
        new BasicNotification(deviceToken, 'Hello 2'),
        new BasicNotification(deviceToken, 'Hello 3'),
        new BasicNotification(deviceToken, 'Hello 4'),
        new BasicNotification(deviceToken, 'Hello 5'),
        new BasicNotification(deviceToken, 'Hello 6'),
        new BasicNotification(deviceToken, 'Hello 7'),
        new BasicNotification(deviceToken, 'Hello 8'),
        new BasicNotification(deviceToken, 'Hello 9'),
        new BasicNotification(deviceToken, 'Hello 10'),
        new BasicNotification(deviceToken, 'Hello 11'),
        new BasicNotification(deviceToken, 'Hello 12'),
        new BasicNotification(deviceToken, 'Hello 13'),
        new BasicNotification(deviceToken, 'Hello 14'),
        new BasicNotification(deviceToken, 'Hello 15'),
        new BasicNotification(deviceToken, 'Hello 16'),
        new BasicNotification(deviceToken, 'Hello 17'),
        new BasicNotification(deviceToken, 'Hello 18'),
        new BasicNotification(deviceToken, 'Hello 19'),
        new BasicNotification(deviceToken, 'Hello 20')
      ]
      return apns.send(notifications).then(result => {
        should.exist(result)
        result.length.should.equal(notifications.length)
      })
    })

    it('should fail to send a notification', () => {
      let noti = new BasicNotification(`fakedevicetoken`, `Hello, bad token`)
      return apns.send(noti).catch(err => {
        should.exist(err)
        err.reason.should.equal(Errors.badDeviceToken)
      })
    })

    it('should fail to send a notification and emit an error', done => {

      apns.once(Errors.error, err => {
        should.exist(err)
        err.reason.should.equal(Errors.badDeviceToken)
        done()
      })

      let noti = new BasicNotification(`fakedevicetoken`, `Hello, bad token`)
      apns.send(noti).catch(err => {
        should.exist(err)
      })
    })

    it('should fail to send a notification and emit an error', done => {

      apns.once(Errors.badDeviceToken, err => {
        should.exist(err)
        err.reason.should.equal(Errors.badDeviceToken)
        done()
      })

      let noti = new BasicNotification(`fakedevicetoken`, `Hello, bad token`)
      apns.send(noti).catch(err => {
        should.exist(err)
      })
    })
  })
})
