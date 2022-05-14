import * as http2 from 'http2'

const {
  HTTP2_HEADER_SCHEME,
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  NGHTTP2_CANCEL
} = http2.constants

export interface Http2ClientOptions {
  port?: number
  requestTimeout?: number
  pingInterval?: number
}

export interface Http2ClientRequestOptions {
  method: string
  path: string
  headers: Record<string, string | undefined>
  body?: string | Buffer
}

export interface Http2ClientResponse {
  statusCode: number
  headers: Record<string, unknown>
  body: string
}

export class Http2Client {
  readonly url: string
  client: http2.ClientHttp2Session | null
  readonly requestTimeout: number
  readonly pingInterval: number
  private pingIntervalHandle: any | null

  constructor(host: string, options: Http2ClientOptions = {}) {
    this.url = `https://${host}:${options.port}`
    this.requestTimeout = options.requestTimeout ?? 5000
    this.pingInterval = options.pingInterval ?? 60000
    this.pingIntervalHandle = null
    this.client = null
  }

  /**
   * Closes the underlying http2 client
   */
  close() {
    return new Promise((resolve) => {
      if (this.client && !this.client.closed) {
        this.client.close(() => resolve(null))
      } else {
        resolve(null)
      }
    })
  }

  /**
   * Destroys the underlying http2 client
   */
  destroy(error?: Error, code?: number) {
    if (this.client && !this.client.destroyed) {
      this.client.destroy(error, code)
    }
  }

  /**
   * Sends an http2 request
   */
  request(options: Http2ClientRequestOptions): Promise<Http2ClientResponse> {
    return new Promise((resolve, reject) => {
      const headers = {
        ...options.headers,
        [HTTP2_HEADER_SCHEME]: 'https',
        [HTTP2_HEADER_METHOD]: options.method,
        [HTTP2_HEADER_PATH]: options.path
      }

      const req = this._getOrCreateClient().request(headers)

      // Store response properties
      const responseHeaders: Record<string, unknown> = {}
      let responseBody = ''

      // Cancel request after timeout
      req.setTimeout(this.requestTimeout, () => {
        req.close(NGHTTP2_CANCEL)
        reject(new Error(`http2: timeout ${options.method} ${options.path}`))
      })

      // Response header handling
      req.on('response', (headers: Record<string, unknown>) => {
        Object.assign(responseHeaders, headers)
      })

      // Response body handling
      req.on('data', (chunk: Buffer) => {
        responseBody += chunk.toString('utf8')
      })

      // End request handling
      req.on('end', () => {
        resolve({
          statusCode: Number(responseHeaders[HTTP2_HEADER_STATUS]),
          headers: responseHeaders,
          body: responseBody
        })
      })

      // Error handling
      req.on('error', reject)

      // Post body
      if (options.body) {
        req.write(options.body)
      }

      req.end()
    })
  }

  /**
   * Returns an existing client or creates a new one
   */
  _getOrCreateClient() {
    if (this.client) {
      return this.client
    }
    const client = http2.connect(this.url)
    client.on('close', () => this._closeAndDestroy(client))
    client.on('error', () => this._closeAndDestroy(client))
    client.on('socketError', () => this._closeAndDestroy(client))
    client.on('goaway', () => this._closeAndDestroy(client))
    if (this.pingInterval) {
      this._createPingInterval(client)
    }
    this.client = client
    return client
  }

  /**
   * Sends a ping on an interval
   */
  _createPingInterval(client: http2.ClientHttp2Session) {
    const sendPing = () => {
      client.ping(() => {})
    }
    this.pingIntervalHandle = setInterval(sendPing, this.pingInterval).unref()
  }

  /**
   * Closes and destorys the existing client. A new client will be created on next request
   */
  async _closeAndDestroy(client: http2.ClientHttp2Session) {
    clearInterval(this.pingIntervalHandle)
    await this.close()
    this.destroy()
    this.client = null
  }
}
