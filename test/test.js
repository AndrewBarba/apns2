'use strict';

const fs = require('fs');
const APNS = require('../lib/apns');
const HTTP2Client = require('../lib/http2-client');
const should = require('should');

describe('http2', () => {

  let client = new HTTP2Client('www.google.com', 443);

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

  let deviceToken = `570e137a42cb2782527a52fe0b5a9fc8b3e63d3249c505ad15e89bdef6d5c434`;

  describe('certs', () => {

    let apns = new APNS({
      cert: fs.readFileSync(`${__dirname}/certs/cert.pem`, 'utf8'),
      key: fs.readFileSync(`${__dirname}/certs/key.pem`, 'utf8')
    });

    it('should send a basic notification', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, 'Hello, World');
      return apns.send(basicNotification);
    });

    it('should send a silent notification', () => {
      let silentNotification = new APNS.SilentNotification(deviceToken);
      return apns.send(silentNotification);
    });

    it('should send both notifications', () => {
      let basicNotification = new APNS.BasicNotification(deviceToken, 'Hello, World');
      let silentNotification = new APNS.SilentNotification(deviceToken);
      return apns.send([basicNotification, silentNotification]).then(result => {
        should.exist(result);
        result.length.should.equal(2);
      });
    });
  });

  describe('signing token', () => {
    // todo
  });
});
