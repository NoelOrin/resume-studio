import type { CSSProperties } from "react";
import type { ResumeData } from "../../types";
import { rich } from "../kit";

/* ---------------------------------------------------------------------------
   helpers
   ------------------------------------------------------------------------- */

/** nameEn 按空格拆成两行（多于两词时前后对半分）。 */
function splitLine(nameEn: string): [string, string] {
  const words = nameEn.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["", ""];
  if (words.length === 1) return [words[0], ""];
  const cut = Math.ceil(words.length / 2);
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

/** "STACK / 技术栈" → ["STACK", "技术栈"]。 */
function kickerParts(kicker: string): [string, string] {
  const at = kicker.indexOf("/");
  if (at < 0) return [kicker.trim(), ""];
  return [kicker.slice(0, at).trim(), kicker.slice(at + 1).trim()];
}

/** stack group 的 v 按 `/` 拆成胶囊贴纸。 */
function tagsOf(value: string): string[] {
  return value
    .split("/")
    .map((t) => t.trim())
    .filter(Boolean);
}

function isCurrent(date: string): boolean {
  return /now|至今|present|current/i.test(date);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function PanelHead({ no, en, zh, meta }: { no: string; en: string; zh?: string; meta?: string }) {
  return (
    <div className="ml-ph">
      <span className="ml-no">{no}.</span>
      <h2 className="ml-en">{en}</h2>
      {zh ? <span className="ml-zh">{zh}</span> : null}
      <span className="ml-rule" />
      <span className="ml-dot" aria-hidden="true" />
      {meta ? <span className="ml-meta">{meta}</span> : null}
    </div>
  );
}

function SectionHead({ no, en, zh, meta }: { no: string; en: string; zh?: string; meta?: string }) {
  return (
    <div className="ml-shead">
      <span className="ml-sno">{no}.</span>
      <h2 className="ml-sen">{en}</h2>
      {zh ? <span className="ml-szh">{zh}</span> : null}
      <span className="ml-srule" />
      {meta ? <span className="ml-smeta">{meta}</span> : null}
    </div>
  );
}

/* 静态彩纸碎屑：位置 / 尺寸 / 旋转 / 形状 / 四色（无动画，编辑器里不会重绘） */
type ConfettiPiece = {
  x: number;
  y: number;
  s: number;
  r: number;
  k: "sq" | "dia" | "tri" | "strip";
  c: "blue" | "paper" | "grey" | "dark";
};

const CONFETTI: ConfettiPiece[] = [
  { x: 46.1, y: 12.5, s: 6, r: 24, k: "tri", c: "blue" },
  { x: 14.0, y: 78.9, s: 3, r: 120, k: "sq", c: "grey" },
  { x: 63.0, y: 44.6, s: 6, r: -30, k: "dia", c: "paper" },
  { x: 11.2, y: 18.5, s: 5, r: 40, k: "tri", c: "paper" },
  { x: 81.7, y: 64.2, s: 6, r: 15, k: "sq", c: "paper" },
  { x: 89.2, y: 34.9, s: 3, r: -40, k: "tri", c: "blue" },
  { x: 97.9, y: 58.6, s: 7, r: 60, k: "dia", c: "paper" },
  { x: 9.2, y: 86.2, s: 7, r: -50, k: "dia", c: "dark" },
  { x: 36.6, y: 16.2, s: 4, r: 90, k: "strip", c: "blue" },
  { x: 3.0, y: 71.6, s: 4, r: 30, k: "strip", c: "blue" },
  { x: 85.5, y: 9.2, s: 5, r: -20, k: "dia", c: "dark" },
  { x: 4.7, y: 25.4, s: 7, r: 35, k: "tri", c: "blue" },
  { x: 24.5, y: 14.6, s: 5, r: -60, k: "tri", c: "dark" },
  { x: 73.5, y: 66.5, s: 3, r: 25, k: "dia", c: "paper" },
  { x: 9.0, y: 13.3, s: 5, r: 80, k: "dia", c: "dark" },
  { x: 90.9, y: 36.5, s: 5, r: -80, k: "dia", c: "paper" },
  { x: 1.9, y: 77.1, s: 3, r: 45, k: "strip", c: "blue" },
  { x: 96.8, y: 19.3, s: 4, r: 55, k: "dia", c: "paper" },
  { x: 50.8, y: 68.7, s: 4, r: -35, k: "tri", c: "blue" },
  { x: 79.3, y: 24.8, s: 6, r: 20, k: "dia", c: "dark" },
  { x: 2.8, y: 70.3, s: 3, r: 70, k: "sq", c: "paper" },
  { x: 88.2, y: 61.0, s: 7, r: -15, k: "tri", c: "dark" },
  { x: 84.5, y: 12.7, s: 3, r: 45, k: "sq", c: "grey" },
  { x: 96.9, y: 48.2, s: 7, r: 25, k: "tri", c: "blue" },
  { x: 10.1, y: 64.1, s: 4, r: 65, k: "tri", c: "dark" },
  { x: 87.7, y: 43.2, s: 6, r: -15, k: "sq", c: "dark" },
  { x: 65.7, y: 75.3, s: 8, r: -55, k: "sq", c: "dark" },
  { x: 88.0, y: 84.0, s: 4, r: -65, k: "dia", c: "paper" },
  { x: 85.8, y: 29.2, s: 3, r: 50, k: "strip", c: "blue" },
  { x: 25.8, y: 53.4, s: 3, r: -25, k: "dia", c: "dark" },
  { x: 35.9, y: 46.6, s: 3, r: 40, k: "dia", c: "blue" },
  { x: 6.2, y: 59.3, s: 6, r: 25, k: "dia", c: "blue" },
  { x: 3.2, y: 81.1, s: 8, r: -35, k: "tri", c: "paper" },
  { x: 8.9, y: 85.2, s: 3, r: 20, k: "sq", c: "paper" },
  { x: 5.9, y: 49.6, s: 4, r: 60, k: "strip", c: "grey" },
  { x: 95.7, y: 80.3, s: 4, r: 30, k: "dia", c: "blue" },
  { x: 6.8, y: 16.7, s: 8, r: 15, k: "dia", c: "blue" },
  { x: 58.9, y: 56.6, s: 7, r: 40, k: "dia", c: "dark" },
  { x: 1.9, y: 17.6, s: 3, r: -15, k: "tri", c: "blue" },
  { x: 57.5, y: 25.5, s: 5, r: 30, k: "dia", c: "grey" },
  { x: 84.5, y: 54.6, s: 7, r: -25, k: "sq", c: "blue" },
  { x: 81.2, y: 8.0, s: 4, r: 120, k: "strip", c: "paper" },
  { x: 96.8, y: 18.6, s: 5, r: 25, k: "tri", c: "paper" },
  { x: 25.5, y: 21.6, s: 6, r: 30, k: "dia", c: "paper" },
  { x: 72.4, y: 19.0, s: 7, r: 60, k: "dia", c: "grey" },
  { x: 0.9, y: 65.6, s: 8, r: -55, k: "sq", c: "grey" },
  { x: 49.0, y: 24.6, s: 4, r: -30, k: "tri", c: "paper" },
  { x: 57.3, y: 45.1, s: 7, r: 25, k: "dia", c: "dark" },
  { x: 28.4, y: 64.3, s: 6, r: 30, k: "dia", c: "paper" },
  { x: 85.9, y: 52.9, s: 3, r: 15, k: "sq", c: "paper" },
  { x: 11.1, y: 33.3, s: 6, r: 45, k: "sq", c: "dark" },
  { x: 85.8, y: 77.9, s: 4, r: 50, k: "strip", c: "blue" },
  { x: 62.7, y: 76.3, s: 5, r: -25, k: "tri", c: "blue" },
  { x: 2.4, y: 56.5, s: 5, r: -40, k: "tri", c: "blue" },
  { x: 7.7, y: 80.9, s: 6, r: 30, k: "sq", c: "paper" },
  { x: 2.5, y: 14.1, s: 3, r: 45, k: "sq", c: "grey" },
  { x: 86.9, y: 57.3, s: 4, r: 45, k: "dia", c: "grey" },
  { x: 93.1, y: 22.1, s: 3, r: 60, k: "sq", c: "paper" },
];

/* 城市剪影：1200×300 viewBox，右侧高层切进月盘下缘 */
const SKYLINE_LOW: number[][] = [
  [0, 176, 96, 124],
  [96, 150, 64, 150],
  [160, 186, 88, 114],
  [248, 138, 54, 162],
  [302, 168, 110, 132],
  [412, 146, 72, 154],
  [484, 182, 96, 118],
  [580, 158, 64, 142],
  [644, 190, 104, 110],
];

const SKYLINE_HIGH: number[][] = [
  [748, 118, 52, 182],
  [800, 62, 58, 238],
  [858, 148, 64, 152],
  [922, 92, 78, 208],
  [1000, 156, 62, 144],
  [1062, 78, 72, 222],
  [1134, 132, 46, 168],
  [1180, 168, 20, 132],
];

const ANTENNAS: number[][] = [
  [826, 38, 3, 24],
  [958, 68, 3, 24],
  [1096, 54, 3, 24],
  [476, 112, 3, 34],
  [270, 112, 3, 26],
];

const WINDOWS: number[][] = [
  [816, 84, 5, 7],
  [816, 104, 5, 7],
  [834, 120, 5, 7],
  [946, 116, 5, 7],
  [946, 138, 5, 7],
  [964, 162, 5, 7],
  [1090, 102, 5, 7],
  [1090, 124, 5, 7],
  [1108, 146, 5, 7],
  [872, 180, 5, 7],
  [1012, 184, 5, 7],
  [6, 212, 5, 7],
];

const DIM_WINDOWS: number[][] = [
  [40, 196, 4, 5],
  [56, 212, 4, 5],
  [180, 204, 4, 5],
  [264, 162, 4, 5],
  [340, 188, 4, 5],
  [356, 206, 4, 5],
  [512, 202, 4, 5],
  [604, 178, 4, 5],
  [668, 210, 4, 5],
  [766, 140, 4, 5],
  [880, 170, 4, 5],
  [1146, 152, 4, 5],
];

function CitySvg() {
  return (
    <svg className="ml-city" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g className="ml-bldg-a">
        {SKYLINE_LOW.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g className="ml-bldg-b">
        {SKYLINE_HIGH.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
        {ANTENNAS.map(([x, y, w, h], i) => (
          <rect key={`a${i}`} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g className="ml-win">
        {WINDOWS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g className="ml-windim">
        {DIM_WINDOWS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <rect className="ml-bldg-a" x="0" y="288" width="1200" height="12" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   page
   ------------------------------------------------------------------------- */

export function MoonlightPage({ data }: { data: ResumeData }) {
  const { header, profile, stack, education, experience, projects, flow, footer, strip, flags } = data;

  const [nameLine1, nameLine2] = splitLine(header.nameEn);
  /* 巨字按最长的行收一点字号，长名字不会顶出纸面（默认数据下等于 17mm / 11.4mm） */
  const latinMm = Math.min(17, 176 / Math.max(1, Math.max(nameLine1.length, nameLine2.length) * 0.64));
  const cnMm = Math.min(11.4, 176 / Math.max(1, header.titleZh.length * 1.04));
  const [profileEn, profileZh] = kickerParts(profile.kicker);
  const [stackEn, stackZh] = kickerParts(stack.kicker);
  const [credEn, credZh] = kickerParts(education.kicker);

  const statusMain = header.status[1] ?? "";
  const statusMode = header.status[2] ?? "";
  const statusNote = header.status[0] ?? "";
  const statusLine = header.status.join(" · ");

  const kickerItems = [header.tag, header.brand, header.brandSub, strip.a, strip.date].filter(Boolean);

  const pills: { text: string; tone: string }[] = [];
  header.contacts.forEach((c, i) => {
    pills.push({ text: c.value, tone: i % 2 === 0 ? "solid" : "ghost" });
  });
  if (statusMain) pills.push({ text: statusMain, tone: "ghost" });
  if (statusMode) pills.push({ text: statusMode, tone: "smoke" });

  const specRows = [
    { k: "BASE", v: statusMain },
    { k: "MODE", v: statusMode },
    { k: "SPAN", v: strip.date },
    { k: "LEVEL", v: header.titleEn },
    { k: "SHEET", v: strip.sheet },
  ].filter((r) => Boolean(r.v));

  /* Contacts 0–2 live in the footer contact card; the last one stays as a text line. */
  const footLine2 = [header.contacts[3]?.value, header.contacts[4]?.value].filter(Boolean).join(" / ");

  return (
    <div className="tpl-page t-moonlight" style={{ "--blue": data.theme.accent } as CSSProperties}>
      <div className="tpl-flow">
        <header className="ml-hero" data-panel="identity">
          {/* ---- 夜空装饰：巨月 / 城市剪影 / 光带 / 星点 ---- */}
          <div className="ml-sky" aria-hidden="true">
            <div className="ml-moon">
              <span className="ml-crater c1" />
              <span className="ml-crater c2" />
              <span className="ml-crater c3" />
              <span className="ml-crater c4" />
              <span className="ml-hz a" />
              <span className="ml-hz b" />
              <span className="ml-arc" />
              <span className="ml-arc2" />
            </div>
            <span className="ml-moon-ring" />
            <CitySvg />
            <span className="ml-lightband" />
            <span className="ml-speedline a" />
            <span className="ml-speedline b" />
            <span className="ml-spark s1" />
            <span className="ml-spark s2" />
            <span className="ml-spark s3" />
            <span className="ml-spark s4" />
            <span className="ml-spark s5" />
          </div>

          {/* ---- 彩纸碎屑 ---- */}
          <div className="ml-confetti" aria-hidden="true">
            {CONFETTI.map((p, i) => (
              <span
                key={i}
                className={`ml-cf ${p.k} ${p.c}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, "--s": `${p.s}px`, "--r": `${p.r}deg` } as CSSProperties}
              />
            ))}
          </div>

          {flags.showYears && (
            <div className="ml-years">
              <b>{header.years.value}</b>
              <span>{header.years.label}</span>
            </div>
          )}

          {/* ---- 标题区 ---- */}
          <div className="ml-copy">
            <p className="ml-kicker">
              <i aria-hidden="true" />
              {kickerItems.map((item, i) => (
                <span key={i}>
                  {i > 0 ? <span className="sep">/</span> : null}
                  {item}
                </span>
              ))}
              <span className="sep">/</span>
              <b className="ml-name-cn">{header.nameZh}</b>
            </p>

            <h1 className="ml-mega" aria-label={`${header.nameEn} · ${header.titleZh}`}>
              {nameLine1 ? (
                <span className="ml-ln" style={{ fontSize: `${latinMm}mm` }}>
                  {nameLine1}
                </span>
              ) : null}
              {nameLine2 ? (
                <span className="ml-ln" style={{ fontSize: `${latinMm}mm` }}>
                  {nameLine2}
                </span>
              ) : null}
              <span className="ml-ln ml-ln-cn" style={{ fontSize: `${cnMm}mm` }}>
                {header.titleZh}
              </span>
            </h1>

            <div className="ml-role">
              <span className="ml-role-cn">{header.titleZh}</span>
              <span className="ml-role-en">{header.titleEn}</span>
              {statusNote ? <span className="ml-role-note">{statusNote}</span> : null}
            </div>

            <ul className="ml-pills">
              {pills.map((p, i) => (
                <li key={i}>
                  <span className={`ml-pill ${p.tone}`}>{p.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </header>

        {/* ---- 数据条 ---- */}
        {flags.showStats && (
          <div className="ml-strip" data-panel="profile">
            {profile.stats.map((s, i) => (
              <div className="ml-stat" key={i}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
            <div className="ml-statnote">{[statusLine, strip.rev].filter(Boolean).join(" · ")}</div>
          </div>
        )}

        {/* ---- 正文 ---- */}
        <div className="ml-body">
          <section className="ml-panel ml-profile" data-panel="profile">
            <PanelHead no={profile.no} en={profileEn} zh={profileZh} meta={statusNote} />
            <div className="ml-profile-grid">
              <p className="ml-quote">{rich(profile.text)}</p>
              <div className="ml-pmeta-wrap">
                <div className="ml-pmeta">
                  {[statusMain, statusMode, header.years.value && `${header.years.value} ${header.years.label}`, strip.date]
                    .filter(Boolean)
                    .map((m, i) => (
                      <span className={`ml-mini${i === 0 ? " on" : ""}`} key={i}>
                        {m}
                      </span>
                    ))}
                </div>
                <p className="ml-pnote">
                  {strip.a}
                  {strip.a && strip.b ? <br /> : null}
                  {strip.b}
                </p>
              </div>
            </div>
          </section>

          <div className="ml-main">
            <section className="ml-sec" data-panel="experience">
              <SectionHead no={experience.no} en={experience.title} zh={experience.zh} meta={experience.meta} />
              {experience.jobs.map((job, i) => {
                const cur = isCurrent(job.date);
                return (
                  <article className={`ml-job${cur ? " cur" : ""}`} key={i}>
                    <div className="ml-jband">
                      <span className="ml-jidx">{pad2(i + 1)}</span>
                      <div className="ml-jrole">
                        <b>{job.roleZh}</b>
                        <span>{job.roleEn}</span>
                      </div>
                      {cur ? <span className="ml-curtag">NOW</span> : null}
                      <div className="ml-jco">{job.company}</div>
                      <span className="ml-jdate">{job.date}</span>
                    </div>
                    <ul className="ml-bul">
                      {job.bullets.map((b, j) => (
                        <li key={j}>{rich(b)}</li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </section>

            <section className="ml-sec" data-panel="projects">
              <SectionHead no={projects.no} en={projects.title} zh={projects.zh} meta={projects.meta} />
              <div className="ml-projs">
                {projects.items.map((p, i) => {
                  const head = p.stats.find((s) => s.l.trim() === "");
                  const nums = head ? p.stats.filter((s) => s !== head) : p.stats;
                  return (
                    <article className="ml-proj" key={i}>
                      <div className="ml-ptop">
                        <span className="ml-pcode">{p.code}</span>
                        {head ? <span className="ml-pcode">{head.v}</span> : null}
                      </div>
                      <h3 className="ml-pname">{p.name}</h3>
                      <p className="ml-pkind">{p.kind}</p>
                      <p className="ml-pdesc">{rich(p.desc)}</p>
                      {nums.length > 0 && (
                        <div className="ml-pnums">
                          {nums.map((s, j) => (
                            <span key={j}>
                              <b>{s.v}</b>
                              {s.l}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <div className="ml-rail" aria-hidden="true">
              <i />
              <span>{footer.sig.split(/\n+/).filter(Boolean).join(" · ")}</span>
              <span className="line" />
              <b>{footer.code}</b>
            </div>
          </div>

          <aside className="ml-side">
            <section className="ml-panel ml-stack" data-panel="stack">
              <PanelHead no={stack.no} en={stackEn} zh={stackZh} />
              {stack.groups.map((g, i) => {
                const tags = tagsOf(g.v);
                return (
                  <div className="ml-sg" key={i}>
                    <span className="ml-sgl">{g.k}</span>
                    <span className="ml-tags">
                      {tags.map((t, j) => (
                        <span className={`ml-tag${(i + j) % 3 === 0 ? " fill" : ""}`} key={j}>
                          {t}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })}
              {flags.showStats && stack.skills.length > 0 && (
                <div className="ml-skills">
                  {stack.skills.map((s, i) => (
                    <div className="ml-skill" key={i}>
                      <span>{s.label}</span>
                      <i>
                        <b style={{ width: `${Math.max(0, Math.min(10, s.level)) * 10}%` }} />
                      </i>
                    </div>
                  ))}
                </div>
              )}
              <div className="ml-stack-foot">
                <span className="ml-checker" aria-hidden="true" />
                <span>{`${pad2(stack.groups.length)} LAYERS · CAPS ONYX`}</span>
              </div>
            </section>

            <section className="ml-panel" data-panel="education">
              <PanelHead no={education.no} en={credEn} zh={credZh} />
              <div className="ml-citem">
                <div className="ml-crow">
                  <b>{education.school}</b>
                  <span className="ml-cyr">{education.date}</span>
                </div>
                <div className="ml-cs">{education.schoolMeta}</div>
                <div className="ml-cd">{education.degree}</div>
              </div>
              <ul className="ml-clist">
                {education.items.map((item, i) => (
                  <li key={i}>{rich(item)}</li>
                ))}
              </ul>
            </section>

            <section className="ml-panel ml-spec">
              <PanelHead no="06" en="SPEC" />
              <dl className="ml-spec-list">
                {specRows.map((r, i) => (
                  <div key={i}>
                    <dt>{r.k}</dt>
                    <dd>{r.v}</dd>
                  </div>
                ))}
              </dl>
              <span className="ml-checker" aria-hidden="true" />
            </section>

            <div className="ml-rail" aria-hidden="true">
              <i />
              <span>END OF RAIL</span>
              <span className="line" />
              <b>
                {profile.no} — {education.no}
              </b>
            </div>
          </aside>
        </div>

        {/* ---- 页脚 ---- */}
        <footer className="ml-foot" data-panel="footer">
          {flags.showFlow && (
            <div className="ml-process" data-panel="flow">
              <span>
                <b>{flow.label}</b>
              </span>
              {flow.steps.map((s, i) => (
                <span key={i}>{s}</span>
              ))}
              <span className="ml-ptag">{flow.tag}</span>
            </div>
          )}

          <div className="ml-foot-main">
            <div className="ml-contactcard" aria-label="联系方式">
              {header.contacts.slice(0, 3).map((c, i) => (
                <div className="ml-cc" key={i}>
                  <span className="no">{pad2(i + 1)}.</span>
                  <span className="nm">{c.label}</span>
                  <span className="v">{c.value}</span>
                </div>
              ))}
            </div>

            <div className="ml-plate">
              <b>{footer.plateTop}</b>
              <span>{footer.plateSub}</span>
            </div>

            <div className="ml-foot-info">
              <div className="ml-fline">
                <i className="sq" aria-hidden="true" />
                <em>
                  {header.nameZh} · {header.nameEn}
                </em>
              </div>
              {footLine2 ? <div className="ml-fline">{footLine2}</div> : null}
              {footer.product ? <div className="ml-fline">{footer.product}</div> : null}
              <div className="ml-fline">{footer.copyright}</div>
            </div>
          </div>

          <div className="ml-bleed" aria-hidden="true">
            {footer.word}
          </div>
        </footer>
      </div>

      {/* ---- 页面级装饰：细线扫描层 / 贴边竖排字 ---- */}
      <div className="ml-grain" aria-hidden="true" />
      <div className="ml-edge l" aria-hidden="true">
        <span>{footer.edgeL}</span>
      </div>
      <div className="ml-edge r" aria-hidden="true">
        <span>{footer.edgeR}</span>
      </div>
    </div>
  );
}
