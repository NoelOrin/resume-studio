import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

function repo(rel: string): string {
  return readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8')
}

/**
 * package.json is the version single source of truth (src/lib/version.ts reads
 * it; the desktop runtime copies it). These re-declarations exist only because
 * tauri.conf.json / Cargo.toml / the MCP server info need their own formats —
 * this test fails the build the moment they drift.
 */
test('version declarations match package.json', () => {
  const version = JSON.parse(repo('package.json')).version
  assert.match(version, /^\d+\.\d+\.\d+$/, 'package.json version must be semver')

  assert.equal(
    JSON.parse(repo('src-tauri/tauri.conf.json')).version,
    version,
    'src-tauri/tauri.conf.json version drifts — run `npm run version:sync`',
  )

  assert.equal(
    repo('src-tauri/Cargo.toml').match(/^version = "(.+)"$/m)?.[1],
    version,
    'src-tauri/Cargo.toml version drifts — run `npm run version:sync`',
  )

  assert.equal(
    repo('src/mcp/config.ts').match(/^\s*version: "(.+)",$/m)?.[1],
    version,
    'src/mcp/config.ts version drifts — run `npm run version:sync`',
  )
})
