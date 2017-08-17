const { URL } = require('url')
const http2 = require('http2')
const Promise = require('bluebird')

const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS
} = http2.constants

/**
 * @class HTTP2Client
 */
class HTTP2Client {

  /**
   * @constructor
   */
  constructor(host, port=443, { timeout=5000 }={}) {
    if (!host) throw new Error('host is required')
    this._url = new URL(`https://${host}:${port}`)
    this._timeout = timeout
    this._resetClient()
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
  request({ method, path, headers={} }, body=null) {
    if (!method) return Promise.reject(`method is required`)
    if (!path) return Promise.reject(`path is required`)

    return new Promise((resolve, reject) => {
      headers[HTTP2_HEADER_METHOD] = method
      headers[HTTP2_HEADER_PATH] = path
      
      let req = this._client.request(headers)
      
      // Cancel request after timeout
      req.setTimeout(this._timeout, () => req.rstWithCancel())

      // Response handling
      req.on('response', headers => {
        let body = ''
        
        req.on('data', chunk => body += chunk)
        
        req.on('end', () => {
          resolve({
            statusCode: headers[HTTP2_HEADER_STATUS],
            headers,
            body
          })
        })
      })

      // Error handling
      req.on('error', reject)
      req.on('timeout', () => reject(new Error(`http2: timeout connecting to ${this._url}`)))

      // Post body
      if (body) {
        req.write(body)
      }

      req.end()
    })
  }

  /**
   * @private
   */
  _resetClient() {
    if (this._client) {
      this._client.destroy()
    }
    this._client = http2.connect(this._url)
    this._client.on('goaway', () => this._resetClient())
  }
}

module.exports = HTTP2Client
