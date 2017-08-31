const https = require('https')
const spdy = require('spdy')
const Promise = require('bluebird')

/**
 * @class SpdyClient
 */
class SpdyClient {

  /**
   * @constructor
   */
  constructor(host, port=443) {
    if (!host) throw new Error('host is required')
    this._host = host
    this._port = port
    this.agent()
  }

  /**
   * @method get
   */
  get(options) {
    options.method = `GET`
    return this.request(options)
  }

  /**
   * @method post
   */
  post(options, body) {
    options.method = `POST`
    return this.request(options, body)
  }

  /**
   * @method put
   */
  put(options, body) {
    options.method = `PUT`
    return this.request(options, body)
  }

  /**
   * @method delete
   */
  delete(options) {
    options.method = `DELETE`
    return this.request(options)
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
    if (!options) return Promise.reject(`options is required`)
    if (!options.method) return Promise.reject(`options.method is required`)
    if (!options.path) return Promise.reject(`options.path is required`)

    options.agent = this.agent()

    return new Promise((resolve, reject) => {
      this._reject = reject

      let req = https.request(options, res => {
        let body = ''

        res.on('data', chunk => body += chunk)

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body
          })
        })
      })

      req.on('error', reject)

      if (body) {
        req.write(body)
      }

      req.end()
    })
  }

  /**
   * @private
   * @return {Http2Session}
   */
  agent() {
    if (this._agent && this._agent._spdyState.connection && this._agent._spdyState.connection._spdyState.goaway === false) {
      return this._agent
    }

    let agent = this._agent = spdy.createAgent({
      host: this._host,
      port: this._port,
      spdy: {
        protocols: ['h2']
      }
    })

    agent.on('error', err => {
      if (!this._reject) return
      this._reject(err)
    })

    return agent
  }
}

module.exports = SpdyClient
