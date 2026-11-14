/* ------------------------------------------------------------------
   企业信笺 — scoped CSS. Every selector lives under .t-letterhead;
   the accent (--blue) comes from the document theme, not this file.
   设计语言：深色信笺抬头 + 主题色细线 + 全大写栏目标签 + 双语标题
            + 灰底信息卡（左侧竖色条）+ 状态胶囊 + 细规则线 + 竖线署名。
   Conventions: docs/template-authoring.md
------------------------------------------------------------------- */
export const LETTERHEAD_CSS = String.raw`
.t-letterhead{
  --lh-ink:#14161a;
  --lh-soft:#3b3d40;
  --lh-muted:#8b9096;
  --lh-faint:#b4b8be;
  --lh-hair:#e7e8ea;
  --lh-card:#f4f5f6;
  --lh-band:#101112;
  --lh-cn:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  --lh-mono:"SF Mono",Menlo,monospace;
  position:relative;
  box-sizing:border-box; /* PAGE_CSS scopes box-sizing to descendants only — the root needs its own */
  background:#fff;
  color:var(--lh-ink);
  font-family:var(--lh-cn);
  font-size:9pt;
  line-height:1.5;
  overflow:hidden;
  overflow-wrap:break-word;
  -webkit-font-smoothing:antialiased;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.t-letterhead *{box-sizing:border-box;margin:0;padding:0}
.t-letterhead ul,.t-letterhead ol{list-style:none}

/* ---------- 信笺抬头 ---------- */
.t-letterhead .lh-band{
  flex:0 0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8mm;
  height:21mm;
  padding:0 15mm;
  background:var(--lh-band);
  color:#fff;
}
.t-letterhead .lh-band-l{display:flex;align-items:baseline;gap:3.4mm;min-width:0}
.t-letterhead .lh-band-l h1{
  font-size:18pt;
  font-weight:800;
  letter-spacing:.02em;
  line-height:1;
  color:#fff;
  white-space:nowrap;
}
.t-letterhead .lh-band-en{
  font-family:var(--lh-mono);
  font-size:7pt;
  letter-spacing:.16em;
  color:rgba(255,255,255,.62);
  text-transform:uppercase;
  white-space:nowrap;
}
.t-letterhead .lh-band-r{flex:0 0 auto;text-align:right;line-height:1.5}
.t-letterhead .lh-band-brand{
  font-family:var(--lh-mono);
  font-size:7.2pt;
  font-weight:700;
  letter-spacing:.2em;
  color:#fff;
  text-transform:uppercase;
}
.t-letterhead .lh-band-sub{
  font-size:7.2pt;
  letter-spacing:.04em;
  color:rgba(255,255,255,.5);
}
.t-letterhead .lh-hair{flex:0 0 auto;height:1.5mm;background:var(--blue)}

/* ---------- 版面 ---------- */
.t-letterhead .lh-body{
  /* 自然高度参与流式排版：内容超高由 .tpl-flow 如实上报（见 authoring 指南 §3 溢出） */
  flex:0 0 auto;
  display:block;
  padding:7.6mm 15mm 0;
}
.t-letterhead .lh-meta-row{
  flex:0 0 auto;
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap:8mm;
}
.t-letterhead .lh-eyebrow{
  font-family:var(--lh-mono);
  font-size:7.8pt;
  font-weight:700;
  letter-spacing:.24em;
  text-transform:uppercase;
  color:var(--blue);
}
.t-letterhead .lh-stamp{
  font-family:var(--lh-mono);
  font-size:7.6pt;
  letter-spacing:.1em;
  color:var(--lh-faint);
  white-space:nowrap;
}

.t-letterhead .lh-hero{flex:0 0 auto;margin-top:1.4mm}
.t-letterhead .lh-hero h2{
  font-size:14.5pt;
  font-weight:800;
  letter-spacing:.02em;
  line-height:1.12;
  color:var(--lh-ink);
}
.t-letterhead .lh-hero-en{
  margin-top:1mm;
  font-size:8.6pt;
  letter-spacing:.04em;
  text-transform:uppercase;
  color:var(--lh-muted);
}

/* ---------- 信息卡 ---------- */
.t-letterhead .lh-card{
  flex:0 0 auto;
  margin-top:4mm;
  background:var(--lh-card);
  border-left:1.5mm solid var(--blue);
  padding:2.9mm 5.4mm 2.9mm 5mm;
  display:grid;
  grid-template-columns:1fr 1.1fr 1.35fr 1fr;
  row-gap:0;
  column-gap:6mm;
}
.t-letterhead .lh-f{min-width:0}
.t-letterhead .lh-k{
  font-size:6.8pt;
  letter-spacing:.03em;
  color:var(--lh-muted);
  margin-bottom:.7mm;
}
.t-letterhead .lh-v{
  font-size:8.6pt;
  font-weight:700;
  line-height:1.25;
  color:var(--lh-ink);
}
.t-letterhead .lh-pill{
  display:inline-block;
  max-width:100%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  padding:.7mm 3mm;
  border-radius:.8mm;
  background:var(--blue);
  color:#fff;
  font-size:8pt;
  font-weight:700;
  letter-spacing:.04em;
}

/* ---------- 分节 ---------- */
.t-letterhead .lh-rule{
  flex:0 0 auto;
  height:1px;
  background:var(--lh-hair);
  margin:2.9mm 0 0;
}
.t-letterhead .lh-sec{flex:0 0 auto;padding-top:3.2mm}
.t-letterhead .lh-sec-h{
  display:flex;
  align-items:baseline;
  gap:3.2mm;
  padding-left:3mm;
  border-left:1.9mm solid var(--blue);
}
.t-letterhead .lh-kicker{
  font-family:var(--lh-mono);
  font-size:7.2pt;
  font-weight:700;
  letter-spacing:.2em;
  text-transform:uppercase;
  color:var(--blue);
}
.t-letterhead .lh-sec-h h3{
  font-size:11pt;
  font-weight:800;
  letter-spacing:.03em;
  color:var(--lh-ink);
  line-height:1.1;
}
.t-letterhead .lh-sec-meta{
  margin-left:auto;
  font-family:var(--lh-mono);
  font-size:6.9pt;
  letter-spacing:.08em;
  color:var(--lh-faint);
  white-space:nowrap;
}
.t-letterhead .lh-sec-body{padding-top:2mm}

.t-letterhead .lh-lede{
  font-size:8.7pt;
  line-height:1.7;
  color:var(--lh-soft);
}
.t-letterhead .lh-lede b{
  font-family:var(--lh-mono);
  font-weight:700;
  color:var(--blue);
}
.t-letterhead .lh-stats{
  display:flex;
  gap:7mm;
  margin-top:1.6mm;
}
.t-letterhead .lh-stat{display:flex;align-items:baseline;gap:1.8mm}
.t-letterhead .lh-stat b{
  font-family:var(--lh-mono);
  font-size:10.5pt;
  font-weight:700;
  color:var(--lh-ink);
  line-height:1;
}
.t-letterhead .lh-stat span{
  font-size:6.9pt;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:var(--lh-muted);
}

/* ---------- 工作经历 ---------- */
.t-letterhead .lh-job{padding-top:2.2mm}
.t-letterhead .lh-job:first-child{padding-top:0}
.t-letterhead .lh-job-h{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap:6mm;
}
.t-letterhead .lh-job-h h4{
  font-size:9.8pt;
  font-weight:800;
  color:var(--lh-ink);
  line-height:1.25;
}
.t-letterhead .lh-co{
  display:block;
  margin-top:.7mm;
  font-size:7.8pt;
  color:var(--lh-muted);
  letter-spacing:.02em;
}
.t-letterhead .lh-date{
  flex:0 0 auto;
  font-family:var(--lh-mono);
  font-size:6.9pt;
  letter-spacing:.06em;
  color:var(--lh-faint);
  white-space:nowrap;
}
.t-letterhead .lh-bul{
  margin-top:1.4mm;
  display:flex;
  flex-direction:column;
  gap:.5mm;
}
.t-letterhead .lh-bul li{
  position:relative;
  padding-left:3.2mm;
  font-size:8.3pt;
  line-height:1.45;
  color:var(--lh-soft);
}
.t-letterhead .lh-bul li::before{
  content:"";
  position:absolute;
  left:0;
  top:1.7mm;
  width:1.3mm;
  height:1.3mm;
  background:var(--blue);
  opacity:.85;
}
.t-letterhead .lh-bul b{
  font-family:var(--lh-mono);
  font-weight:700;
  color:var(--blue);
}

/* ---------- 双栏 ---------- */
.t-letterhead .lh-pair{
  flex:0 0 auto;
  display:grid;
  grid-template-columns:1fr 1fr;
  column-gap:8mm;
  padding-top:3mm;
}
.t-letterhead .lh-pair .lh-sec-h{padding-left:3mm;border-left-width:1.8mm}
.t-letterhead .lh-spec{margin-top:2mm}
.t-letterhead .lh-spec-row{
  display:flex;
  gap:3.4mm;
  padding:.72mm 0;
  border-bottom:1px solid var(--lh-hair);
}
.t-letterhead .lh-spec-row:last-child{border-bottom:0}
.t-letterhead .lh-spec-k{
  flex:0 0 17mm;
  font-family:var(--lh-mono);
  font-size:6.8pt;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:var(--lh-muted);
  padding-top:.5mm;
}
.t-letterhead .lh-spec-v{font-size:8.2pt;line-height:1.45;color:var(--lh-soft)}

.t-letterhead .lh-skills{
  margin-top:2mm;
  display:grid;
  grid-template-columns:1fr 1fr;
  column-gap:6mm;
  row-gap:.9mm;
}
.t-letterhead .lh-skill{margin-top:0}
.t-letterhead .lh-skill:first-child{margin-top:0}
.t-letterhead .lh-skill-h{
  display:flex;
  justify-content:space-between;
  font-family:var(--lh-mono);
  font-size:7pt;
  letter-spacing:.1em;
  color:var(--lh-muted);
  margin-bottom:.9mm;
}
.t-letterhead .lh-track{display:block;height:1.1mm;background:var(--lh-hair)}
.t-letterhead .lh-track i{display:block;height:100%;background:var(--blue)}

.t-letterhead .lh-edu-h{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap:4mm;
  margin-top:2mm;
}
.t-letterhead .lh-edu-h h4{font-size:9.4pt;font-weight:800;color:var(--lh-ink)}
.t-letterhead .lh-edu-meta{
  margin-top:.6mm;
  font-size:7.8pt;
  color:var(--lh-muted);
}
.t-letterhead .lh-edu-deg{margin-top:1.4mm;font-size:8.2pt;color:var(--lh-soft)}
.t-letterhead .lh-certs{margin-top:1.6mm;display:flex;flex-direction:column;gap:.9mm}
.t-letterhead .lh-certs li{
  position:relative;
  padding-left:3mm;
  font-size:7.9pt;
  line-height:1.45;
  color:var(--lh-soft);
}
.t-letterhead .lh-certs li::before{
  content:"";
  position:absolute;
  left:0;
  top:1.7mm;
  width:1.3mm;
  height:1.3mm;
  background:var(--blue);
  opacity:.6;
}

/* ---------- 项目档案 ---------- */
.t-letterhead .lh-work{display:flex;flex-direction:column;gap:3.4mm}
.t-letterhead .lh-work--air{gap:6.6mm}
.t-letterhead .lh-work--air .lh-proj-d{margin-top:1.5mm}
.t-letterhead .lh-work--air .lh-proj-m{margin-top:1.3mm}
.t-letterhead .lh-proj{
  border-left:1.2mm solid var(--lh-hair);
  padding-left:3.6mm;
}
.t-letterhead .lh-proj-h{
  display:flex;
  align-items:baseline;
  gap:2.6mm;
}
.t-letterhead .lh-proj-h b{font-size:10pt;font-weight:800;color:var(--lh-ink)}
.t-letterhead .lh-code{
  font-family:var(--lh-mono);
  font-size:7.2pt;
  letter-spacing:.1em;
  color:var(--blue);
}
.t-letterhead .lh-kind{
  margin-left:auto;
  font-family:var(--lh-mono);
  font-size:7pt;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--lh-faint);
  white-space:nowrap;
}
.t-letterhead .lh-proj-d{
  margin-top:1.2mm;
  font-size:8.8pt;
  line-height:1.6;
  color:var(--lh-soft);
}
.t-letterhead .lh-proj-d b{
  font-family:var(--lh-mono);
  font-weight:700;
  color:var(--blue);
}
.t-letterhead .lh-proj-m{
  margin-top:1mm;
  display:flex;
  gap:4mm;
  font-family:var(--lh-mono);
  font-size:7.2pt;
  color:var(--lh-muted);
}
.t-letterhead .lh-proj-m i{font-style:normal;color:var(--blue)}

/* 附录页：教育/熟练度同栏、流程 chips、附录引言 */
.t-letterhead .lh-skills--full{
  grid-template-columns:1fr 1fr;
  margin-top:2.6mm;
}
.t-letterhead .lh-flow-sec{padding-top:6mm}
.t-letterhead .lh-steps{
  display:flex;
  flex-wrap:wrap;
  gap:1.6mm;
  margin-top:2.6mm;
}
.t-letterhead .lh-step{
  font-family:var(--lh-mono);
  font-size:6.8pt;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--lh-soft);
  padding:1.2mm 2.6mm;
  border:1px solid var(--lh-hair);
  border-radius:.8mm;
}
.t-letterhead .lh-step:last-child{border-color:var(--blue);color:var(--blue)}
.t-letterhead .lh-lede--appendix{
  margin-top:5mm;
  font-size:8.9pt;
  line-height:1.72;
  color:var(--lh-soft);
}

/* ---------- 页脚 ---------- */
.t-letterhead .lh-foot{
  flex:0 0 auto;
  margin-top:auto;
  padding:2mm 15mm 5.4mm;
  border-top:1px solid var(--lh-hair);
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:8mm;
}
.t-letterhead .lh-foot-l{min-width:0;flex:1 1 auto}
.t-letterhead .lh-contacts{display:flex;flex-wrap:wrap;column-gap:3.4mm;row-gap:.2mm}
.t-letterhead .lh-contacts span{white-space:nowrap}
.t-letterhead .lh-foot-note{
  font-size:6.4pt;
  line-height:1.5;
  color:var(--lh-faint);
}
.t-letterhead .lh-foot-line{
  margin-top:.6mm;
  font-family:var(--lh-mono);
  font-size:6.4pt;
  letter-spacing:.05em;
  color:var(--lh-muted);
  word-break:normal;
}
.t-letterhead .lh-foot-r{flex:0 0 auto;display:flex;align-items:center;gap:2.4mm}
.t-letterhead .lh-mark{
  display:flex;
  align-items:center;
  gap:1.8mm;
  font-family:var(--lh-mono);
  font-size:7.4pt;
  font-weight:700;
  letter-spacing:.16em;
  color:var(--lh-ink);
  text-transform:uppercase;
}
.t-letterhead .lh-mark-t{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:4.4mm;
  height:4.4mm;
  background:var(--blue);
  color:#fff;
  font-style:normal;
  font-size:7pt;
  font-weight:700;
  letter-spacing:0;
  border-radius:.8mm;
}
.t-letterhead .lh-sheet{
  font-family:var(--lh-mono);
  font-size:7pt;
  letter-spacing:.1em;
  color:var(--lh-faint);
  white-space:nowrap;
}

/* ---------- 密排版（.lh-dense）：信息更全，但靠版面结构而不是缩字号来省空间 ----------
   正文 8.0pt / 1.48 行距，分节留白 3.2mm（比紧凑版更松）；
   技术栈改两列、技能压成一行，把高度让给项目区。 */
.t-letterhead.lh-dense .lh-band{height:16mm;padding:0 14mm}
.t-letterhead.lh-dense .lh-band-l h1{font-size:17pt}
.t-letterhead.lh-dense .lh-band-en{font-size:6.8pt;letter-spacing:.15em}
.t-letterhead.lh-dense .lh-band-brand{font-size:6.9pt}
.t-letterhead.lh-dense .lh-band-sub{font-size:6.7pt}
.t-letterhead.lh-dense .lh-hair{height:1.4mm}

.t-letterhead.lh-dense .lh-body{padding:6.4mm 14mm 0}
.t-letterhead.lh-dense .lh-eyebrow{font-size:7.3pt;letter-spacing:.21em}
.t-letterhead.lh-dense .lh-stamp{font-size:6.8pt}
.t-letterhead.lh-dense .lh-hero{margin-top:1.2mm}
.t-letterhead.lh-dense .lh-hero h2{font-size:13.5pt;line-height:1.1}
.t-letterhead.lh-dense .lh-hero-en{margin-top:.9mm;font-size:8.2pt}

.t-letterhead.lh-dense .lh-card{margin-top:2.8mm;padding:2.3mm 4.8mm 2.3mm 4.4mm;column-gap:6mm}
.t-letterhead.lh-dense .lh-k{font-size:6.6pt;margin-bottom:.6mm}
.t-letterhead.lh-dense .lh-v{font-size:8.4pt;line-height:1.25}
.t-letterhead.lh-dense .lh-pill{padding:.6mm 2.6mm;font-size:7.6pt;border-radius:.7mm}

/* 分节留白比紧凑版更松，是“不挤”的主要来源 */
.t-letterhead.lh-dense .lh-rule{margin:3mm 0 0}
.t-letterhead.lh-dense .lh-sec{padding-top:3.2mm}
.t-letterhead.lh-dense .lh-sec-h{padding-left:2.8mm;border-left:1.8mm solid var(--blue);gap:3mm}
.t-letterhead.lh-dense .lh-kicker{font-size:7.1pt;letter-spacing:.18em}
.t-letterhead.lh-dense .lh-sec-h h3{font-size:10.2pt}
.t-letterhead.lh-dense .lh-sec-meta{font-size:6.7pt}
.t-letterhead.lh-dense .lh-sec-body{padding-top:1.9mm}
.t-letterhead.lh-dense .lh-lede{font-size:8.3pt;line-height:1.56}
.t-letterhead.lh-dense .lh-stats{margin-top:1.6mm;gap:6.6mm}
.t-letterhead.lh-dense .lh-stat b{font-size:10pt}
.t-letterhead.lh-dense .lh-stat span{font-size:6.6pt}

.t-letterhead.lh-dense .lh-job{padding-top:1.8mm}
.t-letterhead.lh-dense .lh-job-h h4{font-size:9.2pt}
.t-letterhead.lh-dense .lh-co{margin-top:.5mm;font-size:7.6pt}
.t-letterhead.lh-dense .lh-date{font-size:6.7pt}
.t-letterhead.lh-dense .lh-bul{margin-top:1.1mm;gap:.5mm}
.t-letterhead.lh-dense .lh-bul li{padding-left:3mm;font-size:8pt;line-height:1.44}
.t-letterhead.lh-dense .lh-bul li::before{top:1.55mm;width:1.2mm;height:1.2mm}

.t-letterhead.lh-dense .lh-pair{grid-template-columns:1.18fr 1fr;column-gap:7mm;padding-top:2.8mm}
.t-letterhead.lh-dense .lh-pair .lh-sec-h{padding-left:2.6mm;border-left-width:1.6mm}
/* 技术栈两列，省一半高度 */
.t-letterhead.lh-dense .lh-spec{
  margin-top:1.7mm;
  display:block;
}
.t-letterhead.lh-dense .lh-spec-row{padding:.62mm 0;gap:3mm;border-bottom:1px solid var(--lh-hair)}
.t-letterhead.lh-dense .lh-spec-k{flex:0 0 12.5mm;font-size:6.4pt}
.t-letterhead.lh-dense .lh-spec-v{font-size:7.9pt;line-height:1.42}

/* 密排简介：一条带色条的摘要，右侧同排数据 */
.t-letterhead.lh-dense .lh-brief{
  display:flex;
  gap:9mm;
  align-items:flex-start;
  padding-left:3mm;
  border-left:1.8mm solid var(--blue);
  padding-top:.4mm;
}
.t-letterhead.lh-dense .lh-brief .lh-lede{flex:1 1 auto;min-width:0}
.t-letterhead.lh-dense .lh-brief-stats{
  flex:0 0 auto;
  display:flex;
  flex-direction:column;
  gap:.5mm;
  text-align:right;
  font-family:var(--lh-mono);
  font-size:6.2pt;
  letter-spacing:.06em;
  color:var(--lh-muted);
}
.t-letterhead.lh-dense .lh-brief-stats b{
  margin-right:1.6mm;
  font-size:8.2pt;
  color:var(--lh-ink);
}

/* 技能：一行内联 */
.t-letterhead.lh-dense .lh-skills{
  display:flex;
  flex-wrap:wrap;
  gap:1.4mm 5mm;
  margin-top:2.4mm;
}
.t-letterhead.lh-dense .lh-skill{display:flex;align-items:baseline;gap:1.4mm}
.t-letterhead.lh-dense .lh-skill-h{font-size:6.7pt;margin-bottom:0;gap:1.4mm}
.t-letterhead.lh-dense .lh-track{display:none}

.t-letterhead.lh-dense .lh-edu-h{margin-top:2mm}
.t-letterhead.lh-dense .lh-edu-h h4{font-size:9pt}
.t-letterhead.lh-dense .lh-edu-meta{font-size:7.2pt}
.t-letterhead.lh-dense .lh-edu-deg{margin-top:1.1mm;font-size:8pt}
.t-letterhead.lh-dense .lh-certs{margin-top:1.2mm;gap:.55mm}
.t-letterhead.lh-dense .lh-certs li{padding-left:2.7mm;font-size:7.6pt;line-height:1.42}

/* 项目：两列网格 */
.t-letterhead.lh-dense .lh-work{
  display:grid;
  grid-template-columns:1fr 1fr;
  column-gap:8mm;
  row-gap:2.4mm;
}
.t-letterhead.lh-dense .lh-proj{padding-left:3mm;border-left-width:1.1mm}
.t-letterhead.lh-dense .lh-proj-h{flex-wrap:wrap;row-gap:.4mm;gap:2.2mm}
.t-letterhead.lh-dense .lh-proj-h b{font-size:8.9pt}
.t-letterhead.lh-dense .lh-code{font-size:6.6pt}
.t-letterhead.lh-dense .lh-kind{font-size:6.2pt;letter-spacing:.07em;white-space:normal;text-align:right}
.t-letterhead.lh-dense .lh-proj-d{margin-top:.85mm;font-size:7.9pt;line-height:1.44}
.t-letterhead.lh-dense .lh-proj-m{margin-top:.6mm;gap:3.4mm;font-size:6.6pt}


.t-letterhead.lh-dense .lh-foot{padding:1.3mm 14mm 4.2mm}
.t-letterhead.lh-dense .lh-foot-note{font-size:6.2pt}
.t-letterhead.lh-dense .lh-foot-line{font-size:6.2pt}
.t-letterhead.lh-dense .lh-mark{font-size:6.6pt}
.t-letterhead.lh-dense .lh-mark-t{width:3.9mm;height:3.9mm;font-size:6pt}
.t-letterhead.lh-dense .lh-sheet{font-size:6.2pt}
.t-letterhead.lh-dense .lh-steps{gap:1.2mm;margin-top:1.8mm}
.t-letterhead.lh-dense .lh-step{font-size:6.2pt;padding:.8mm 2.1mm}
`;