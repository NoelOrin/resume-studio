import { APP_REPO, APP_VERSION, LATEST_RELEASE_API } from "@/src/lib/version";
import {
  buildUpdateCheck,
  type ReleaseInfo,
  type UpdateAsset,
  type UpdateCheck,
} from "@/src/lib/update";

export const dynamic = "force-dynamic";

/** GitHub REST endpoint template when `RESUME_UPDATE_REPO` overrides the repo. */
const GITHUB_REPOS_API = "https://api.github.com/repos";

/** GitHub is rate limited to 60 anonymous requests/hour, so cache completed checks. */
const DEFAULT_CACHE_MS = 10 * 60 * 1000;

/** Never let a slow GitHub response hang the settings dialog. */
const REQUEST_TIMEOUT_MS = 8000;

const PLATFORMS = ["darwin", "win32", "linux"] as const;

/**
 * Module-level cache, keyed by `endpoint|platform`. Only **successful** checks are
 * cached: a failure must stay retryable, otherwise the dialog's 「重试」 button would
 * replay a stale error for the whole TTL.
 */
const cache = new Map<string, { at: number; body: UpdateCheck }>();

function envValue(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** `owner/repo` or null when unset / malformed. */
function normalizeRepo(value: string | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/^\/+|\/+$/g, "");
  return /^[\w.-]+\/[\w.-]+$/.test(cleaned) ? cleaned : null;
}

/**
 * `RESUME_UPDATE_ENDPOINT` wins outright; otherwise `RESUME_UPDATE_REPO` rebuilds the
 * GitHub URL, and with neither set we fall back to the frozen `LATEST_RELEASE_API`.
 */
function resolveEndpoint(): string {
  const explicit = envValue("RESUME_UPDATE_ENDPOINT");
  if (explicit) return explicit;
  const repo = normalizeRepo(envValue("RESUME_UPDATE_REPO"));
  return repo ? `${GITHUB_REPOS_API}/${repo}/releases/latest` : LATEST_RELEASE_API;
}

function cacheTtlMs(): number {
  const raw = envValue("RESUME_UPDATE_CACHE_MS");
  if (raw === undefined) return DEFAULT_CACHE_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_CACHE_MS;
}

function resolvePlatform(request: Request): string {
  let requested: string | null = null;
  try {
    requested = new URL(request.url).searchParams.get("platform");
  } catch {
    requested = null;
  }
  const normalized = requested?.trim().toLowerCase();
  if (normalized && (PLATFORMS as readonly string[]).includes(normalized)) return normalized;
  // Desktop shell / web app without a hint: report for the host we run on.
  return process.platform;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function toAssets(value: unknown): UpdateAsset[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const assets: UpdateAsset[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const asset = item as Record<string, unknown>;
    const name = text(asset.name);
    const url = text(asset.browser_download_url);
    if (!name || !url) continue;
    const size = asset.size;
    assets.push(typeof size === "number" && Number.isFinite(size) ? { name, url, size } : { name, url });
  }
  return assets;
}

/** GitHub `releases/latest` payload → the frozen `ReleaseInfo` contract. */
function toReleaseInfo(payload: unknown): ReleaseInfo | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Record<string, unknown>;
  const tag = text(raw.tag_name);
  if (!tag) return null;
  return {
    tag,
    name: text(raw.name),
    url: text(raw.html_url),
    notes: text(raw.body),
    publishedAt: text(raw.published_at),
    prerelease: typeof raw.prerelease === "boolean" ? raw.prerelease : undefined,
    draft: typeof raw.draft === "boolean" ? raw.draft : undefined,
    assets: toAssets(raw.assets),
  };
}

/** A check that could not complete: `ok:false` + a readable Chinese reason. */
function failedCheck(current: string, platform: string, error: string): UpdateCheck {
  return { ...buildUpdateCheck({ current, release: null, platform }), ok: false, error };
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return `检查更新超时（${REQUEST_TIMEOUT_MS / 1000} 秒），请稍后再试`;
    }
    return `网络请求失败：${error.message}`;
  }
  return "网络请求失败";
}

async function checkOnce(endpoint: string, platform: string): Promise<UpdateCheck> {
  const current = APP_VERSION;
  try {
    const response = await fetch(endpoint, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "resume-studio-update-check",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    // GitHub answers 404 while the repository has no published release at all.
    if (response.status === 404) {
      return { ...buildUpdateCheck({ current, release: null, platform }), error: "尚未发布任何版本" };
    }

    if (!response.ok) {
      const hint = response.status === 403 ? "（可能是 GitHub 限流，请稍后再试）" : "";
      return failedCheck(current, platform, `GitHub 返回 HTTP ${response.status}${hint}`);
    }

    const release = toReleaseInfo((await response.json()) as unknown);
    if (!release) return failedCheck(current, platform, "GitHub 返回的版本数据无法解析");
    return buildUpdateCheck({ current, release, platform });
  } catch (error) {
    return failedCheck(current, platform, describeError(error));
  }
}

async function checkWithCache(endpoint: string, platform: string): Promise<UpdateCheck> {
  const key = `${endpoint}|${platform}`;
  const ttl = cacheTtlMs();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.body;

  const body = await checkOnce(endpoint, platform);
  if (body.ok) {
    cache.set(key, { at: Date.now(), body });
  } else {
    cache.delete(key);
  }
  return body;
}

/**
 * `GET /api/update?platform=darwin|win32|linux` → always `200` with an `UpdateCheck`
 * body (failures included), so the client only ever parses one shape.
 */
export async function GET(request: Request) {
  const platform = resolvePlatform(request);
  const body = await checkWithCache(resolveEndpoint(), platform);
  return Response.json(body, { headers: { "cache-control": "no-store" } });
}
