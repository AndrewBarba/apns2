const http2 = require('http2')
const {
  HTTP2_HEADER_SCHEME,
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
  constructor(host, { port = 443, requestTimeout = 5000, pingInterval = 60000 } = {}) {
    if (!host) throw new Error('host is required')
    this._requestTimeout = requestTimeout
    this._pingIntervalMs = pingInterval
    this._pingInterval = null
    this._url = `https://${host}:${port}`
  }

  /**
   * @param {ClientHttp2Session}
   */
  get client() {
    return this._client
  }

  /**
   * Closes the underlying http2 client
   *
   * @method close
   */
  close(client = this._client) {
    return new Promise((resolve) => {
      if (client && !client.closed) {
        client.close(() => resolve())
      } else {
        resolve()
      }
    })
  }

  /**
   * Destroys the underlying http2 client
   *
   * @method destroy
   */
  destroy(client = this._client) {
    if (client && !client.destroyed) {
      client.destroy(...arguments)
    }
  }

  /**
   * Sends an http2 request
   *
   * @method request
   * @param {Object} options
   * @param {String} options.method
   * @param {String} options.host
   * @param {Object} [options.headers]
   * @param {String|Buffer} [options.body]
   * @return {Promise<ServerResponse>}
   */
  request({ method, path, headers = {}, body = null }) {
    if (!method) throw new Error('method is required')
    if (!path) throw new Error('path is required')

    return new Promise((resolve, reject) => {
      Object.assign(headers, {
        [HTTP2_HEADER_SCHEME]: 'https',
        [HTTP2_HEADER_METHOD]: method,
        [HTTP2_HEADER_PATH]: path
      })

      const req = this._getOrCreateClient().request(headers)

      // Store response properties
      let responseHeaders = {}
      let responseBody = ''

      // Cancel request after timeout
      req.setTimeout(this._requestTimeout, () => {
        req.close(NGHTTP2_CANCEL)
        reject(new Error(`http2: timeout ${method} ${path}`))
      })

      // Response header handling
      req.on('response', (headers) => {
        responseHeaders = headers
      })

      // Response body handling
      req.on('data', (chunk) => {
        responseBody += chunk
      })

      // End request handling
      req.on('end', () => {
        resolve({
          statusCode: responseHeaders[HTTP2_HEADER_STATUS],
          headers: responseHeaders,
          body: responseBody
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

  /**
   * Returns an existing client or creates a new one
   *
   * @private
   * @method _getOrCreateClient
   */
  _getOrCreateClient() {
    if (this._client) {
      return this._client
    }
    const client = http2.connect(this._url)
    client.on('close', () => this._closeAndDestroy(client))
    client.on('error', () => this._closeAndDestroy(client))
    client.on('socketError', () => this._closeAndDestroy(client))
    client.on('goaway', () => this._closeAndDestroy(client))
    if (this._pingIntervalMs) {
      this._createPingInterval(client)
    }
    this._client = client
    return client
  }

  /**
   * Sends a ping on an interval
   *
   * @private
   * @method _createPingInterval
   */
  _createPingInterval(client) {
    const sendPing = () => {
      client.ping(null, () => {})
    }
    this._pingInterval = setInterval(sendPing, this._pingIntervalMs).unref()
  }

  /**
   * Closes and destorys the existing client. A new client will be created on next request
   *
   * @private
   * @method _closeAndDestroy
   */
  async _closeAndDestroy(client) {
    this._client = null
    clearInterval(this._pingInterval)
    await this.close(client)
    this.destroy(client)
  }
}

module.exports = HTTP2Client
