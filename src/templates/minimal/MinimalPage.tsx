import type { CSSProperties } from "react";
import type { ResumeData } from "../../types";
import { rich } from "../kit";

export function MinimalPage({ data }: { data: ResumeData }) {
  const { header, profile, stack, education, experience, projects, footer } = data;

  return (
    <div className="tpl-page t-minimal" style={{ "--blue": data.theme.accent } as CSSProperties}>
      <div className="tpl-flow">
        <header className="mn-head" data-panel="identity">
          <div className="mn-top">
            <span>
              RESUME / <b>{data.strip.date}</b> — {data.strip.sheet}
            </span>
            <span>{header.status.slice(0, 2).join(" · ")}</span>
          </div>

          <h1 className="mn-name">{header.nameZh}</h1>

          <div className="mn-sub">
            <span className="mn-latin">{header.nameEn}</span>
            <span className="mn-title">
              {header.titleZh} / {header.titleEn}
            </span>
          </div>

          <div className="mn-contacts">
            {header.contacts.map((c, i) => (
              <div key={i}>
                <b>{c.label}</b>
                <span>{c.value}</span>
              </div>
            ))}
          </div>
        </header>

        <div className="mn-body">
          <aside className="mn-side">
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
          </aside>

          <main className="mn-main">
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
          </main>
        </div>

        <div className="mn-foot">
          <span>
            {footer.plateTop} · {footer.product}
          </span>
          <span>
            PAGE <b>01 / 01</b> · {footer.copyright}
          </span>
        </div>
      </div>
    </div>
  );
}
