/**
 * Template A4 preview harness.
 *
 *   npx tsx --tsconfig tsconfig.test.json scripts/template-preview.tsx moonlight
 *   npx tsx --tsconfig tsconfig.test.json scripts/template-preview.tsx --all
 *
 * Renders a registered template at true A4 (210×297mm ≈ 794×1123px @96dpi)
 * with `defaultResume`, writes the HTML, screenshots it with headless Edge and
 * reports the same overflow numbers the editor's usePageOverflow hook uses.
 *
 * Output: /tmp/tpl-preview/<id>.html + <id>.png
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { Fragment, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultResume } from "../src/data/defaultResume";
import { PAGE_CSS } from "../src/styles/pages";
import { templates } from "../src/templates/registry";

const EDGE =
  process.env.EDGE_BIN ?? "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
const OUT_DIR = "/tmp/tpl-preview";

const SHELL_CSS = String.raw`
html,body{margin:0;padding:0;background:#dedfd9}
body{display:flex;justify-content:center;align-items:flex-start;padding:12px 0}
.tpl-export{display:block}
.tpl-page{box-shadow:0 1px 0 rgba(0,0,0,.14),0 18px 50px rgba(0,0,0,.24)}
`;

const MEASURE_JS = String.raw`
window.addEventListener('load', function () {
  var flow = document.querySelector('.tpl-flow');
  var page = document.querySelector('.tpl-page');
  var parts = [];
  if (page) {
    parts.push('page=' + page.offsetWidth + 'x' + page.offsetHeight);
    parts.push('pageOverflow=' + Math.max(0, page.scrollHeight - page.clientHeight) + 'px');
  }
  if (flow) {
    parts.push('flow=' + flow.scrollHeight + '/' + flow.clientHeight);
    parts.push('flowOverflow=' + Math.max(0, flow.scrollHeight - flow.clientHeight) + 'px');
  }
  var overflow = 0;
  if (flow) overflow += Math.max(0, flow.scrollHeight - flow.clientHeight);
  if (page) overflow += Math.max(0, page.scrollHeight - page.clientHeight);
  parts.push('FITS=' + (overflow === 0 ? 'yes' : 'no'));
  document.title = parts.join(' | ');
});
`;

function buildHtml(id: string, css: string, markup: string): string {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>preview</title>
<style>${PAGE_CSS}\n${SHELL_CSS}\n${css}</style>
</head><body><div class="tpl-export">${markup}</div>
<script>${MEASURE_JS}</script>
</body></html>`;
}

function preview(id: string) {
  const tpl = templates.find((t) => t.id === id);
  if (!tpl) {
    console.error(`✗ unknown template "${id}". registered: ${templates.map((t) => t.id).join(", ")}`);
    process.exit(1);
  }

  // Mimic "just switched to this template": the editor applies the template's
  // catalog accent to docs that still carry another template's colour. Without
  // this the preview would render in whatever accent defaultResume happens to
  // have (industrial cobalt) instead of the template's own Kiwi green.
  const data = {
    ...defaultResume,
    templateId: id,
    theme: { accent: tpl.accent ?? defaultResume.theme.accent },
  };

  // NOTE: no JSX in this file — scripts/ is outside tsconfig.test.json's include,
  // so tsx would fall back to the classic runtime. createElement keeps it safe.
  const markup = renderToStaticMarkup(createElement(Fragment, null, tpl.render(data, 0)));
  const htmlPath = `${OUT_DIR}/${id}.html`;
  const pngPath = `${OUT_DIR}/${id}.png`;
  writeFileSync(htmlPath, buildHtml(id, tpl.css, markup));

  execFileSync(
    EDGE,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      "--window-size=800,1200",
      "--virtual-time-budget=2500",
      `--screenshot=${pngPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: "ignore" },
  );

  const dom = execFileSync(
    EDGE,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--allow-file-access-from-files",
      "--window-size=800,1200",
      "--virtual-time-budget=2500",
      "--dump-dom",
      `file://${htmlPath}`,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const title = /<title>([^<]*)<\/title>/.exec(dom)?.[1] ?? "(no measurement)";
  const fits = title.includes("FITS=yes");

  console.log(`${fits ? "✓" : "✗"} ${id.padEnd(18)} ${title}`);
  console.log(`   html ${htmlPath}`);
  console.log(`   png  ${pngPath}`);
  return fits;
}

const arg = process.argv[2];
mkdirSync(OUT_DIR, { recursive: true });

if (!arg || arg === "--help") {
  console.log("usage: template-preview.tsx <template-id|--all>");
  process.exit(1);
}

const ids = arg === "--all" ? templates.map((t) => t.id) : [arg];
const results = ids.map((id) => {
  try {
    return preview(id);
  } catch (err) {
    console.error(`✗ ${id} failed:`, err instanceof Error ? err.message : err);
    return false;
  }
});
process.exit(results.every(Boolean) ? 0 : 1);
