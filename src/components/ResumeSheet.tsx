import type { CSSProperties, ReactNode, Ref } from 'react'
import type { ResumeData } from '../types'

/** {BRAced} tokens become cobalt mono highlights. */
function rich(text: string): ReactNode[] {
  return text.split(/(\{[^{}]+\})/).map((part, i) =>
    part.startsWith('{') && part.endsWith('}') ? <b key={i}>{part.slice(1, -1)}</b> : <span key={i}>{part}</span>,
  )
}

const pad = (n: number) => String(n).padStart(2, '0')

export function ResumeSheet({
  data,
  sheetRef,
}: {
  data: ResumeData
  sheetRef?: Ref<HTMLDivElement>
}) {
  const { strip, header, profile, stack, education, experience, projects, flow, footer, flags } = data

  return (
    <div
      className="sheet"
      ref={sheetRef}
      style={{ '--blue': data.theme.accent } as CSSProperties}
    >
      <i className="reg tl" />
      <i className="reg tr" />
      <i className="reg bl" />
      <i className="reg br" />

      <div className="edge l">
        <span>{footer.edgeL}</span>
      </div>
      <div className="edge r">
        <span>{footer.edgeR}</span>
      </div>

      {/* ---------- top strip ---------- */}
      <div className="strip" data-panel="identity">
        <div className="l">
          <span>
            <span className="star" />
            {strip.a}
          </span>
          <span>
            <span className="star" />
            {strip.b}
          </span>
          <span>
            <b>{strip.rev}</b>
          </span>
        </div>
        <div className="r">
          <span>{strip.sheet}</span>
          <span>
            <b>{strip.date}</b>
          </span>
        </div>
      </div>

      {/* ---------- identity ---------- */}
      <header className="id-card" data-panel="identity">
        <div className="id-band">
          <div className="brand">
            <svg className="logomark" viewBox="0 0 40 40" aria-hidden="true">
              <rect x=".7" y=".7" width="38.6" height="38.6" fill="none" stroke="#fff" strokeWidth="1.4" />
              <g fill="#fff">
                <rect x="5.4" y="6" width="1.7" height="15" />
                <rect x="8.6" y="6" width="1.1" height="15" />
                <rect x="11.1" y="6" width="2.4" height="15" />
                <rect x="14.9" y="6" width="1.1" height="15" />
                <rect x="17.4" y="6" width="1.7" height="15" />
                <rect x="20.5" y="6" width="1.1" height="15" />
                <rect x="23" y="6" width="2.4" height="15" />
                <rect x="26.8" y="6" width="1.7" height="15" />
                <rect x="29.9" y="6" width="1.1" height="15" />
                <rect x="32.4" y="6" width="1.7" height="15" />
              </g>
              <rect x="5.4" y="24.4" width="28.7" height="2.6" fill="#fff" />
              <rect x="5.4" y="29.4" width="13.4" height="2.6" fill="#fff" />
            </svg>
            <div className="brand-txt">
              {header.brand}
              <em>{header.brandSub}</em>
            </div>
          </div>

          <div className="id-name">
            <span className="cn-name cn">{header.nameZh}</span>
            <span className="tag">{header.tag}</span>
          </div>

          <div className="id-title">
            <div className="t-cn">{header.titleZh}</div>
            <div className="t-en">{header.titleEn}</div>
          </div>

          <i className="reg inv tr" />
          <i className="reg inv bl" />
        </div>

        <div className="id-rule" />

        <div className="id-main">
          <div>
            <div className="latin">{header.nameEn}</div>
            <div className="id-sub">
              <span className="star" />
              {header.status.map((item, i) => (
                <span key={i}>
                  <span>{item}</span>
                  {i < header.status.length - 1 && <span>/</span>}
                </span>
              ))}
            </div>
          </div>

          {flags.showYears && (
            <div className="yrs">
              <b>{header.years.value}</b>
              <span>{header.years.label}</span>
            </div>
          )}

          <div className="id-meta">
            {header.contacts.map((c, i) => (
              <div key={i}>
                <b>{c.label}</b>
                <span>{c.value}</span>
              </div>
            ))}
          </div>

          <i className="reg tr" />
        </div>
      </header>

      {/* ---------- body ---------- */}
      <div className="cols">
        <aside className="col">
          <section className="card blue" data-panel="profile">
            <div className="card-head">
              <span className="k">{profile.kicker}</span>
              <span className="n">{profile.no}</span>
            </div>
            <div className="profile">
              <svg className="pixel" viewBox="0 0 30 30" aria-hidden="true">
                <g fill="#fff">
                  <rect x="0" y="0" width="5.4" height="5.4" />
                  <rect x="6" y="0" width="5.4" height="5.4" />
                  <rect x="12" y="0" width="5.4" height="5.4" />
                  <rect x="0" y="6" width="5.4" height="5.4" />
                  <rect x="18" y="6" width="5.4" height="5.4" />
                  <rect x="0" y="12" width="5.4" height="5.4" />
                  <rect x="6" y="12" width="5.4" height="5.4" />
                  <rect x="12" y="12" width="5.4" height="5.4" />
                  <rect x="18" y="18" width="5.4" height="5.4" />
                  <rect x="0" y="24" width="5.4" height="5.4" />
                  <rect x="6" y="24" width="5.4" height="5.4" />
                  <rect x="12" y="24" width="5.4" height="5.4" />
                </g>
              </svg>
              <p>{profile.text}</p>
            </div>
            {flags.showStats && (
              <div className="pstats">
                {profile.stats.map((s, i) => (
                  <div key={i}>
                    <b>{s.value}</b>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card" data-panel="stack">
            <div className="card-head">
              <span className="k">{stack.kicker}</span>
              <span className="n">{stack.no}</span>
            </div>
            <div className="spec">
              {stack.groups.map((g, i) => (
                <div className="spec-row" key={i}>
                  <span className="k">{g.k}</span>
                  <span className="v">{g.v}</span>
                </div>
              ))}
            </div>
            <div className="bars">
              {stack.skills.map((s, i) => (
                <div className="bar" key={i}>
                  <span className="lbl">{s.label}</span>
                  <span className="track">
                    {Array.from({ length: 10 }, (_, n) => (
                      <i key={n} className={n < s.level ? 'on' : ''} />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="card" data-panel="education">
            <div className="card-head">
              <span className="k">{education.kicker}</span>
              <span className="n">{education.no}</span>
            </div>
            <div className="edu-item">
              <div className="h">
                <b className="cn">{education.school}</b>
                <span>{education.date}</span>
              </div>
              <div className="s">{education.schoolMeta}</div>
              <div className="d">{education.degree}</div>
            </div>
            <div className="cred">
              {education.items.map((item, i) => (
                <div key={i}>{item}</div>
              ))}
            </div>
          </section>
        </aside>

        <div className="col">
          <section className="sec" data-panel="experience">
            <div className="sec-head">
              <span className="num">{experience.no}</span>
              <h2>{experience.title}</h2>
              <span className="zh">{experience.zh}</span>
              <span className="rule" />
              <span className="meta">{experience.meta}</span>
            </div>

            {experience.jobs.map((job, i) => (
              <article className="job" key={i}>
                <div className="job-band">
                  <span className="idx">{pad(i + 1)}</span>
                  <div className="role">
                    <b className="cn">{job.roleZh}</b>
                    <span>{job.roleEn}</span>
                  </div>
                  <div className="co">{job.company}</div>
                  <div className="date">{job.date}</div>
                </div>
                <ul className="bul">
                  {job.bullets.map((b, j) => (
                    <li key={j}>{rich(b)}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="sec" data-panel="projects">
            <div className="sec-head">
              <span className="num">{projects.no}</span>
              <h2>{projects.title}</h2>
              <span className="zh">{projects.zh}</span>
              <span className="rule" />
              <span className="meta">{projects.meta}</span>
            </div>
            <div className="proj-grid">
              {projects.items.map((p, i) => (
                <article className="proj" key={i}>
                  <div className="proj-band">
                    <b>{p.name}</b>
                    <span>{p.code}</span>
                  </div>
                  <div className="proj-body">
                    <div className="kind">{p.kind}</div>
                    <p className="desc">{p.desc}</p>
                    <div className="nums">
                      {p.stats.map((s, j) => (
                        <span key={j}>
                          <b>{s.v}</b> {s.l}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ---------- process ---------- */}
      {flags.showFlow && (
        <div className="flow" data-panel="flow">
          <span className="lab">{flow.label}</span>
          <div className="steps">
            {flow.steps.map((step, i) => (
              <span key={i}>
                {step}
                <i />
              </span>
            ))}
          </div>
          <span className="tag">{flow.tag}</span>
        </div>
      )}

      {/* ---------- footer ---------- */}
      <footer className="foot" data-panel="footer">
        <div className="foot-top">
          <span>{footer.product}</span>
          <span>{footer.copyright}</span>
        </div>
        <div className="foot-band">
          <div className="foot-word">{footer.word}</div>
          <div className="foot-plate">
            <b>{footer.plateTop}</b>
            <span>{footer.plateSub}</span>
          </div>
          <div className="foot-right">
            <div className="foot-barcode">
              <div className="bars" />
              <div className="num">{footer.code}</div>
            </div>
            <div className="foot-sig">
              {footer.sig.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < footer.sig.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
          <i className="reg inv" />
        </div>
      </footer>
    </div>
  )
}
