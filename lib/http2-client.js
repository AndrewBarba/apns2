const http2 = require('http2')
const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  NGHTTP2_CANCEL
} = http2.constants

/**
 * @class HTTP2Client
 */
class HTTP2Client {
  /**
   * @constructor
   */
  constructor(host, port = 443, { timeout = 5000 } = {}) {
    if (!host) throw new Error('host is required')
    this._timeout = timeout
    this._client = http2.connect(`https://${host}:${port}`)
  }

  /**
   * @param {ClientHttp2Session}
   */
  get client() {
    return this._client
  }

  /**
   * @param {Number}
   */
  get timeout() {
    return this._timeout
  }

  /**
   * @method destroy
   */
  close() {
    this.client.close()
  }

  /**
   * @method request
   * @param {Object} options
   * @param {String} options.method
   * @param {String} options.host
   * @param {String|Buffer} [body]
   * @return {Promise<ServerResponse>}
   */
  request({ method, path, headers = {} }, body = null) {
    if (!method) throw new Error('method is required')
    if (!path) throw new Error('path is required')

    return new Promise((resolve, reject) => {
      headers[HTTP2_HEADER_METHOD] = method
      headers[HTTP2_HEADER_PATH] = path

      const req = this.client.request(headers)

      // Cancel request after timeout
      req.setTimeout(this.timeout, () => {
        req.close(NGHTTP2_CANCEL)
        reject(new Error(`http2: timeout ${method} ${path}`))
      })

      // Response handling
      req.on('response', (headers) => {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
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

      // Post body
      if (body) {
        req.write(body)
      }

      req.end()
    })
  }
}

module.exports = HTTP2Client
