#!/usr/bin/env bash
# Packs the build, installs it into a temporary project like a consumer would,
# and runs the smoke test with Node and, when available, Bun
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

tarball="$(cd "$root" && npm pack --silent --pack-destination "$tmp")"
cd "$tmp"
npm init -y >/dev/null
npm install --silent --no-audit --no-fund "$tmp/$tarball"
cp "$root/scripts/package-smoke.mjs" .

node package-smoke.mjs
if command -v bun >/dev/null; then
  bun package-smoke.mjs
fi
