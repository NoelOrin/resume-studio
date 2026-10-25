import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const workDir = await mkdtemp(path.join(tmpdir(), "resume-artifacts-"));

const {
  MAX_PNG_PAGES,
  NoBrowserError,
  pdfArgs,
  pngArgs,
  pngWindowHeight,
  probeBrowserBin,
  buildArtifact,
} = await import("../src/server/artifacts");
const { defaultResume } = await import("../src/data/defaultResume");

test.after(async () => {
  await rm(workDir, { recursive: true, force: true });
});

test("pdfArgs builds the headless print invocation", () => {
  const args = pdfArgs("file:///tmp/r.html", "/tmp/r.pdf");
  assert.deepEqual(args, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    "--print-to-pdf=/tmp/r.pdf",
    "file:///tmp/r.html",
  ]);
});

test("pngArgs builds a full-height screenshot invocation", () => {
  const args = pngArgs("file:///tmp/r.html", "/tmp/r.png", 3);
  assert.deepEqual(args, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    `--window-size=794,${pngWindowHeight(3)}`,
    "--screenshot=/tmp/r.png",
    "file:///tmp/r.html",
  ]);
  assert.equal(pngWindowHeight(1), 1125);
  assert.equal(pngWindowHeight(3), 3 * 1123 + 2);
});

test("pngArgs refuses documents beyond the page cap", () => {
  assert.throws(() => pngArgs("file:///x", "/tmp/x.png", MAX_PNG_PAGES + 1), /pages|20/i);
});

test("probeBrowserBin returns the first candidate that exists", async () => {
  const missing = path.join(workDir, "nope-a");
  const present = path.join(workDir, "yes-b");
  await writeFile(present, "#!/bin/sh\n", "utf8");
  assert.equal(probeBrowserBin([missing, present]), present);
  assert.equal(probeBrowserBin([missing]), null);
});

test("buildArtifact throws NoBrowserError when no browser is available", async () => {
  await assert.rejects(
    buildArtifact("pdf", defaultResume, "t", { candidates: [] }),
    (error: unknown) => error instanceof NoBrowserError && error.code === "NO_BROWSER",
  );
});

/* A shell script that plays browser: records its args, copies the rendered
   html next to them and creates whatever output file the flags ask for. */
async function fakeBrowser(): Promise<{ bin: string; capture: string }> {
  const capture = path.join(workDir, "captured-args.txt");
  const bin = path.join(workDir, "fake-browser.sh");
  await writeFile(
    bin,
    [
      "#!/bin/sh",
      `printf '%s\\n' "$@" > "${capture}"`,
      'for a in "$@"; do',
      "  case \"$a\" in",
      "    file://*) cp \"${a#file://}\" \"" + path.join(workDir, "captured.html") + "\" ;;",
      "    --print-to-pdf=*) touch \"${a#--print-to-pdf=}\" ;;",
      "    --screenshot=*) touch \"${a#--screenshot=}\" ;;",
      "  esac",
      "done",
      "exit 0",
      "",
    ].join("\n"),
    "utf8",
  );
  await chmod(bin, 0o755);
  return { bin, capture };
}

test("buildArtifact drives the browser with the pdf args and injects no extra shell", async () => {
  const { bin, capture } = await fakeBrowser();
  const artifact = await buildArtifact("pdf", defaultResume, "林知远 · 简历", { browserBin: bin });
  assert.ok(artifact.filename.endsWith(".pdf"));
  const args = (await readFile(capture, "utf8")).split("\n").filter(Boolean);
  assert.ok(args.includes("--no-pdf-header-footer"));
  assert.ok(args.some((arg) => arg.startsWith("--print-to-pdf=")));
  assert.ok(args.every((arg) => !arg.startsWith("--screenshot")));
});

test("buildArtifact flattens the page shell for png output", async () => {
  const { bin, capture } = await fakeBrowser();
  const artifact = await buildArtifact("png", defaultResume, "简历", { browserBin: bin });
  assert.ok(artifact.filename.endsWith(".png"));
  const html = await readFile(path.join(workDir, "captured.html"), "utf8");
  assert.ok(html.includes("artifact-png-css"), "png render must inject the flat-page override style");
  const args = (await readFile(capture, "utf8")).split("\n").filter(Boolean);
  assert.ok(args.some((arg) => arg.startsWith("--window-size=794,")));
});

test("buildArtifact reports the rendered page count and template", async () => {
  const { bin } = await fakeBrowser();
  const artifact = await buildArtifact("pdf", defaultResume, "t", { browserBin: bin });
  assert.ok(artifact.pages >= 1);
  assert.ok(artifact.templateId.length > 0);
});

test("buildArtifact kills a hanging browser after the timeout", async () => {
  const bin = path.join(workDir, "slow-browser.sh");
  await writeFile(bin, "#!/bin/sh\nsleep 5\n", "utf8");
  await chmod(bin, 0o755);
  await assert.rejects(
    buildArtifact("pdf", defaultResume, "t", { browserBin: bin, timeoutMs: 400 }),
    /超时|timed out/i,
  );
});

const realBrowser = probeBrowserBin();
test(
  "real browser end-to-end: pdf magic bytes and png dimensions",
  { skip: realBrowser ? false : "no chromium browser on this machine" },
  async () => {
    const pdf = await buildArtifact("pdf", defaultResume, "e2e", { timeoutMs: 60_000 });
    assert.equal(pdf.bytes.subarray(0, 4).toString("latin1"), "%PDF");
    const png = await buildArtifact("png", defaultResume, "e2e", { timeoutMs: 60_000 });
    // PNG magic: 89 50 4E 47
    assert.equal(png.bytes.subarray(1, 4).toString("latin1"), "PNG");
    assert.ok(png.pages >= 1, "page count travels with the artifact");
  },
);
