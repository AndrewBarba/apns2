'use strict';

const fs = require('fs');
const should = require('should');

// Package
const APNS = require('../');
const errors = APNS.errors;
const HTTP2Client = require('../lib/http2-client');

describe('http2', () => {

  let client;

  before(() => {
    client = new HTTP2Client('www.google.com', 443);
  });

  it('should make a get request', () => {
    return client.get({
      path: '/'
    }).then(res => {
      res.statusCode.should.equal(200);
    });
  });

  it('should make a post request', () => {
    return client.post({
      path: '/'
    }).then(res => {
      res.statusCode.should.equal(405);
    });
  });
});

describe('apns', () => {

  let deviceToken = `5ab4be4b2e511acfc64405be02a9544295f29b6157b75e3fbc5b2f5300eeda45`;

  describe('certs', () => {

    let apns;

    before(() => {
      apns = new APNS({
        cert: process.env.CERT_PEM || fs.readFileSync(`${__dirname}/certs/cert.pem`),
        key: process.env.KEY_PEM || fs.readFileSync(`${__dirname}/certs/key.pem`)
      });
    });

    it('should send a basic notification', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, Basic`);
      return apns.send(basicNotification);
    });

    it('should send a basic notification with options', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, 1`, {
        badge: 1
      });
      return apns.send(basicNotification);
    });

    it('should send a basic notification with additional data', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, ICON`, {
        badge: 0,
        data: {
          url: `venue/icon`
        }
      });
      return apns.send(basicNotification);
    });

    it('should send a silent notification', () => {
      let silentNotification = new APNS.SilentNotification(deviceToken);
      return apns.send(silentNotification);
    });

    it('should send a notification', () => {
      let notification = new APNS.Notification(deviceToken, {
        aps: {
          alert: {
            body: `Hello, Tablelist`
          }
        }
      });
      return apns.send(notification);
    });

    it('should send both notifications', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, Multiple`);
      let silentNotification = new APNS.SilentNotification(deviceToken);
      return apns.send([basicNotification, silentNotification]).then(result => {
        should.exist(result);
        result.length.should.equal(2);
      });
    });

    it('should fail to send a notification', () => {
      let noti = new APNS.BasicNotification(`fakedevicetoken`, `Hello, bad token`);
      return apns.send(noti).catch(err => {
        should.exist(err);
        err.reason.should.equal(errors.badDeviceToken);
      });
    });

    it('should fail to send a notification and emit an error', done => {

      apns.once(errors.error, err => {
        should.exist(err);
        err.reason.should.equal(errors.badDeviceToken);
        done();
      });

      let noti = new APNS.BasicNotification(`fakedevicetoken`, `Hello, bad token`);
      apns.send(noti).catch(err => {
        should.exist(err);
      });
    });

    it('should fail to send a notification and emit an error', done => {

      apns.once(errors.badDeviceToken, err => {
        should.exist(err);
        err.reason.should.equal(errors.badDeviceToken);
        done();
      });

      let noti = new APNS.BasicNotification(`fakedevicetoken`, `Hello, bad token`);
      apns.send(noti).catch(err => {
        should.exist(err);
      });
    });
  });

  describe('pkcs12', () => {

    let apns;

    before(() => {
      apns = new APNS({
        pfx: process.env.PFX || fs.readFileSync(`${__dirname}/certs/key.p12`),
        passphrase: process.env.PASSPHRASE || ""
      });
    });

    it('should send a basic notification', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, Basic`);
      return apns.send(basicNotification);
    });

    it('should send a basic notification with options', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, 1`, {
        badge: 1
      });
      return apns.send(basicNotification);
    });

    it('should send a basic notification with additional data', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, ICON`, {
        badge: 0,
        data: {
          url: `venue/icon`
        }
      });
      return apns.send(basicNotification);
    });

    it('should send a silent notification', () => {
      let silentNotification = new APNS.SilentNotification(deviceToken);
      return apns.send(silentNotification);
    });

    it('should send a notification', () => {
      let notification = new APNS.Notification(deviceToken, {
        aps: {
          alert: {
            body: `Hello, Tablelist`
          }
        }
      });
      return apns.send(notification);
    });

    it('should send both notifications', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, Multiple`);
      let silentNotification = new APNS.SilentNotification(deviceToken);
      return apns.send([basicNotification, silentNotification]).then(result => {
        should.exist(result);
        result.length.should.equal(2);
      });
    });

    it('should fail to send a notification', () => {
      let noti = new APNS.BasicNotification(`fakedevicetoken`, `Hello, bad token`);
      return apns.send(noti).catch(err => {
        should.exist(err);
        err.reason.should.equal(errors.badDeviceToken);
      });
    });

    it('should fail to send a notification and emit an error', done => {

      apns.once(errors.error, err => {
        should.exist(err);
        err.reason.should.equal(errors.badDeviceToken);
        done();
      });

      let noti = new APNS.BasicNotification(`fakedevicetoken`, `Hello, bad token`);
      apns.send(noti).catch(err => {
        should.exist(err);
      });
    });

    it('should fail to send a notification and emit an error', done => {

      apns.once(errors.badDeviceToken, err => {
        should.exist(err);
        err.reason.should.equal(errors.badDeviceToken);
        done();
      });

      let noti = new APNS.BasicNotification(`fakedevicetoken`, `Hello, bad token`);
      apns.send(noti).catch(err => {
        should.exist(err);
      });
    });
  });

  describe('signing token', () => {

    let apns;

    before(() => {
      apns = new APNS({
        defaultTopic: `com.tablelist.Tablelist`,
        team: `TFLP87PW54`,
        keyId: `74QQRV9RW2`,
        signingKey: fs.readFileSync(`${__dirname}/certs/token.p8`)
      });
    });

    it('should send a basic notification', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, Basic`);
      return apns.send(basicNotification);
    });

    it('should send a basic notification with options', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, 1`, {
        badge: 1
      });
      return apns.send(basicNotification);
    });

    it('should send a basic notification with additional data', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, ICON`, {
        badge: 0,
        data: {
          url: `venue/icon`
        }
      });
      return apns.send(basicNotification);
    });

    it('should send a silent notification', () => {
      let silentNotification = new APNS.SilentNotification(deviceToken);
      return apns.send(silentNotification);
    });

    it('should send a notification', () => {
      let notification = new APNS.Notification(deviceToken, {
        aps: {
          alert: {
            body: `Hello, Tablelist`
          }
        }
      });
      return apns.send(notification);
    });

    it('should send both notifications', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, `Hello, Multiple`);
      let silentNotification = new APNS.SilentNotification(deviceToken);
      return apns.send([basicNotification, silentNotification]).then(result => {
        should.exist(result);
        result.length.should.equal(2);
      });
    });

    it('should fail to send a notification', () => {
      let noti = new APNS.BasicNotification(`fakedevicetoken`, `Hello, bad token`);
      return apns.send(noti).catch(err => {
        should.exist(err);
        err.reason.should.equal(errors.badDeviceToken);
      });
    });

    it('should fail to send a notification and emit an error', done => {

      apns.once(errors.error, err => {
        should.exist(err);
        err.reason.should.equal(errors.badDeviceToken);
        done();
      });

      let noti = new APNS.BasicNotification(`fakedevicetoken`, `Hello, bad token`);
      apns.send(noti).catch(err => {
        should.exist(err);
      });
    });

    it('should fail to send a notification and emit an error', done => {

      apns.once(errors.badDeviceToken, err => {
        should.exist(err);
        err.reason.should.equal(errors.badDeviceToken);
        done();
      });

      let noti = new APNS.BasicNotification(`fakedevicetoken`, `Hello, bad token`);
      apns.send(noti).catch(err => {
        should.exist(err);
      });
    });
  });
});
