'use strict';

const https = require('https');
const Promise = require('bluebird');
const spdy = require('spdy');

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

    options.host = options.host || this._host;
    options.port = options.port || this._port;

    options.agent = spdy.createAgent({
      host: options.host,
      port: options.port,
      spdy: {
        protocols: [`h2`]
      }
    }).once(`error`, function (err) {
      this.emit(err);
    });

    return new Promise((resolve, reject) => {

      // Create the request
      let req = https.request(options, res => {
        let data = [];

        // Append data
        res.on(`data`, chunk => {
          data.push(chunk.toString(`utf8`));
        });

        // End request
        res.on(`end`, () => {

          // Set body
          res.body = data.join(``);

          // Resolve promise
          resolve(res);
        });
      });

      // Write data
      if (body) {
        req.write(body);
      }

      // Send the request
      req.end();

      // Handle error
      req.on(`error`, err => reject(err));
    });
  }
}

module.exports = HTTP2Client;
