import type { CSSProperties } from "react";
import type { ResumeData } from "../../types";
import { rich, splitKicker } from "../kit";

type Contact = ResumeData["header"]["contacts"][number];

/** 按标签关键字取联系方式（数据里的 label 是 MAIL / TEL / SITE / GIT 之类）。 */
function contactValue(contacts: Contact[], keys: string[]): string {
  const hit = contacts.find((c) => keys.some((k) => c.label.toUpperCase().includes(k)));
  return (hit?.value ?? "").trim();
}

/** 胶囊只放短状态：取 status 里最长不超过 18 字符的一条。 */
function shortStatus(status: string[]): string {
  const usable = status.map((s) => s.trim()).filter(Boolean);
  const latin = usable.find((s) => s.length <= 18 && /^[A-Za-z0-9 /&.+-]+$/.test(s));
  return latin ?? usable.find((s) => s.length <= 18) ?? usable[0] ?? "";
}

/** 所在地：优先取带「·」或逗号的地区条目，其次按标签找。 */
function baseLine(status: string[], contacts: Contact[]): string {
  const geo = status.map((s) => s.trim()).find((s) => /[·,]/.test(s));
  return geo ?? contactValue(contacts, ["CITY", "BASE", "LOCATION", "城市", "地点"]);
}

/** 信笺抬头：姓名 + 拉丁名，右侧是机构与部门。 */
function Band({ data }: { data: ResumeData }) {
  return (
    <>
      <header className="lh-band" data-panel="identity">
        <div className="lh-band-l">
          <h1>{data.header.nameZh}</h1>
          <span className="lh-band-en">{data.header.nameEn}</span>
        </div>
        <div className="lh-band-r">
          <div className="lh-band-brand">{data.header.brand}</div>
          <div className="lh-band-sub">{data.header.brandSub}</div>
        </div>
      </header>
      <div className="lh-hair" />
    </>
  );
}

/** 信息卡：与信笺同样的 2×2 标签 / 值栅格，右下是状态胶囊。 */
function Card({ data }: { data: ResumeData }) {
  const { header, flags } = data;
  const mail = contactValue(header.contacts, ["MAIL", "EMAIL", "邮"]);
  const tel = contactValue(header.contacts, ["TEL", "PHONE", "电"]);
  const base = baseLine(header.status, header.contacts);

  return (
    <section className="lh-card" data-panel="identity">
      <div className="lh-f">
        <div className="lh-k">{flags.showYears ? "工作年限 / Experience" : "电话 / Tel"}</div>
        <div className="lh-v">
          {flags.showYears ? (
            <>
              {header.years.value} {header.years.label}
            </>
          ) : (
            tel || "—"
          )}
        </div>
      </div>
      <div className="lh-f">
        <div className="lh-k">所在地 / Based in</div>
        <div className="lh-v">{base || "—"}</div>
      </div>
      <div className="lh-f">
        <div className="lh-k">邮箱 / Email</div>
        <div className="lh-v">{mail || tel || "—"}</div>
      </div>
      <div className="lh-f">
        <div className="lh-k">当前状态 / Status</div>
        <div className="lh-v">
          <span className="lh-pill">{shortStatus(header.status) || "OPEN"}</span>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ kicker, zh, meta }: { kicker: string; zh: string; meta?: string }) {
  return (
    <div className="lh-sec-h">
      <span className="lh-kicker">{kicker}</span>
      <h3>{zh}</h3>
      {meta ? <span className="lh-sec-meta">{meta}</span> : null}
    </div>
  );
}

