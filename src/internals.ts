import type { Http2Session } from "node:http2"
import type { Client } from "undici"
import type { Pool } from "undici"

export function undici_getPoolClients(pool: Pool): Client[] {
  const symbols = Object.getOwnPropertySymbols(pool)
  const clientsSymbol = symbols.find((sym) => sym.description === "clients")
  if (!clientsSymbol) {
    return []
  }
  // biome-ignore lint/suspicious/noExplicitAny: necessary to access private property
  return (pool as any)[clientsSymbol] ?? []
}

export function undici_getClientHttp2Session(client: Client): Http2Session | null {
  const symbols = Object.getOwnPropertySymbols(client)
  const http2SessionSymbol = symbols.find((sym) => sym.description === "http2Session")
  if (!http2SessionSymbol) {
    return null
  }
  // biome-ignore lint/suspicious/noExplicitAny: necessary to access private property
  return (client as any)[http2SessionSymbol] ?? null
}
