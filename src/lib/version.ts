import pkg from "../../package.json";

/**
 * Single source of truth for the running version.
 *
 * `package.json` is also the manifest copied into the desktop runtime
 * (`scripts/prepare-desktop-runtime.mjs`), so the web app and the packaged app
 * always report the same number.
 */
export const APP_VERSION: string = pkg.version;

export const APP_REPO = "NoelOrin/resume-studio";

export const RELEASES_PAGE = `https://github.com/${APP_REPO}/releases`;

export const LATEST_RELEASE_API = `https://api.github.com/repos/${APP_REPO}/releases/latest`;
