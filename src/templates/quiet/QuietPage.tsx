import type { CSSProperties } from "react";
import type { ResumeData } from "../../types";
import { rich, splitKicker } from "../kit";

/** "AWS … — Associate / 2024" → ["AWS … — Associate", "2024"]. */
function splitCert(item: string): [string, string] {
  const m = /^(.*\S)\s*\/\s*(\d{4})$/.exec(item.trim());
  return m ? [m[1], m[2]] : [item, ""];
}

/** Rail column of a section band: number + latin name, chinese name, mono meta lines. */
function Rail({ no, title, zh, meta }: { no: string; title: string; zh: string; meta: string[] }) {
  return (
    <div className="qt-rail">
      <div className="qt-id">
        <span className="qt-num" aria-hidden="true">
          {no}
        </span>
        <h2>{title}</h2>
      </div>
      {zh ? <span className="qt-cn">{zh}</span> : null}
      {meta.length > 0 ? (
        <span className="qt-meta">
          {meta.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </span>
      ) : null}
    </div>
  );
}

function QuietPageBody({ data, page = 0, duplex = false }: { data: ResumeData; page?: number; duplex?: boolean }) {
  const { header, profile, stack, education, experience, projects, flow, footer, strip, flags } = data;

  const [profileEn, profileZh] = splitKicker(profile.kicker);
  const [stackEn, stackZh] = splitKicker(stack.kicker);
  const [certEn, certZh] = splitKicker(education.kicker);

  /* Giant three-line lockup: latin name split in two lines + document word. */
  const nameWords = header.nameEn.trim().split(/\s+/).filter(Boolean);
  const nameLines = [nameWords[0] ?? header.nameZh, nameWords.slice(1).join(" ")].filter(Boolean);
  const docWord = (header.tag.split("/")[0] ?? "").trim() || "RESUME";

  return (
    <div className="tpl-page t-quiet" style={{ "--blue": data.theme.accent } as CSSProperties}>
      <div className="tpl-flow">
        <header className="qt-top" data-panel="identity">
          <div className="qt-mast">
            <div className="qt-who">
              <i className="qt-chip" aria-hidden="true" />
              <b>{header.nameEn}</b>
              <span className="qt-cn">{header.nameZh}</span>
            </div>
            <div className="qt-mid">{header.tag.replace(/\s*\/\s*/, " · ")}</div>
            <div className="qt-right">
              {strip.date} · {duplex ? `SHEET 0${page + 1} / 02` : strip.sheet}
            </div>
          </div>

          <div className="qt-hero">
            <div className="qt-hero-type">
              <div className="qt-tt">
                <h1>
                  {nameLines.map((line, i) => (
                    <span key={i}>{line}</span>
                  ))}
                </h1>
                <p className="qt-doc">{docWord}</p>
              </div>
              <p className="qt-hero-cap">
                <i className="qt-chip" aria-hidden="true" />
                <span>
                  {header.nameZh} · {header.titleZh}
                </span>
                <span className="qt-en">{header.titleEn}</span>
              </p>
            </div>

            <div className="qt-hero-meta">
              <p className="qt-avail">
                <span>{header.status[2] ?? header.status[0]}</span>
                {flags.showYears ? (
                  <b>
                    {header.years.value} {header.years.label}
                  </b>
                ) : null}
              </p>
              <dl className="qt-contacts">
                {header.contacts.map((c, i) => (
                  <div className="qt-contact" key={i}>
                    <dt>{c.label}</dt>
                    <dd>{c.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </header>

        {(page === 0 || !duplex) && (
        <section className="qt-band" data-panel="profile">
          <Rail
            no={profile.no}
            title={profileEn}
            zh={profileZh}
            meta={[header.status[0] ?? "", header.status[2] ?? ""].filter(Boolean)}
          />
          <div className="qt-body">
            <div className={flags.showStats ? "qt-intro" : "qt-intro qt-intro--solo"}>
              <p className="qt-lede">{rich(profile.text)}</p>
              {flags.showStats ? (
                <div className="qt-stats">
                  {profile.stats.map((s, i) => (
                    <div className="qt-stat" key={i}>
                      <b>{s.value}</b>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
        )}

        {(page === 0 || !duplex) && (
        <section className="qt-band" data-panel="experience">
          <Rail
            no={experience.no}
            title={experience.title}
            zh={experience.zh}
            meta={experience.meta.split("·").map((s) => s.trim()).filter(Boolean)}
          />
          <div className="qt-body">
            {experience.jobs.map((job, i) => (
              <article className="qt-job" key={i}>
                <div className="qt-job-h">
                  <div>
                    <h3>{job.roleZh}</h3>
                    <span className="qt-co">
                      {job.company} · {job.roleEn}
                    </span>
                  </div>
                  <span className="qt-date">{job.date}</span>
                </div>
                <ul className="qt-bul">
                  {job.bullets.map((b, j) => (
                    <li key={j}>{rich(b)}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
        )}

        {(page === 1 || !duplex) && (
        <section className="qt-band" data-panel="projects">
          <Rail no={projects.no} title={projects.title} zh={projects.zh} meta={[projects.meta]} />
          <div className="qt-body">
            <ol className="qt-work">
              {projects.items.map((p, i) => (
                <li key={i}>
                  <span className="qt-wk-n">{p.code}</span>
                  <span className="qt-wk-name">
                    <b>{p.name}</b>
                  </span>
                  <span className="qt-wk-kind">{p.kind}</span>
                  <span className="qt-wk-m">
                    {p.stats.map((s, j) => (
                      <span key={j}>
                        {j > 0 ? " · " : ""}
                        {s.v}
                        {s.l ? ` ${s.l}` : ""}
                      </span>
                    ))}
                  </span>
                  <span className="qt-wk-desc">{p.desc}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
        )}

        {(page === 1 || !duplex) && (
        <section className="qt-band qt-band-pair">
          <div className="qt-pair">
            <div className="qt-cell" data-panel="stack">
              <div className="qt-cellhead">
                <span className="qt-num" aria-hidden="true">
                  {stack.no}
                </span>
                <h2>{stackEn}</h2>
                {stackZh ? <span className="qt-cn">{stackZh}</span> : null}
              </div>
              <dl className="qt-spec">
                {stack.groups.map((g, i) => (
                  <div className="qt-row" key={i}>
                    <dt>{g.k}</dt>
                    <dd>{g.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="qt-cell" data-panel="education">
              <div className="qt-cellhead">
                <span className="qt-num" aria-hidden="true">
                  {education.no}
                </span>
                <h2>{certEn}</h2>
                {certZh ? <span className="qt-cn">{certZh}</span> : null}
              </div>
              <div className="qt-edu">
                <div>
                  <h3>{education.school}</h3>
                  <span className="qt-en">{education.schoolMeta}</span>
                </div>
                <span className="qt-date">{education.date}</span>
              </div>
              <p className="qt-edu-sub">{education.degree}</p>
              <ul className="qt-certs">
                {education.items.map((item, i) => {
                  const [label, year] = splitCert(item);
                  return (
                    <li key={i}>
                      <span>{label}</span>
                      {year ? <span className="qt-cert-y">{year}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="qt-skills" data-panel="stack">
            <span className="qt-skills-k">LEVEL</span>
            {stack.skills.map((s, i) => (
              <div className="qt-skill" key={i}>
                <span>{s.label}</span>
                <span className="qt-track" aria-hidden="true">
                  <i style={{ width: `${Math.max(0, Math.min(10, s.level)) * 10}%` }} />
                </span>
              </div>
            ))}
          </div>
        </section>
        )}

        <footer className="qt-foot" data-panel="footer">
          {flags.showFlow ? (
            <div className="qt-flow" data-panel="flow">
              <span className="qt-flow-label">{flow.label}</span>
              <span className="qt-flow-steps">
                {flow.steps.map((step, i) => (
                  <span className="qt-step" key={i}>
                    {step}
                  </span>
                ))}
              </span>
              <span className="qt-flow-tag">
                {strip.rev} · {flow.tag}
              </span>
            </div>
          ) : null}

          <div className="qt-colophon">
            <span>{footer.copyright}</span>
            <span className="qt-mid">{footer.code}</span>
            <span>{footer.product}</span>
          </div>

          <div className="qt-sw-foot">
            <span className="qt-sig">
              {header.nameZh} · {header.titleZh}
            </span>
            <span>A4 / 210 × 297 MM · {footer.edgeR}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function QuietPage({ data, page = 0, duplex = false }: { data: ResumeData; page?: number; duplex?: boolean }) {
  /* 双页第 2 页：项目规格索引 + 技术栈/证书（页脚与第 1 页共享）。 */
  if (duplex && page === 1) return <QuietPageBody data={data} page={1} duplex />;
  return <QuietPageBody data={data} page={0} duplex={duplex} />;
}
