// Writes dist/{cjs,esm}/package.json. Node resolves "#" imports against the
// nearest package.json, so each build needs the root "imports" map too
import { readFileSync, writeFileSync } from "node:fs"

const [type, dir] = process.argv.slice(2)
const { imports } = JSON.parse(readFileSync("package.json", "utf8"))
writeFileSync(`${dir}/package.json`, `${JSON.stringify({ type, imports })}\n`)
