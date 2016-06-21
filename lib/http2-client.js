'use strict';

const http2 = require('http2');
const Promise = require('bluebird');

/**
 * @class HTTP2Client
 */
class HTTP2Client {

  /**
   * @constructor
   */
  constructor(host, port) {
    this._host = host;
    this._port = port;
  }

  /**
   * @method get
   */
  get(options) {
    options.method = `GET`;
    return this.request(options);
  }

  /**
   * @method post
   */
  post(options, body) {
    options.method = `POST`;
    return this.request(options, body);
  }

  /**
   * @method put
   */
  put(options, body) {
    options.method = `PUT`;
    return this.request(options, body);
  }

  /**
   * @method delete
   */
  delete(options) {
    options.method = `DELETE`;
    return this.request(options);
  }

  /**
   * @method request
   * @param {Object} options
   * @param {String} options.method
   * @param {String} options.host
   * @param {String|Buffer} [body]
   * @return {Promise<ServerResponse>}
   */
  request(options, body) {
    if (!options) return Promise.reject(`options is required`);
    if (!options.method) return Promise.reject(`options.method is required`);
    if (!options.path) return Promise.reject(`options.path is required`);

    options.host = this._host;
    options.port = this._port;

    return new Promise((resolve, reject) => {

      let req = http2.request(options, res => {

        let data = [];

        res.on(`data`, chunk => {
          data.push(chunk.toString(`utf8`));
        });

        res.on(`end`, () => {
          res.body = data.join(``);
          resolve(res);
        });
      });

      req.on(`error`, err => {
        reject(err);
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }
}

module.exports = HTTP2Client;
