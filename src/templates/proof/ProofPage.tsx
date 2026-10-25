import type { CSSProperties } from "react";
import type { ResumeData } from "../../types";
import { rich, splitKicker } from "../kit";

/** "AWS Certified … — Associate / 2024" → ["AWS Certified … — Associate", "2024"]. */
function splitCert(item: string): [string, string] {
  const m = /^(.*\S)\s*\/\s*(\d{4})$/.exec(item.trim());
  return m ? [m[1], m[2]] : [item, ""];
}

/** 巨字单行：nameEn 全词一行（安静版不做两行大字）。 */
function titleText(header: ResumeData["header"]): string {
  const words = header.nameEn.trim().split(/\s+/).filter(Boolean);
  return words.length > 0 ? words.join(" ") : header.nameZh;
}

function isCurrent(date: string): boolean {
  return /now|至今|present|current/i.test(date);
}

/** 巨字按行宽收字号：可用宽 184mm，Impact 系字宽系数约 0.56em。 */
function titleFontMm(text: string): number {
  return Math.min(14, 182 / (Math.max(1, text.length) * 0.56));
}

/**
 * 打样稿 — 拼贴小报的安静版：同样的纸墨印刷气质，
 * 装饰收进细规则线与勾线字，主色只做文字与编号点缀。
 * Authoring guide: docs/template-authoring.md
 */
