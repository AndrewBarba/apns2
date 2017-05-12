const { URL } = require('url')
const http2 = require('http2')
const Promise = require('bluebird')

/**
 * @class HTTP2Client
 */
class HTTP2Client {

  /**
   * @constructor
   */
  constructor(host, port) {
    this._url = new URL(`https://${host}:${port}`)
    this._client = http2.connect(this._url)
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
      reqHeaders[`:method`] = method
      reqHeaders[`:path`] = path
      
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
          statusCode: parseInt(resHeaders[`:status`]),
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
}

module.exports = HTTP2Client
