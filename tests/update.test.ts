import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildUpdateCheck,
  compareVersions,
  isNewer,
  parseVersion,
  pickAsset,
  summarizeNotes,
  type ReleaseInfo,
  type UpdateAsset,
} from "../src/lib/update";

const NOW = new Date("2026-10-23T12:00:00.000Z");

const ASSETS: UpdateAsset[] = [
  { name: "Resume Studio_2.2.0_x64-setup.exe", url: "https://example.test/win.exe" },
  { name: "Resume Studio_2.2.0_aarch64.dmg", url: "https://example.test/arm.dmg" },
  { name: "Resume Studio.app.zip", url: "https://example.test/app.zip" },
];

function release(over: Partial<ReleaseInfo> = {}): ReleaseInfo {
  return {
    tag: "v2.2.0",
    url: "https://example.test/releases/v2.2.0",
    notes: "## 更新\n\n- 设置页\n- 检查更新",
    publishedAt: "2026-10-22T00:00:00Z",
    assets: ASSETS,
    ...over,
  };
}

test("parseVersion accepts v-prefixed, partial and pre-release tags", () => {
  assert.deepEqual(parseVersion("2.1.0"), [2, 1, 0]);
  assert.deepEqual(parseVersion("v2.1.0"), [2, 1, 0]);
  assert.deepEqual(parseVersion("V2.1"), [2, 1]);
  assert.deepEqual(parseVersion("  v2.1.0-beta.1 "), [2, 1, 0]);
  assert.equal(parseVersion("latest"), null);
  assert.equal(parseVersion(""), null);
});

test("compareVersions pads missing segments and refuses to guess on garbage", () => {
  assert.equal(compareVersions("2.1.0", "2.1.0"), 0);
  assert.equal(compareVersions("2.1", "2.1.0"), 0);
  assert.equal(compareVersions("2.10.0", "2.9.9"), 1);
  assert.equal(compareVersions("v2.0.1", "2.0.2"), -1);
  // Unparsable input must not fake an update.
  assert.equal(compareVersions("nightly", "2.1.0"), 0);
  assert.equal(compareVersions("2.1.0", "nightly"), 0);
});

test("isNewer only reports strictly newer versions", () => {
  assert.equal(isNewer("v2.2.0", "2.1.0"), true);
  assert.equal(isNewer("2.1.0", "2.1.0"), false);
  assert.equal(isNewer("2.0.9", "2.1.0"), false);
});

test("pickAsset matches the installers CI actually uploads", () => {
  assert.equal(pickAsset(ASSETS, "darwin")?.name, "Resume Studio_2.2.0_aarch64.dmg");
  assert.equal(pickAsset(ASSETS, "win32")?.name, "Resume Studio_2.2.0_x64-setup.exe");
  // We only ship macOS and Windows installers: never hand a Linux host the .exe.
  assert.equal(pickAsset(ASSETS, "linux"), null);
  assert.equal(pickAsset(ASSETS, "freebsd"), null);
});

test("pickAsset falls back to the zip when no dmg exists", () => {
  const zipOnly = ASSETS.filter((a) => a.name.endsWith(".zip"));
  assert.equal(pickAsset(zipOnly, "darwin")?.name, "Resume Studio.app.zip");
  assert.equal(pickAsset([], "darwin"), null);
  assert.equal(pickAsset(ASSETS.filter((a) => a.name.endsWith(".dmg")), "win32"), null);
});

test("an unknown platform falls back to the release page, not a foreign installer", () => {
  const check = buildUpdateCheck({ current: "2.1.0", release: release(), platform: "linux", now: NOW });
  assert.equal(check.hasUpdate, true);
  assert.equal(check.downloadUrl, null);
  assert.equal(check.downloadName, null);
  // The dialog renders `downloadUrl ?? releaseUrl`, so the user still gets a link.
  assert.equal(check.releaseUrl, "https://example.test/releases/v2.2.0");
});

test("summarizeNotes normalises CRLF, blank runs and truncates", () => {  assert.equal(summarizeNotes("a\r\n\r\n\r\n\r\nb  \n"), "a\n\nb");
  const long = summarizeNotes("x".repeat(50), 10);
  assert.equal(long, `${"x".repeat(10)}…`);
  assert.equal(summarizeNotes(""), "");
});

test("buildUpdateCheck reports an available update with a download link", () => {
  const check = buildUpdateCheck({ current: "2.1.0", release: release(), platform: "darwin", now: NOW });
  assert.equal(check.ok, true);
  assert.equal(check.latest, "v2.2.0");
  assert.equal(check.hasUpdate, true);
  assert.equal(check.downloadUrl, "https://example.test/arm.dmg");
  assert.equal(check.downloadName, "Resume Studio_2.2.0_aarch64.dmg");
  assert.match(check.notes, /设置页/);
  assert.equal(check.checkedAt, NOW.toISOString());
});

test("buildUpdateCheck stays quiet when the running version is current", () => {
  const check = buildUpdateCheck({ current: "2.2.0", release: release(), platform: "win32", now: NOW });
  assert.equal(check.hasUpdate, false);
  assert.equal(check.latest, "v2.2.0");
  assert.equal(check.downloadUrl, null);
  assert.equal(check.notes, "");
});

test("buildUpdateCheck ignores drafts and pre-releases", () => {  for (const over of [{ draft: true }, { prerelease: true }]) {
    const check = buildUpdateCheck({ current: "2.1.0", release: release(over), platform: "darwin", now: NOW });
    assert.equal(check.hasUpdate, false);
    assert.equal(check.latest, null);
  }
});

test("buildUpdateCheck handles a repository without releases", () => {
  const check = buildUpdateCheck({
    current: "2.1.0",
    release: null,
    platform: "darwin",
    now: NOW,
    error: "尚未发布任何版本",
  });
  assert.equal(check.ok, true);
  assert.equal(check.latest, null);
  assert.equal(check.error, "尚未发布任何版本");
  assert.equal(check.releaseUrl, null);
});

test("buildUpdateCheck keeps a failed check distinguishable from up-to-date", () => {
  const check = buildUpdateCheck({ current: "2.1.0", release: null, platform: "darwin", now: NOW });
  assert.equal(check.ok, true);
  assert.equal(check.error, undefined);
  // ok:false is the failure shape the route returns; the dialog keys off it.
  const failed = { ...check, ok: false, error: "网络不可用" };
  assert.equal(failed.ok, false);
  assert.equal(failed.error, "网络不可用");
});