function LetterheadBody({
  data,
  page = 0,
  duplex = false,
  dense = false,
}: {
  data: ResumeData;
  page?: number;
  duplex?: boolean;
  dense?: boolean;
}) {
  const { header, profile, experience, projects, stack, education, flow, footer, strip, flags } = data;

  const [profileEn, profileZh] = splitKicker(profile.kicker);
  const [stackEn, stackZh] = splitKicker(stack.kicker);
  const [certEn, certZh] = splitKicker(education.kicker);

  const showResume = page === 0 || !duplex;
  const appendixPage = duplex && page === 1;
  /* 密排是单页变体：项目回正文；疏朗版只在双页附录出现。 */
  const showAppendix = dense ? !duplex : appendixPage;

  const site = contactValue(header.contacts, ["SITE", "WEB", "主页"]);
  const git = contactValue(header.contacts, ["GIT", "CODE"]);
  const tel = contactValue(header.contacts, ["TEL", "PHONE", "电"]);
  const mail = contactValue(header.contacts, ["MAIL", "EMAIL", "邮"]);
  const brandLine = [tel, mail, site, git].filter(Boolean);

  const stackSection = (
    <section data-panel="stack" key="stack">
      <SectionHead kicker={stackEn} zh={stackZh} meta={stack.no} />
      <div className="lh-spec">
        {stack.groups.map((g, i) => (
          <div className="lh-spec-row" key={i}>
            <span className="lh-spec-k">{g.k}</span>
            <span className="lh-spec-v">{g.v}</span>
          </div>
        ))}
      </div>
      <div className="lh-skills">
        {stack.skills.map((s, i) => (
          <div className="lh-skill" key={i}>
            <div className="lh-skill-h">
              <span>{s.label}</span>
              <span>{String(Math.max(0, Math.min(10, s.level))).padStart(2, "0")}</span>
            </div>
            <span className="lh-track">
              <i style={{ width: `${Math.max(0, Math.min(10, s.level)) * 10}%` }} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );

  const skillsSection = (
    <section data-panel="stack" key="skills">
      <SectionHead kicker="LEVEL" zh="熟练度" meta={stack.no} />
      <div className="lh-skills lh-skills--full">
        {stack.skills.map((s, i) => (
          <div className="lh-skill" key={i}>
            <div className="lh-skill-h">
              <span>{s.label}</span>
              <span>{String(Math.max(0, Math.min(10, s.level))).padStart(2, "0")}</span>
            </div>
            <span className="lh-track">
              <i style={{ width: `${Math.max(0, Math.min(10, s.level)) * 10}%` }} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );

  const eduSection = (
    <section data-panel="education" key="education">
      <SectionHead kicker={certEn} zh={certZh} meta={education.no} />
      <div className="lh-edu-h">
        <div>
          <h4>{education.school}</h4>
          <div className="lh-edu-meta">{education.schoolMeta}</div>
        </div>
        <span className="lh-date">{education.date}</span>
      </div>
      <p className="lh-edu-deg">{education.degree}</p>
      <ul className="lh-certs">
        {education.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );

  const flowBlock = flags.showFlow ? (
    <section className="lh-sec lh-flow-sec" data-panel="flow">
      <SectionHead kicker={flow.label} zh="工作流程" meta={flow.tag} />
      <div className="lh-steps">
        {flow.steps.map((step, i) => (
          <span className="lh-step" key={i}>
            {step}
          </span>
        ))}
      </div>
    </section>
  ) : null;

  /* 单页：技术栈与教育并列。
     双页：第 1 页技术栈，第 2 页教育 + 熟练度 + 流程。 */
  const renderStackEdu = () => {
    if (!duplex) {
      return (
        <>
          <div className="lh-rule" />
          <div className="lh-pair">
            {stackSection}
            {eduSection}
          </div>
        </>
      );
    }
    if (page === 0) {
      return (
        <>
          <div className="lh-rule" />
          {stackSection}
        </>
      );
    }
    return (
      <>
        <div className="lh-rule" />
        <div className="lh-pair">
          {eduSection}
          {skillsSection}
        </div>
        {flowBlock}
      </>
    );
  };

  return (
    <div
      className={`tpl-page t-letterhead${dense ? " lh-dense" : ""}${duplex ? " lh-duplex" : ""}`}
      style={{ "--blue": data.theme.accent } as CSSProperties}
    >
      <div className="tpl-flow">
        <Band data={data} />

        <div className="lh-body">
          <div className="lh-meta-row">
            <span className="lh-eyebrow">{header.tag}</span>
            <span className="lh-stamp">
              {strip.date} · {duplex ? `SHEET 0${page + 1} / 02` : strip.sheet}
            </span>
          </div>

          <div className="lh-hero">
            <h2>{header.titleZh}</h2>
            <div className="lh-hero-en">{header.titleEn}</div>
          </div>

          <Card data={data} />

          {duplex && page === 1 ? <p className="lh-lede lh-lede--appendix">{rich(profile.text)}</p> : null}

          {showResume ? (
            <section className="lh-sec" data-panel="profile">
              <div className="lh-rule" />
              {dense ? (
                /* 密排：简介做成一条带色条的摘要（不再占一个双语栏目标题），把数据也排在同一行右侧 */
                <div className="lh-brief">
                  <p className="lh-lede">{rich(profile.text)}</p>
                  {flags.showStats ? (
                    <div className="lh-brief-stats">
                      {profile.stats.map((s, i) => (
                        <span key={i}>
                          <b>{s.value}</b>
                          {s.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <SectionHead kicker={profileEn} zh={profileZh} meta={profile.no} />
                  <div className="lh-sec-body">
                    <p className="lh-lede">{rich(profile.text)}</p>
                    {flags.showStats ? (
                      <div className="lh-stats">
                        {profile.stats.map((s, i) => (
                          <div className="lh-stat" key={i}>
                            <b>{s.value}</b>
                            <span>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </section>
          ) : null}

          {showResume ? (
            <section className="lh-sec" data-panel="experience">
              <div className="lh-rule" />
              <SectionHead kicker={experience.title} zh={experience.zh} meta={experience.meta} />
              <div className="lh-sec-body">
                {experience.jobs.map((job, i) => (
                  <article className="lh-job" key={i}>
                    <div className="lh-job-h">
                      <div>
                        <h4>{job.roleZh}</h4>
                        <span className="lh-co">
                          {job.company} · {job.roleEn}
                        </span>
                      </div>
                      <span className="lh-date">{job.date}</span>
                    </div>
                    <ul className="lh-bul">
                      {job.bullets.map((b, j) => (
                        <li key={j}>{rich(b)}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {showAppendix ? (
            <section className="lh-sec" data-panel="projects">
              <div className="lh-rule" />
              <SectionHead kicker={projects.title} zh={projects.zh} meta={projects.meta} />
              <div className="lh-sec-body">
                <div className={dense || !duplex ? "lh-work" : "lh-work lh-work--air"}>
                  {projects.items.map((p, i) => (
                    <article className="lh-proj" key={i}>
                      <div className="lh-proj-h">
                        <span className="lh-code">{p.code}</span>
                        <b>{p.name}</b>
                        <span className="lh-kind">{p.kind}</span>
                      </div>
                      <p className="lh-proj-d">{rich(p.desc)}</p>
                      <div className="lh-proj-m">
                        {p.stats.map((s, j) => (
                          <span key={j}>
                            <i>{s.v}</i> {s.l}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {renderStackEdu()}
        </div>

        <footer className="lh-foot" data-panel="footer">
          <div className="lh-foot-l">
            <div className="lh-foot-note">{footer.copyright}</div>
            {brandLine.length > 0 ? (
              <div className="lh-foot-line lh-contacts">
                {brandLine.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
            ) : null}
            {flags.showFlow ? (
              <div className="lh-foot-line" data-panel="flow">
                {flow.label} · {flow.steps.join(" → ")}
              </div>
            ) : null}
          </div>
          <div className="lh-foot-r">
            <span className="lh-mark">
              <i className="lh-mark-t">{header.brand.slice(0, 1)}</i>
              {header.brand}
            </span>
            <span className="lh-sheet">{duplex ? `SHEET 0${page + 1} / 02` : footer.edgeR}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function LetterheadPage({
  data,
  page = 0,
  duplex = false,
  dense = false,
}: {
  data: ResumeData;
  page?: number;
  duplex?: boolean;
  dense?: boolean;
}) {
  /* 双页第 2 页 = 项目档案附录（项目 + 教育/技术栈，页脚与第 1 页共享）。 */
  if (duplex && page === 1) return <LetterheadBody data={data} page={1} duplex dense={dense} />;
  return <LetterheadBody data={data} page={0} duplex={duplex} dense={dense} />;
}