#!/usr/bin/env node
// Scaffold a new resume template: two source files + registration, ready to
// preview. The generated code follows docs/template-authoring.md and passes
// tests/template-contract.test.ts out of the box.
//
//   npm run tpl:new blueprint            → 蓝图 (nameZh defaults to the id)
//   npm run tpl:new blueprint "蓝图"      → explicit zh name

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, not URL.pathname: pathname stays percent-encoded and any
// non-ASCII segment in the project path (this one lives in 简历/) breaks fs.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const id = process.argv[2] ?? "";
const nameZh = process.argv[3] ?? id;
if (!/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error(`✗ template id must be kebab-case (got "${id}"), e.g. npm run tpl:new blueprint`);
  process.exit(1);
}
const pascal = id
  .split("-")
  .map((s) => s[0].toUpperCase() + s.slice(1))
  .join("");
const upper = id.replace(/-/g, "_").toUpperCase();
const dir = join(root, "src", "templates", id);

if (existsSync(dir)) {
  console.error(`✗ src/templates/${id}/ already exists`);
  process.exit(1);
}

const pageTsx = `import type { CSSProperties } from "react";
import type { ResumeData } from "../../types";
import { rich } from "../kit";

/**
 * ${nameZh} — describe the layout idea in one line here.
 * Authoring guide: docs/template-authoring.md
 */
export function ${pascal}Page({ data }: { data: ResumeData }) {
  return (
    <div className="tpl-page t-${id}" style={{ "--blue": data.theme.accent } as CSSProperties}>
      <div className="tpl-flow">
        <header className="${id.slice(0, 3)}-top" data-panel="identity">
          <h1>{data.header.nameZh}</h1>
          <p>
            {data.header.titleZh} · {data.header.titleEn}
          </p>
        </header>

        <section className="${id.slice(0, 3)}-band" data-panel="profile">
          <h2>{data.profile.kicker}</h2>
          <p>{rich(data.profile.text)}</p>
        </section>

        <section className="${id.slice(0, 3)}-band" data-panel="experience">
          <h2>{data.experience.title}</h2>
          {data.experience.jobs.map((job, i) => (
            <article key={i}>
              <h3>
                {job.roleZh} · {job.company}
              </h3>
              <span>{job.date}</span>
              <ul>
                {job.bullets.map((b, j) => (
                  <li key={j}>{rich(b)}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="${id.slice(0, 3)}-band" data-panel="projects">
          <h2>{data.projects.title}</h2>
          {data.projects.items.map((p, i) => (
            <article key={i}>
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
            </article>
          ))}
        </section>

        <div className="${id.slice(0, 3)}-pair">
          <section data-panel="stack">
            <h2>{data.stack.kicker}</h2>
            {data.stack.groups.map((g, i) => (
              <p key={i}>
                <b>{g.k}</b> {g.v}
              </p>
            ))}
          </section>

          <section data-panel="education">
            <h2>{data.education.kicker}</h2>
            <p>
              {data.education.school} · {data.education.degree}
            </p>
          </section>
        </div>

        <footer className="${id.slice(0, 3)}-foot" data-panel="footer">
          <span>{data.footer.copyright}</span>
          {data.flags.showFlow ? (
            <p data-panel="flow">
              {data.flow.label}：{data.flow.steps.join(" → ")}
            </p>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
`;

