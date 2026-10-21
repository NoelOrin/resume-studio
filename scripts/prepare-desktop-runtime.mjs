#!/usr/bin/env node
/**
 * Assemble the Node runtime that ships inside the Tauri app bundle.
 *
 *   node scripts/prepare-desktop-runtime.mjs          # build + assemble
 *   node scripts/prepare-desktop-runtime.mjs --skip-build
 *
 * Layout (copied into `Resume Studio.app/Contents/Resources/runtime`):
 *   runtime/node                       Node binary (symlink resolved)
 *   runtime/package.json               project manifest
 *   runtime/dist/                      vinext production build
 *   runtime/node_modules/              runtime dependencies
 *
 * The desktop shell starts `node node_modules/vinext/dist/cli.js start --port <n>`
 * with cwd = runtime dir, so everything must sit relative to it.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, realpathSync, rmSync, statSync } from "node:fs";
import { execFileSync, execSync, spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const runtime = path.join(root, "runtime");
const skipBuild = process.argv.includes("--skip-build");

const log = (msg) => console.log(`\x1b[32m▸\x1b[0m ${msg}`);

if (!skipBuild) {
  log("building production bundle (npm run build)");
  execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
}

for (const required of ["dist", "node_modules/vinext/dist/cli.js", "package.json"]) {
  if (!existsSync(path.join(root, required))) {
    console.error(`✗ missing ${required} — run \`npm run build\` first`);
    process.exit(1);
  }
}

log("cleaning runtime/");
rmSync(runtime, { recursive: true, force: true });
mkdirSync(runtime, { recursive: true });

log("copying node binary");
const isWin = process.platform === "win32";
const nodeName = isWin ? "node.exe" : "node";
const nodeReal = realpathSync(process.execPath);
cpSync(nodeReal, path.join(runtime, nodeName));
// Homebrew ships a universal node (~227MB). Thin it to the host arch unless
// a universal build was explicitly requested.
if (process.platform === "darwin" && !process.argv.includes("--universal")) {
  try {
    execFileSync("lipo", [
      "-thin",
      process.arch === "arm64" ? "arm64" : "x86_64",
      path.join(runtime, nodeName),
      "-output",
      path.join(runtime, nodeName),
    ]);
    log(`thinned node to ${process.arch}`);
  } catch {
    log("lipo unavailable — keeping universal node");
  }
}
if (!isWin) execFileSync("chmod", ["+x", path.join(runtime, nodeName)]);

log("copying package.json");
cpSync(path.join(root, "package.json"), path.join(runtime, "package.json"));

log("copying dist/");
cpSync(path.join(root, "dist"), path.join(runtime, "dist"), { recursive: true });

// Install the *production* dependency tree instead of copying the local one.
// Copying node_modules also copies dev-only packages, and any aggressive pruning
// risks removing transitive runtime deps (e.g. rolldown needs @rolldown/pluginutils).
log("installing production dependencies (npm ci --omit=dev)");
cpSync(path.join(root, "package-lock.json"), path.join(runtime, "package-lock.json"));
// Node >=18 refuses to spawn the `npm.cmd` shim without a shell on Windows.
if (process.platform === "win32") {
  execSync("npm ci --omit=dev --no-audit --no-fund", { cwd: runtime, stdio: "inherit" });
} else {
  execFileSync("npm", ["ci", "--omit=dev", "--no-audit", "--no-fund"], {
    cwd: runtime,
    stdio: "inherit",
  });
}

// Windows keeps file handles open for a moment after kill(); never let temp
// cleanup turn a successful smoke test into a failed build.
function cleanup(dir) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
      return;
    } catch (err) {
      if (attempt === 5) {
        log(`temp cleanup skipped (${err.code ?? err.message})`);
        return;
      }
      // sync sleep without spawning a shell (timeout/sleep differ per platform)
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    }
  }
}

function killAndWait(child) {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    child.once("exit", done);
    try {
      child.kill("SIGKILL");
    } catch {
      done();
    }
    setTimeout(done, 5000);
  });
}

// Smoke test: boot the packaged server once before handing it to Tauri.
// IMPORTANT: run it from an isolated copy outside the project tree. Node walks up
// the directory chain when resolving modules, so testing `runtime/` in place can
// silently borrow the project's own node_modules and hide missing packages.
log("smoke-testing packaged server (isolated copy)");
const port = 3191;
const probeRoot = path.join(os.tmpdir(), `resume-runtime-smoke-${process.pid}`);
const probeRuntime = path.join(probeRoot, "runtime");
const probeData = path.join(probeRoot, "data");
cleanup(probeRoot);
cpSync(runtime, probeRuntime, { recursive: true, dereference: true });

const child = spawn(
  path.join(probeRuntime, nodeName),
  [path.join(probeRuntime, "node_modules/vinext/dist/cli.js"), "start", "--port", String(port)],
  {
    cwd: probeRuntime,
    env: { ...process.env, NODE_ENV: "production", RESUME_DATA_DIR: probeData },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let output = "";
child.stdout.on("data", (d) => (output += d));
child.stderr.on("data", (d) => (output += d));

const deadline = Date.now() + 25_000;
let ok = false;
while (Date.now() < deadline) {
  try {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    const page = await fetch(`http://127.0.0.1:${port}/`);
    const html = await page.text();
    if (health.ok && page.ok && html.includes("RESUME STUDIO")) {
      const body = await health.json();
      log(`server healthy · templates: ${body.templates?.join(", ")}`);
      ok = true;
      break;
    }
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 250));
}

await killAndWait(child);
cleanup(probeRoot);

if (!ok) {
  console.error("✗ packaged server did not become healthy:\n" + output.slice(-2000));
  process.exit(1);
}

const size = (dir) => {
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) bytes += size(full);
    else if (entry.isFile()) bytes += statSync(full).size;
  }
  return bytes;
};
const human = (b) => `${(b / 1024 / 1024).toFixed(0)}MB`;
log(`runtime/ ready — ${human(size(runtime))} total`);

