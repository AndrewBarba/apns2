import type { Http2Session } from "node:http2"

import type { Client, Pool } from "undici/index.js"

import type { ApnsResponseHeaders } from "./errors.js"

export function undici_getPoolClients(pool: Pool): Client[] {
  const symbols = Object.getOwnPropertySymbols(pool)
  const clientsSymbol = symbols.find((sym) => sym.description === "clients")
  if (!clientsSymbol) {
    return []
  }
  // oxlint-disable-next-line typescript/no-explicit-any -- necessary to access private property
  return (pool as any)[clientsSymbol] ?? []
}

export function undici_getClientHttp2Session(client: Client): Http2Session | null {
  const symbols = Object.getOwnPropertySymbols(client)
  const http2SessionSymbol = symbols.find((sym) => sym.description === "http2Session")
  if (!http2SessionSymbol) {
    return null
  }
  // oxlint-disable-next-line typescript/no-explicit-any -- necessary to access private property
  return (client as any)[http2SessionSymbol] ?? null
}

export function getHeader(headers: ApnsResponseHeaders, name: string): string | undefined {
  const value = headers[name]
  return Array.isArray(value) ? value[0] : value
}
