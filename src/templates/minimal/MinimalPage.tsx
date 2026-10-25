import type { CSSProperties } from "react";
import type { ResumeData } from "../../types";
import { rich } from "../kit";

function Head({ data, page, compact }: { data: ResumeData; page: number; compact?: boolean }) {
  const { header } = data;
  return (
    <header className="mn-head" data-panel="identity">
      <div className="mn-top">
        <span>
          {page === 0 ? "RESUME" : "APPENDIX"} / <b>{data.strip.date}</b> — SHEET {String(page + 1).padStart(2, "0")} / 02
        </span>
        <span>{header.status.slice(0, 2).join(" · ")}</span>
      </div>

      <h1 className={compact ? "mn-name mn-name--p2" : "mn-name"}>{header.nameZh}</h1>

      <div className="mn-sub">
        <span className="mn-latin">{header.nameEn}</span>
        <span className="mn-title">
          {header.titleZh} / {header.titleEn}
        </span>
      </div>

      {/* 第 2 页的联系方式由附录区 CONTACT 承担，页眉不再重复 */}
      {!compact && (
        <div className="mn-contacts">
          {header.contacts.map((c, i) => (
            <div key={i}>
              <b>{c.label}</b>
              <span>{c.value}</span>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

function ProfileSec({ data }: { data: ResumeData }) {
  const { profile } = data;
  return (
    <section className="mn-sec" data-panel="profile">
      <h2>
        PROFILE <em>{profile.no}</em>
      </h2>
      <p>{profile.text}</p>
      {data.flags.showStats && (
        <div className="mn-list">
          {profile.stats.map((s, i) => (
            <div key={i}>
              <b style={{ fontFamily: "var(--mm)", color: "var(--blue)" }}>{s.value}</b> {s.label}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StackSec({ data }: { data: ResumeData }) {
  const { stack } = data;
  return (
    <section className="mn-sec" data-panel="stack">
      <h2>
        STACK <em>{stack.no}</em>
      </h2>
      {stack.groups.map((g, i) => (
        <div className="mn-group" key={i}>
          <b>{g.k}</b>
          <span>{g.v}</span>
        </div>
      ))}
      <div style={{ marginTop: "2.4mm" }}>
        {stack.skills.map((s, i) => (
          <div className="mn-skill" key={i}>
            <span>{s.label}</span>
            <i>{"▮".repeat(Math.max(0, Math.min(10, s.level)))}</i>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExperienceSec({ data }: { data: ResumeData }) {
  const { experience } = data;
  return (
    <section className="mn-sec" data-panel="experience">
      <h2>
        EXPERIENCE <em>{experience.meta}</em>
      </h2>
      {experience.jobs.map((job, i) => (
        <article className="mn-job" key={i}>
          <div className="mn-job-head">
            <b>{job.roleZh}</b>
            <span>{job.date}</span>
          </div>
          <div className="mn-company">
            {job.company} · {job.roleEn}
          </div>
          <ul className="mn-bullets">
            {job.bullets.map((b, j) => (
              <li key={j}>{rich(b)}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

function ProjectsSec({ data }: { data: ResumeData }) {
  const { projects } = data;
  return (
    <section className="mn-sec" data-panel="projects">
      <h2>
        SELECTED WORK <em>{projects.meta}</em>
      </h2>
      {projects.items.map((p, i) => (
        <article className="mn-proj" key={i}>
          <b>{p.name}</b>
          <span className="desc">{p.desc}</span>
          <span className="meta">
            {p.stats.map((s, j) => (
              <span key={j}>
                <b>{s.v}</b>
                {s.l ? ` ${s.l}` : ""}
                {j < p.stats.length - 1 ? "  " : ""}
              </span>
            ))}
          </span>
        </article>
      ))}
    </section>
  );
}

function EducationSec({ data }: { data: ResumeData }) {
  const { education } = data;
  return (
    <section className="mn-sec mn-edu" data-panel="education">
      <h2>
        EDUCATION <em>{education.no}</em>
      </h2>
      <b>{education.school}</b>
      <span>{education.schoolMeta}</span>
      <p>{education.degree}</p>
      <p style={{ fontFamily: "var(--mm)", fontSize: "5.8pt", letterSpacing: ".06em", color: "var(--muted)" }}>
        {education.date}
      </p>
      <div className="mn-list">
        {education.items.map((item, i) => (
          <div key={i}>{item}</div>
        ))}
      </div>
    </section>
  );
}

function Foot({ data, page, single }: { data: ResumeData; page: number; single?: boolean }) {
  const { footer } = data;
  return (
    <div className="mn-foot">
      <span>
        {footer.plateTop} · {footer.product}
      </span>
      <span>
        PAGE{" "}
        <b>
          {String(page + 1).padStart(2, "0")} / {single ? "01" : "02"}
        </b>{" "}
        · {footer.copyright}
      </span>
    </div>
  );
}

/** Classic single-page minimal resume. */
function MinimalClassicPage({ data }: { data: ResumeData }) {
  return (
    <div className="tpl-page t-minimal" style={{ "--blue": data.theme.accent } as CSSProperties}>
      <div className="tpl-flow">
        <Head data={data} page={0} />
        <div className="mn-body">
          <aside className="mn-side">
            <ProfileSec data={data} />
            <StackSec data={data} />
            <EducationSec data={data} />
          </aside>
          <main className="mn-main">
            <ExperienceSec data={data} />
            <ProjectsSec data={data} />
          </main>
        </div>
        <Foot data={data} page={0} single />
      </div>
    </div>
  );
}

/** Duplex page 1: identity + profile + stack + full experience. */
function MinimalDuplexPage1({ data }: { data: ResumeData }) {
  return (
    <div className="tpl-page t-minimal" style={{ "--blue": data.theme.accent } as CSSProperties}>
      <div className="tpl-flow">
        <Head data={data} page={0} />
        <div className="mn-body">
          <aside className="mn-side">
            <ProfileSec data={data} />
            <StackSec data={data} />
          </aside>
          <main className="mn-main">
            <ExperienceSec data={data} />
          </main>
        </div>
        <Foot data={data} page={0} />
      </div>
    </div>
  );
}

/** Duplex page 2: project showcase + credentials + contact appendix. */
function MinimalDuplexPage2({ data }: { data: ResumeData }) {
  return (
    <div className="tpl-page t-minimal t-minimal--p2" style={{ "--blue": data.theme.accent } as CSSProperties}>
      <div className="tpl-flow">
        <Head data={data} page={1} compact />
        <div className="mn-body mn-body--solo">
          <main className="mn-main">
            <ProjectsSec data={data} />
            <div className="mn-p2grid">
              <EducationSec data={data} />
              <section className="mn-sec" data-panel="identity">
                <h2>
                  CONTACT <em>{data.profile.no}</em>
                </h2>
                <div className="mn-contact-list">
                  {data.header.contacts.map((c, i) => (
                    <div className="mn-group" key={i}>
                      <b>{c.label}</b>
                      <span>{c.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </main>
        </div>
        <Foot data={data} page={1} />
      </div>
    </div>
  );
}

export function MinimalPage({ data, page = 0, duplex = false }: { data: ResumeData; page?: number; duplex?: boolean }) {
  if (!duplex) return <MinimalClassicPage data={data} />;
  return page === 0 ? <MinimalDuplexPage1 data={data} /> : <MinimalDuplexPage2 data={data} />;
}
