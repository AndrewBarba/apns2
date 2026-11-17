// Smoke test for the packed package, run from a project that installed the
// tarball. Uses a throwaway key, so APNs must answer 403 InvalidProviderToken
import { generateKeyPairSync, randomUUID } from "node:crypto"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const runtime = typeof Bun !== "undefined" ? `bun ${Bun.version}` : `node ${process.version}`
const signingKey = generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey.export({
  type: "pkcs8",
  format: "pem",
})

for (const [format, lib] of [
  ["esm", await import("apns2")],
  ["cjs", require("apns2")],
]) {
  const client = new lib.ApnsClient({
    team: "TFLP87PW54",
    keyId: "7U6GT5Q49J",
    signingKey,
    host: lib.Host.development,
    defaultTopic: "com.example.app",
  })
  const id = randomUUID()
  const [result] = await client.sendMany([new lib.Notification("fakedevicetoken", { id })])
  await client.close()
  if (!(result.error instanceof lib.ApnsError) || result.error.reason !== "InvalidProviderToken") {
    console.error(runtime, format, "unexpected result", result.error ?? result)
    process.exit(1)
  }
  if (result.error.apnsId !== id) {
    console.error(runtime, format, "apns-id mismatch", result.error.apnsId, id)
    process.exit(1)
  }
  console.log(runtime, format, "ok")
}