const stylesTs = `/* ------------------------------------------------------------------
   ${nameZh} — scoped CSS. Every selector lives under .t-${id};
   the accent (--blue) comes from the document theme, not this file.
   Conventions: docs/template-authoring.md
------------------------------------------------------------------- */
export const ${upper}_CSS = String.raw\`
.t-${id}{
  --${id.slice(0, 3)}-ink:#111111;
  --${id.slice(0, 3)}-muted:#61615a;
  position:relative;
  box-sizing:border-box; /* PAGE_CSS scopes box-sizing to descendants only — the root needs its own */
  padding:14mm 14mm;
  background:#fff;
  color:var(--${id.slice(0, 3)}-ink);
  font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  font-size:9pt;
  line-height:1.5;
  overflow:hidden;
  overflow-wrap:break-word;
  -webkit-font-smoothing:antialiased;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.t-${id} *{box-sizing:border-box;margin:0;padding:0}

.t-${id} .${id.slice(0, 3)}-top{border-bottom:2px solid var(--blue);padding-bottom:4mm}
.t-${id} h1{font-size:22pt;letter-spacing:.04em}
.t-${id} .${id.slice(0, 3)}-top p{color:var(--${id.slice(0, 3)}-muted);margin-top:1.6mm}

.t-${id} .${id.slice(0, 3)}-band{padding-top:4mm}
.t-${id} .${id.slice(0, 3)}-pair{display:grid;grid-template-columns:1fr 1fr;column-gap:7mm;padding-top:4mm}
.t-${id} h2{font-size:8.5pt;letter-spacing:.18em;text-transform:uppercase;color:var(--blue)}
.t-${id} .${id.slice(0, 3)}-band > p{margin-top:2mm}
.t-${id} article{margin-top:2.6mm}
.t-${id} h3{font-size:11pt}
.t-${id} article > span{font-family:"SF Mono",Menlo,monospace;font-size:8pt;color:var(--${id.slice(0, 3)}-muted)}
.t-${id} ul{margin-top:1.6mm;padding-left:4mm}

.t-${id} .${id.slice(0, 3)}-foot{margin-top:auto;border-top:1px solid var(--${id.slice(0, 3)}-muted);padding-top:3mm;font-size:8pt;color:var(--${id.slice(0, 3)}-muted)}
\`;
`;

const REGISTRY_IMPORT_MARKER = "// npm run tpl:new inserts imports for new templates above this line — do not remove";
const REGISTRY_ENTRY_MARKER = "  /* npm run tpl:new inserts new registrations above this line — do not remove */";

// Validate every marker before touching anything: a failed patch halfway
// through must not leave a half-registered template behind. Also refuse a
// re-scaffold of a live id — registrations accumulate above the markers.
const registryText = readFileSync(join(root, "src/templates/registry.tsx"), "utf8");
for (const marker of [REGISTRY_IMPORT_MARKER, REGISTRY_ENTRY_MARKER]) {
  if (!registryText.includes(marker)) {
    console.error(`✗ marker missing in src/templates/registry.tsx — re-add the "npm run tpl:new" marker line first`);
    process.exit(1);
  }
}
if (registryText.includes(`id: "${id}"`) || registryText.includes(`${pascal}Page`)) {
  console.error(`✗ template "${id}" is already registered in registry.tsx — remove that entry first`);
  process.exit(1);
}

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, `${pascal}Page.tsx`), pageTsx);
writeFileSync(join(dir, "styles.ts"), stylesTs);

function patch(file, marker, insertion) {
  const path = join(root, file);
  const text = readFileSync(path, "utf8");
  if (!text.includes(marker)) {
    console.error(`✗ marker missing in ${file} — register ${id} by hand (see docs/template-authoring.md)`);
    process.exitCode = 1;
    return;
  }
  writeFileSync(path, text.replace(marker, `${insertion}\n${marker}`));
}

patch(
  "src/templates/registry.tsx",
  REGISTRY_IMPORT_MARKER,
  `import { ${pascal}Page } from "./${id}/${pascal}Page";
import { ${upper}_CSS } from "./${id}/styles";`,
);
patch(
  "src/templates/registry.tsx",
  REGISTRY_ENTRY_MARKER,
  `  defineTemplate({
    id: "${id}",
    nameZh: "${nameZh}",
    description: "${nameZh}（脚手架起步模板，改成一句话版面描述）。",
    pages: 1,
    accent: "#2F52E0",
    tags: ["单页", "起步"],
    css: ${upper}_CSS,
    render: (data) => <${pascal}Page data={data} />,
  }),`,
);

console.log(`✓ ${nameZh} scaffolded:
  src/templates/${id}/${pascal}Page.tsx
  src/templates/${id}/styles.ts
  registered in src/templates/registry.tsx (catalog metadata is derived)

next:
  npm run preview:tpl -- ${id}     # real-size A4 render + overflow check
  npm run check && npm test        # contract test validates the conventions
`);
