import type { CSSProperties, ReactNode } from "react";
import type { ResumeData } from "../../types";
import { rich } from "../kit";

const pad = (n: number) => String(n).padStart(2, "0");

function Regs() {
  return (
    <>
      <i className="reg tl" />
      <i className="reg tr" />
      <i className="reg bl" />
      <i className="reg br" />
    </>
  );
}

function Edges({ data }: { data: ResumeData }) {
  return (
    <>
      <div className="edge l">
        <span>{data.footer.edgeL}</span>
      </div>
      <div className="edge r">
        <span>{data.footer.edgeR}</span>
      </div>
    </>
  );
}

function Strip({ data, page, pages }: { data: ResumeData; page?: number; pages?: number }) {
  const { strip } = data;
  return (
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
        <span>{pages && pages > 1 ? `SHEET ${pad((page ?? 0) + 1)} / ${pad(pages)}` : strip.sheet}</span>
        <span>
          <b>{strip.date}</b>
        </span>
      </div>
    </div>
  );
}

/** Brand mark: framed signal pulse (replaces the old barcode mark). */
function BrandMark() {
  return (
    <svg className="logomark" viewBox="0 0 40 40" aria-hidden="true">
      <rect x=".7" y=".7" width="38.6" height="38.6" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path
        d="M4.5 20.5h6.2l2.7-9.5 5.2 18.5 3.4-11 2.4 4.2h10.9"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M4.5 27.6h31" stroke="#fff" strokeWidth="1.1" />
      <path d="M7.5 30.6h6M17 30.6h6M26.5 30.6h6" stroke="#fff" strokeWidth="1.1" />
    </svg>
  );
}

function PixelMark({ className = "pixel" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 30" aria-hidden="true">
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
  );
}

function IdCard({ data }: { data: ResumeData }) {
  const { header, flags } = data;
  return (
    <header className="id-card" data-panel="identity">
      <div className="id-band">
        <div className="brand">
          <BrandMark />
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
  );
}

function ProfileCard({ data, wide = false }: { data: ResumeData; wide?: boolean }) {
  const { profile, flags } = data;
  return (
    <section className={wide ? "card blue profile-wide" : "card blue"} data-panel="profile">
      <div className="card-head">
        <span className="k">{profile.kicker}</span>
        <span className="n">{profile.no}</span>
      </div>
      {wide ? (
        <div className="pw">
          <div className="pw-body">
            <p>{rich(profile.text)}</p>
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
          </div>
          <PixelMark className="pixel pw-pixel" />
        </div>
      ) : (
        <>
          <div className="profile">
            <PixelMark />
            <p>{rich(profile.text)}</p>
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
        </>
      )}
    </section>
  );
}

function StackCard({ data, wide = false }: { data: ResumeData; wide?: boolean }) {
  const { stack } = data;
  return (
    <section className={wide ? "card stack-wide" : "card"} data-panel="stack">
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
                <i key={n} className={n < s.level ? "on" : ""} />
              ))}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EducationCard({ data, wide = false }: { data: ResumeData; wide?: boolean }) {
  const { education } = data;
  return (
    <section className={wide ? "card edu-wide" : "card"} data-panel="education">
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
  );
}

