/**
 * Pure update-check logic: version parsing/comparison, release asset picking and
 * note summarising. No IO here — `app/api/update/route.ts` does the fetching and
 * `tests/update.test.ts` covers every branch.
 */

export type UpdateAsset = { name: string; url: string; size?: number };

export type ReleaseInfo = {
  tag: string;
  name?: string;
  url?: string;
  notes?: string;
  publishedAt?: string;
  prerelease?: boolean;
  draft?: boolean;
  assets?: UpdateAsset[];
};

export type UpdateCheck = {
  /** false = the check itself failed (network / API); true = it completed. */
  ok: boolean;
  current: string;
  /** null when the repository has no release yet. */
  latest: string | null;
  hasUpdate: boolean;
  releaseUrl: string | null;
  downloadUrl: string | null;
  downloadName: string | null;
  notes: string;
  publishedAt: string | null;
  checkedAt: string;
  /** Why the check failed, or a hint when it succeeded with nothing to offer. */
  error?: string;
};

/**
 * Parse `v2.1.0`, `2.1`, `2.1.0-beta.1` into numeric segments.
 * The pre-release suffix is ignored: `2.1.0-beta.1` and `2.1.0` compare equal.
 * Returns null for anything without a leading numeric core.
 */
export function parseVersion(raw: string): number[] | null {
  if (typeof raw !== "string") return null;
  const match = /^[vV]?(\d+(?:\.\d+)*)/.exec(raw.trim());
  if (!match) return null;
  return match[1].split(".").map((part) => Number(part));
}

/** -1 | 0 | 1. Missing segments count as 0; two unparsable versions compare equal. */
export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return 0;
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    if (l !== r) return l > r ? 1 : -1;
  }
  return 0;
}

export function isNewer(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) > 0;
}

/**
 * Pick the installer for a platform. GitHub release assets carry no platform
 * metadata, so this is name matching against what CI uploads:
 * `Resume Studio_2.1.0_aarch64.dmg`, `Resume Studio.app.zip`,
 * `Resume Studio_2.1.0_x64-setup.exe`.
 *
 * Unknown platforms get `null` on purpose: the only installers we ship are
 * macOS and Windows, so handing a Linux host the Windows `.exe` would be worse
 * than sending it to the release page (the dialog falls back to `releaseUrl`).
 */
export function pickAsset(assets: UpdateAsset[], platform: string): UpdateAsset | null {
  if (!Array.isArray(assets) || assets.length === 0) return null;
  const named = (asset: UpdateAsset) => asset.name.toLowerCase();

  if (platform === "darwin") {
    const dmg = assets.filter((a) => named(a).endsWith(".dmg"));
    const arm = dmg.find((a) => /aarch64|arm64/.test(named(a)));
    return arm ?? dmg[0] ?? assets.find((a) => named(a).endsWith(".zip")) ?? null;
  }

  if (platform === "win32") {
    const exe = assets.filter((a) => named(a).endsWith(".exe"));
    return exe.find((a) => named(a).includes("setup")) ?? exe[0] ?? null;
  }

  return null;
}

/** Trim, collapse blank lines and truncate release notes for the dialog. */
export function summarizeNotes(notes: string, maxChars = 600): string {
  if (typeof notes !== "string") return "";
  const clean = notes
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars).trimEnd()}…`;
}

/**
 * Fold a release payload into the shape the settings dialog renders.
 * Drafts and pre-releases never trigger an update.
 */
export function buildUpdateCheck(input: {
  current: string;
  release: ReleaseInfo | null;
  platform: string;
  now?: Date;
  error?: string;
}): UpdateCheck {
  const { current, release, platform, error } = input;
  const checkedAt = (input.now ?? new Date()).toISOString();

  if (!release || release.draft || release.prerelease) {
    return {
      ok: true,
      current,
      latest: null,
      hasUpdate: false,
      releaseUrl: release?.url ?? null,
      downloadUrl: null,
      downloadName: null,
      notes: "",
      publishedAt: null,
      checkedAt,
      ...(error ? { error } : {}),
    };
  }

  const latest = release.tag;
  const hasUpdate = isNewer(latest, current);
  const asset = hasUpdate ? pickAsset(release.assets ?? [], platform) : null;

  return {
    ok: true,
    current,
    latest,
    hasUpdate,
    releaseUrl: release.url ?? null,
    // downloadUrl is the installer asset only; the dialog falls back to
    // releaseUrl when a release ships no assets.
    downloadUrl: asset?.url ?? null,
    downloadName: asset?.name ?? null,
    notes: hasUpdate ? summarizeNotes(release.notes ?? "") : "",
    publishedAt: release.publishedAt ?? null,
    checkedAt,
    ...(error ? { error } : {}),
  };
}
