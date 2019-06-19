const { URL } = require('url')
const http2 = require('http2')

// Check to make sure this is the native http2
if (!http2.constants || !http2.constants.NGHTTP2_SESSION_CLIENT) {
  throw new Error('Invalid http2 library, must be running Node v8.10 or later')
}

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
    this._ready = false
    this._session = null
  }

  /**
   * @param {Boolean} ready
   */
  get ready() {
    return this._ready && this._session && !this._session.destroyed
  }

  /**
   * @param {Http2Session}
   */
  get session() {
    return this._session
  }

  /**
   * @method connect
   * @return {Promise}
   */
  async connect() {
    return new Promise((resolve, reject) => {
      let session = http2.connect(this._url)
      session.once('error', reject)
      session.once('socketError', reject)
      session.once('connect', () => {
        this._connected(session)
        resolve(this)
      })
    })
  }

  /**
   * @method destroy
   */
  destroy() {
    if (this._session && !this._session.destroyed) {
      this._session.destroy()
    }
    this._ready = false
    this._session = null
  }

  /**
   * @method get
   */
  async get(options) {
    options.method = `GET`
    return this.request(options)
  }

  /**
   * @method post
   */
  async post(options, body) {
    options.method = `POST`
    return this.request(options, body)
  }

  /**
   * @method put
   */
  async put(options, body) {
    options.method = `PUT`
    return this.request(options, body)
  }

  /**
   * @method delete
   */
  async delete(options) {
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
  async request({ method, path, headers={} }, body=null) {
    if (!method) throw new Error('method is required')
    if (!path) throw new Error('path is required')
    if (!this._session) throw new Error('Must call connect() before making a request')

    return new Promise((resolve, reject) => {
      headers[HTTP2_HEADER_METHOD] = method
      headers[HTTP2_HEADER_PATH] = path

      let req = this._session.request(headers)

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
   * @method _connected
   * @param {Http2Session} session
   */
  _connected(session) {
    session.on('close', () => this.destroy())
    session.on('frameError', () => this.destroy())
    session.on('goaway', () => this.destroy())
    session.on('socketError', () => this.destroy())
    session.on('timeout', () => this.destroy())
    this._session = session
    this._ready = true
  }
}

module.exports = HTTP2Client
