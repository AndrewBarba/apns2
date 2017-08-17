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
  constructor(host, port=443) {
    if (!host) throw new Error('host is required')
    this._url = new URL(`https://${host}:${port}`)
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

      let reqHeaders = headers
      reqHeaders[HTTP2_HEADER_METHOD] = method
      reqHeaders[HTTP2_HEADER_PATH] = path
      
      let resHeaders

      let req = this._client.request(reqHeaders)

      let data = ''

      req.on('response', headers => resHeaders = headers)

      req.on('data', chunk => data += chunk)

      req.on('error', reject)

      req.on('end', () => {
        if (!resHeaders) {
          return reject(new Error(`Failed to connect ${this._url}/${path}`))
        }
        resolve({
          statusCode: resHeaders[HTTP2_HEADER_STATUS],
          headers: resHeaders,
          body: data
        })
      })

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