export function ProofPage({ data }: { data: ResumeData }) {
  const { header, profile, stack, education, experience, projects, flow, footer, strip, flags } = data;

  const title = titleText(header);
  const titleMm = titleFontMm(title);
  const [profileEn, profileZh] = splitKicker(profile.kicker);
  const [stackEn, stackZh] = splitKicker(stack.kicker);
  const [credEn, credZh] = splitKicker(education.kicker);

  const slogan = header.status[0] ?? "";
  const seriesMeta = [strip.a, strip.b].filter(Boolean).join(" · ");

  return (
    <div className="tpl-page t-proof" style={{ "--blue": data.theme.accent } as CSSProperties}>
      <div className="tpl-flow">
        {/* ---- 刊头 ---- */}
        <header className="pf-head" data-panel="identity">
          <div className="pf-mast">
            <p className="pf-series">
              <b>
                {header.brand} · {header.brandSub}
              </b>
              <span>{seriesMeta}</span>
            </p>
            <span className="pf-chip">
              <i aria-hidden="true">✱ </i>
              {strip.rev}
            </span>
          </div>

          <div className="pf-caption">
            <span>
              {strip.date} — {strip.sheet}
            </span>
            <span className="pf-say">
              <em>“{slogan}”</em> — {header.tag}
            </span>
          </div>

          <h1 className="pf-title" aria-label={`${header.nameEn} · ${header.titleZh}`}>
            <span className="pf-ln" style={{ fontSize: `${titleMm}mm` }}>
              {title}
            </span>
          </h1>

          <div className="pf-sub">
            <span className="pf-role">
              <b>
                {header.nameZh} · {header.titleZh}
              </b>
              <span>{header.titleEn}</span>
            </span>
            {flags.showYears ? (
              <span className="pf-years">
                <b>{header.years.value}</b>
                <span>{header.years.label}</span>
              </span>
            ) : null}
          </div>

          <p className="pf-contacts">
            {header.contacts.map((c, i) => (
              <span className="pf-ct" key={i}>
                <b>{c.label}</b>
                {c.value}
              </span>
            ))}
          </p>
        </header>

        {/* ---- 个人简介 ---- */}
        <section className="pf-sec" data-panel="profile">
          <div className="pf-shead">
            <span className="no">{profile.no}</span>
            <h2>{profileEn}</h2>
            <span className="zh">{profileZh}</span>
            <span className="rule" aria-hidden="true" />
            <span className="meta">{header.status[1]}</span>
          </div>
          <p className="pf-lede">{rich(profile.text)}</p>
          {flags.showStats && profile.stats.length > 0 ? (
            <p className="pf-stats">
              {profile.stats.map((s, i) => (
                <span key={i}>
                  <b>{s.value}</b>
                  <span> {s.label}</span>
                </span>
              ))}
            </p>
          ) : null}
        </section>

        {/* ---- 工作经历：剪报条目，细线分隔 ---- */}
        <section className="pf-sec" data-panel="experience">
          <div className="pf-shead2">
            <span className="no">{experience.no}</span>
            <h2>
              {experience.zh} <i>{experience.title}</i>
            </h2>
            <span className="meta">{experience.meta}</span>
          </div>
          {experience.jobs.map((job, i) => (
            <article className={isCurrent(job.date) ? "pf-job cur" : "pf-job"} key={i}>
              <div className="pf-job-h">
                <span className="pf-idx" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{job.roleZh}</h3>
                <span className="pf-co">
                  {job.company} · {job.roleEn}
                </span>
                <span className="pf-date">{job.date}</span>
              </div>
              <ul className="pf-bul">
                {job.bullets.map((b, j) => (
                  <li key={j}>{rich(b)}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        {/* ---- 项目：hairline 网格 ---- */}
        <section className="pf-sec" data-panel="projects">
          <div className="pf-shead2">
            <span className="no">{projects.no}</span>
            <h2>
              {projects.zh} <i>{projects.title}</i>
            </h2>
            <span className="meta">{projects.meta}</span>
          </div>
          <div className="pf-grid">
            {projects.items.map((p, i) => (
              <article className="pf-cell" key={i}>
                <div className="pf-cell-top">
                  <span className="code">{p.code}</span>
                  <span>{p.kind}</span>
                </div>
                <h3>{p.name}</h3>
                <p className="pf-desc">{rich(p.desc)}</p>
                {p.stats.length > 0 ? (
                  <p className="pf-cell-stats">
                    {p.stats.map((s, j) => (
                      <span key={j}>
                        <b>{s.v}</b>
                        {s.l ? ` ${s.l}` : ""}
                      </span>
                    ))}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {/* ---- 技术栈 + 教育 ---- */}
        <div className="pf-duo">
          <section className="pf-sec" data-panel="stack">
            <div className="pf-shead">
              <span className="no">{stack.no}</span>
              <h2>{stackEn}</h2>
              <span className="zh">{stackZh}</span>
              <span className="rule" aria-hidden="true" />
            </div>
            <div className="pf-spec">
              {stack.groups.map((g, i) => (
                <p className="pf-srow" key={i}>
                  <span className="k">{g.k}</span>
                  <span className="lead" aria-hidden="true" />
                  <span className="v">{g.v}</span>
                </p>
              ))}
            </div>
            {stack.skills.length > 0 ? (
              <div className="pf-dots">
                {stack.skills.map((s, i) => (
                  <p className="pf-skill" key={i}>
                    <span className="lb">{s.label}</span>
                    <span className="sq" aria-hidden="true">
                      {Array.from({ length: 10 }, (_, d) => (
                        <i className={d < Math.max(0, Math.min(10, s.level)) ? "on" : ""} key={d} />
                      ))}
                    </span>
                  </p>
                ))}
              </div>
            ) : null}
          </section>

          <section className="pf-sec" data-panel="education">
            <div className="pf-shead">
              <span className="no">{education.no}</span>
              <h2>{credEn}</h2>
              <span className="zh">{credZh}</span>
              <span className="rule" aria-hidden="true" />
            </div>
            <div className="pf-edu">
              <div className="pf-edu-h">
                <h3>{education.school}</h3>
                <span className="pf-date plain">{education.date}</span>
              </div>
              <p className="pf-edu-meta">{education.schoolMeta}</p>
              <p className="pf-degree">{education.degree}</p>
            </div>
            <ul className="pf-certs">
              {education.items.map((item, i) => {
                const [label, year] = splitCert(item);
                return (
                  <li key={i}>
                    <span>{label}</span>
                    {year ? <span className="yr">{year}</span> : null}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* ---- 页脚：细线收底 ---- */}
        <footer className="pf-foot" data-panel="footer">
          {flags.showFlow ? (
            <p className="pf-flow" data-panel="flow">
              <span className="fl">{flow.label}</span>
              {flow.steps.map((s, i) => (
                <span key={i}>
                  <i className="sep" aria-hidden="true">
                    ▸{" "}
                  </i>
                  {s}
                </span>
              ))}
              <span className="tag">{flow.tag}</span>
            </p>
          ) : null}

          <div className="pf-foot-main">
            <span className="pf-plate">
              <b>{footer.plateTop}</b>
              <span>{footer.plateSub}</span>
            </span>
            <span className="pf-mark">
              <b>{footer.word}</b>
              <span>{footer.code}</span>
            </span>
          </div>

          <p className="pf-colophon">
            <span>{footer.copyright}</span>
            <span>{footer.product}</span>
            <span>
              {header.nameZh} · {header.titleZh}
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
}