function ContactCard({ data }: { data: ResumeData }) {
  return (
    <section className="card contact-card" data-panel="identity">
      <div className="card-head">
        <span className="k">CONTACT / 联系方式</span>
        <span className="n">{data.profile.no}</span>
      </div>
      <div className="contact-wide">
        {data.header.contacts.map((c, i) => (
          <div key={i}>
            <span className="k">{c.label}</span>
            <span className="v">{c.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExperienceSection({ data }: { data: ResumeData }) {
  const { experience } = data;
  return (
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
  );
}

function ProjectsSection({ data, showcase = false }: { data: ResumeData; showcase?: boolean }) {
  const { projects } = data;
  return (
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
            {showcase && <span className="proj-mark">{p.code}</span>}
            <div className="proj-body">
              <div className="kind">{p.kind}</div>
              <p className="desc">{rich(p.desc)}</p>
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
  );
}

function FlowStrip({ data }: { data: ResumeData }) {
  if (!data.flags.showFlow) return null;
  return (
    <div className="flow" data-panel="flow">
      <span className="lab">{data.flow.label}</span>
      <div className="steps">
        {data.flow.steps.map((step, i) => (
          <span key={i}>
            {step}
            <i />
          </span>
        ))}
      </div>
      <span className="tag">{data.flow.tag}</span>
    </div>
  );
}

function Foot({ data }: { data: ResumeData }) {
  const { footer } = data;
  return (
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
          <div className="foot-signal">
            <svg className="wave" viewBox="0 0 90 22" aria-hidden="true">
              <path
                d="M1 11h13l4.5-8 7 16 5-11 3.5 3h13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
              <path d="M56 11h32" stroke="currentColor" strokeWidth="1.4" />
              <path d="M63 6.5v9M68.5 6.5v9M74 6.5v9M79.5 6.5v9M85 6.5v9" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            <div className="sig-meta">
              <b>SIGNAL LOCKED</b>
              <span>{footer.code}</span>
            </div>
          </div>
          <div className="foot-sig">
            {footer.sig.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < footer.sig.split("\n").length - 1 && <br />}
              </span>
            ))}
          </div>
        </div>
        <i className="reg inv" />
      </div>
    </footer>
  );
}

function PageRoot({ data, extraClass, day, children }: { data: ResumeData; extraClass?: string; day?: boolean; children: ReactNode }) {
  return (
    <div
      className={`tpl-page t-industrial${extraClass ? ` ${extraClass}` : ""}${day ? " t-industrial-day" : ""}`}
      style={{ "--blue": data.theme.accent } as CSSProperties}
    >
      <Regs />
      <Edges data={data} />
      {children}
    </div>
  );
}

/** Classic single-page industrial label resume. */
export function IndustrialClassicPage({ data, day }: { data: ResumeData; day?: boolean }) {
  return (
    <PageRoot data={data} day={day}>
      <div className="tpl-flow">
        <Strip data={data} />
        <IdCard data={data} />
        <div className="cols">
          <aside className="col">
            <ProfileCard data={data} />
            <StackCard data={data} />
            <EducationCard data={data} />
          </aside>
          <div className="col">
            <ExperienceSection data={data} />
            <ProjectsSection data={data} />
          </div>
        </div>
        <FlowStrip data={data} />
        <Foot data={data} />
      </div>
    </PageRoot>
  );
}

/** Duplex page 1: identity + profile + full experience + stack. */
export function IndustrialDuplexPage1({ data, day }: { data: ResumeData; day?: boolean }) {
  return (
    <PageRoot data={data} day={day}>
      <div className="tpl-flow">
        <Strip data={data} page={0} pages={2} />
        <IdCard data={data} />
        <ProfileCard data={data} wide />
        <ExperienceSection data={data} />
        <StackCard data={data} wide />
        <FlowStrip data={data} />
      </div>
    </PageRoot>
  );
}

/** Duplex page 2: project showcase + credentials + footer. */
export function IndustrialDuplexPage2({ data, day }: { data: ResumeData; day?: boolean }) {
  return (
    <PageRoot data={data} extraClass="t-industrial--p2" day={day}>
      <div className="tpl-flow">
        <Strip data={data} page={1} pages={2} />
        <div className="p2-hero" data-panel="identity">
          <div>
            <div className="kick">PORTFOLIO APPENDIX / 02</div>
            <h2>项目档案</h2>
            <div className="kick" style={{ marginTop: "2mm", opacity: 0.75 }}>
              SELECTED WORK · {data.projects.items.length} PROJECTS
            </div>
          </div>
          <div className="who">
            <b>{data.header.nameEn}</b>
            {data.header.nameZh} · {data.header.titleEn}
            <br />
            PAGE 02 / 02
          </div>
        </div>
        <ProjectsSection data={data} showcase />
        <div className="p2-bottom">
          <EducationCard data={data} wide />
          <ContactCard data={data} />
        </div>
        <FlowStrip data={data} />
        <Foot data={data} />
      </div>
    </PageRoot>
  );
}

export function IndustrialPage({ data, page, duplex, day }: { data: ResumeData; page: number; duplex: boolean; day?: boolean }) {
  if (!duplex) return <IndustrialClassicPage data={data} day={day} />;
  return page === 0 ? <IndustrialDuplexPage1 data={data} day={day} /> : <IndustrialDuplexPage2 data={data} day={day} />;
}
