#!/usr/bin/env node
// Keep the duplicated version declarations in lockstep with package.json.
//
// package.json is the single source of truth (see src/lib/version.ts); the
// desktop shell and MCP server info re-declare the number in formats those
// toolchains require. Run via `npm run version:sync`; `--check` exits 1 when
// anything is out of sync without writing (CI / prebuild guard).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = pkg.version;
if (typeof version !== "string" || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`package.json has no usable version: ${JSON.stringify(version)}`);
  process.exit(1);
}

const targets = [
  {
    file: "src-tauri/tauri.conf.json",
    read: () => JSON.parse(readFileSync(path("src-tauri/tauri.conf.json"), "utf8")),
    write: (conf) => writeFileSync(path("src-tauri/tauri.conf.json"), `${JSON.stringify(conf, null, 2)}\n`),
    get: (conf) => conf.version,
    set: (conf) => {
      conf.version = version;
      return conf;
    },
  },
  {
    file: "src-tauri/Cargo.toml",
    text: true,
    get: (t) => t.match(/^version = "(.+)"$/m)?.[1],
    set: (t) => t.replace(/^version = ".+"$/m, `version = "${version}"`),
  },
  {
    file: "src/mcp/config.ts",
    text: true,
    get: (t) => t.match(/^\s*version: "(.+)",$/m)?.[1],
    set: (t) => t.replace(/^(\s*version: )".+",$/m, `$1"${version}",`),
  },
];

function path(rel) {
  return join(root, rel);
}

const checkOnly = process.argv.includes("--check");
let drift = false;

for (const target of targets) {
  const current = target.get(target.text ? readFileSync(path(target.file), "utf8") : target.read());
  if (current === version) continue;
  drift = true;
  if (checkOnly) {
    console.error(`${target.file}: ${current} ≠ package.json ${version}`);
    continue;
  }
  const next = target.text
    ? target.set(readFileSync(path(target.file), "utf8"))
    : target.set(target.read());
  writeFileSync(path(target.file), target.text ? next : `${JSON.stringify(next, null, 2)}\n`);
  console.log(`${target.file}: ${current} → ${version}`);
}

if (checkOnly && drift) {
  console.error("version drift detected — run `npm run version:sync`");
  process.exit(1);
}
if (!drift) console.log(`all version declarations match package.json (${version})`);
