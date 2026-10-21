/* ------------------------------------------------------------------
   Quiet Spec — palette-card spec sheet.
   Ported from variants/resume-03-quiet.html at its PRINT scale
   (root 7.42pt ⇒ rem values re-expressed in pt/mm; page = .tpl-page A4).
   Every selector is scoped under `.t-quiet`; internal classes are `.qt-*`.
   Accent (--blue) only carries numbers, 1px rules, 3px dots and hover.
------------------------------------------------------------------- */
export const QUIET_CSS = String.raw`
.t-quiet{
  --qt-paper:#F2F3EC;
  --qt-ink:#111111;
  --qt-smoke:#707070;
  --qt-grey:#6A6A6A;          /* secondary copy: same hue, nudged for contrast */
  --qt-grey2:#8E8E99;
  --qt-line:rgba(112,112,112,.34);
  --qt-line2:rgba(112,112,112,.55);
  --qt-disp:"Helvetica Neue","HelveticaNeue","Avenir Next",Helvetica,Arial,sans-serif;
  --qt-cn:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  --qt-mono:"SF Mono",ui-monospace,Menlo,Monaco,"Courier New",monospace;
  position:relative;
  padding:12mm 15.9mm;
  background:var(--qt-paper);
  color:var(--qt-ink);
  font-family:var(--qt-cn);
  font-size:7.42pt;
  line-height:1.5;
  overflow:hidden;
  overflow-wrap:break-word;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  print-color-adjust:exact;
  -webkit-print-color-adjust:exact;
}
.t-quiet{box-sizing:border-box}
.t-quiet *{box-sizing:border-box;margin:0;padding:0}
.t-quiet .tpl-flow{gap:0}
.t-quiet .tpl-flow > *{min-width:0}

/* ── kicker strip + hero lockup ─────────────────────────────────── */
.t-quiet .qt-top{flex:0 0 auto;position:relative}
.t-quiet .qt-mast{
  display:flex;align-items:baseline;justify-content:space-between;gap:5mm;
  padding-bottom:1.4mm;border-bottom:1px solid var(--blue);
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.14em;
  text-transform:uppercase;color:var(--qt-grey);
}
.t-quiet .qt-mast > *{white-space:nowrap}
.t-quiet .qt-who{display:flex;align-items:center;gap:1.4mm;min-width:0;overflow:hidden}
.t-quiet .qt-who b{font-weight:500;color:var(--qt-ink);letter-spacing:.16em}
.t-quiet .qt-who .qt-cn{font-family:var(--qt-cn);letter-spacing:.18em;color:var(--qt-grey)}
.t-quiet .qt-mid{color:var(--qt-grey2)}
.t-quiet .qt-chip{display:block;width:1.1mm;height:1.1mm;background:var(--blue);flex:0 0 auto}

.t-quiet .qt-hero{
  display:grid;
  grid-template-columns:minmax(0,8fr) minmax(0,4fr);
  column-gap:3.9mm;
  align-items:end;
  padding:2.6mm 0 2mm;
}
.t-quiet .qt-hero-type{grid-column:1;grid-row:1;min-width:0}
.t-quiet .qt-tt{transform:scaleX(.82);transform-origin:left top}
.t-quiet .qt-tt h1,.t-quiet .qt-doc{
  display:block;
  font-family:var(--qt-disp);font-weight:500;font-size:19.3mm;
  line-height:.76;letter-spacing:-.028em;color:var(--qt-ink);
  white-space:nowrap;
}
.t-quiet .qt-tt h1 span{display:block}
.t-quiet .qt-hero-cap{
  display:flex;align-items:center;flex-wrap:wrap;gap:2mm;
  margin-top:3.2mm;font-size:7.42pt;letter-spacing:.06em;color:var(--qt-ink);
}
.t-quiet .qt-hero-cap .qt-chip{width:1.3mm;height:1.3mm}
.t-quiet .qt-hero-cap .qt-en{
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.14em;
  text-transform:uppercase;color:var(--qt-grey);
}
.t-quiet .qt-hero-meta{
  grid-column:2;grid-row:1;
  display:flex;flex-direction:column;justify-content:flex-end;gap:1.5mm;min-width:0;
}
.t-quiet .qt-avail{
  display:flex;align-items:baseline;justify-content:space-between;gap:2.5mm;
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.13em;
  text-transform:uppercase;color:var(--qt-grey);line-height:1.4;
}
.t-quiet .qt-avail b{font-weight:500;color:var(--qt-ink)}
.t-quiet .qt-contacts{display:flex;flex-direction:column;border-top:1px solid var(--qt-line2);min-width:0}
.t-quiet .qt-contact{
  display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:3mm;
  align-items:baseline;padding:1mm 0;border-bottom:1px solid var(--qt-line);
}
.t-quiet .qt-contact dt{
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.16em;
  text-transform:uppercase;color:var(--qt-grey);line-height:1;
}
.t-quiet .qt-contact dd{
  font-family:var(--qt-mono);font-size:6.4pt;letter-spacing:-.005em;line-height:1.25;
  color:var(--qt-ink);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}

/* ── section band: rail + body ─────────────────────────────────── */
.t-quiet .qt-band{
  display:grid;grid-template-columns:minmax(0,3fr) minmax(0,9fr);
  column-gap:3.9mm;
  border-top:1px solid var(--blue);
  padding:2.3mm 0 2.1mm;
  flex:0 0 auto;
}
.t-quiet .qt-rail{
  display:flex;flex-direction:column;gap:.8mm;
  border-right:1px solid var(--qt-line);padding-right:3.9mm;min-width:0;
}
.t-quiet .qt-id{display:flex;align-items:baseline;gap:1.2mm}
.t-quiet .qt-num{
  font-family:var(--qt-disp);font-weight:500;font-size:7pt;
  letter-spacing:.04em;line-height:1;
  color:var(--blue);
  color:color-mix(in srgb,var(--blue) 72%,var(--qt-ink));
}
.t-quiet .qt-num::after{content:"."}
.t-quiet .qt-rail h2,.t-quiet .qt-cellhead h2{
  font-family:var(--qt-disp);font-weight:500;font-size:7.9pt;letter-spacing:.11em;
  line-height:1;color:var(--qt-ink);text-transform:uppercase;white-space:nowrap;
}
.t-quiet .qt-rail .qt-cn,.t-quiet .qt-cellhead .qt-cn{
  font-size:5.9pt;letter-spacing:.2em;color:var(--qt-grey);white-space:nowrap;
}
.t-quiet .qt-meta{
  margin-top:1.8mm;font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.1em;
  text-transform:uppercase;color:var(--qt-grey);line-height:1.55;
}
.t-quiet .qt-meta span{display:block}
.t-quiet .qt-body{min-width:0}

/* 01 profile */
.t-quiet .qt-intro{display:grid;grid-template-columns:minmax(0,1fr) 30mm;align-items:stretch}
.t-quiet .qt-intro--solo{grid-template-columns:minmax(0,1fr)}
.t-quiet .qt-lede{
  font-size:7.9pt;line-height:1.88;letter-spacing:.015em;color:#1A1A1A;
  padding-right:3.9mm;border-right:1px solid var(--qt-line);
}
.t-quiet .qt-intro--solo .qt-lede{padding-right:0;border-right:0}
.t-quiet .qt-lede b{font-family:var(--qt-mono);font-size:6.4pt;font-weight:500;color:var(--qt-ink)}
.t-quiet .qt-stats{display:grid;gap:.9mm;align-content:start;padding-left:3.9mm}
.t-quiet .qt-stat{display:flex;align-items:baseline;justify-content:flex-end;gap:1.5mm}
.t-quiet .qt-stat b{
  font-family:var(--qt-disp);font-weight:500;font-size:11pt;line-height:1;
  letter-spacing:.01em;color:var(--qt-ink);
}
.t-quiet .qt-stat span{
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.14em;
  text-transform:uppercase;color:var(--qt-grey);min-width:11mm;text-align:left;
}

/* 02 experience */
.t-quiet .qt-job + .qt-job{margin-top:2.15mm}
.t-quiet .qt-job-h{
  display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:2.5mm;
  padding-bottom:.95mm;border-bottom:1px solid var(--qt-line2);
}
.t-quiet .qt-job-h h3{display:inline;font-size:7.42pt;font-weight:600;letter-spacing:.05em;color:var(--qt-ink)}
.t-quiet .qt-co{
  margin-left:1.5mm;font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.1em;
  text-transform:uppercase;color:var(--qt-grey);
}
.t-quiet .qt-date{
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.08em;
  color:var(--qt-ink);white-space:nowrap;
}
.t-quiet .qt-bul{list-style:none;margin-top:1.5mm;display:grid;gap:.78mm}
.t-quiet .qt-bul li{
  position:relative;padding-left:2.6mm;
  font-size:7.42pt;line-height:1.68;letter-spacing:.01em;color:#1A1A1A;
}
.t-quiet .qt-bul li::before{
  content:"";position:absolute;left:0;top:.6em;
  width:.8mm;height:.8mm;background:var(--blue);
}
.t-quiet .qt-bul b{
  font-family:var(--qt-mono);font-size:6.4pt;font-weight:500;
  letter-spacing:-.01em;color:var(--qt-ink);white-space:nowrap;
}

/* 03 selected work */
.t-quiet .qt-work{list-style:none}
.t-quiet .qt-work li{
  display:grid;grid-template-columns:7mm 26mm minmax(0,1fr) auto;
  column-gap:3.2mm;row-gap:.5mm;align-items:baseline;
  padding:.95mm 0;border-bottom:1px solid var(--qt-line);
  transition:background-color .25s ease;
}
.t-quiet .qt-work li:last-child{border-bottom:0}
.t-quiet .qt-work li:hover{background-color:color-mix(in srgb,var(--blue) 8%,transparent)}
.t-quiet .qt-wk-n{font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.08em;color:var(--qt-grey)}
.t-quiet .qt-wk-name{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.t-quiet .qt-wk-name b{
  font-family:var(--qt-disp);font-weight:500;font-size:6.5pt;letter-spacing:.055em;
  color:var(--qt-ink);text-transform:uppercase;
}
.t-quiet .qt-wk-kind{
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.1em;
  text-transform:uppercase;color:var(--qt-grey);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.t-quiet .qt-wk-m{
  font-family:var(--qt-mono);font-size:6.4pt;letter-spacing:.01em;
  color:var(--qt-ink);text-align:right;white-space:nowrap;
}
.t-quiet .qt-wk-desc{
  grid-column:2 / -1;font-size:6.4pt;line-height:1.32;letter-spacing:.01em;
  color:var(--qt-grey);
}

/* 04 | 05 dual cell band (palette card lower half) */
.t-quiet .qt-band-pair{display:block;border-top:1px solid var(--blue);padding:2.3mm 0 2.1mm;flex:0 0 auto}
.t-quiet .qt-pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.t-quiet .qt-cell{min-width:0}
.t-quiet .qt-cell:first-child{padding-right:5mm;border-right:1px solid var(--qt-line)}
.t-quiet .qt-cell:last-child{padding-left:5mm}
.t-quiet .qt-cellhead{display:flex;align-items:baseline;gap:1.2mm;margin-bottom:2.2mm}
.t-quiet .qt-cellhead .qt-cn{margin-left:.4mm}

.t-quiet .qt-spec{display:grid}
.t-quiet .qt-row{
  display:grid;grid-template-columns:17mm minmax(0,1fr);align-items:baseline;gap:2.5mm;
  padding:.58mm 0;border-bottom:1px solid var(--qt-line);
}
.t-quiet .qt-row:last-child{border-bottom:0;padding-bottom:0}
.t-quiet .qt-row dt{
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.16em;
  text-transform:uppercase;color:var(--qt-grey);
}
.t-quiet .qt-row dd{
  font-family:var(--qt-mono);font-size:6.4pt;letter-spacing:.005em;color:var(--qt-ink);
  text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.t-quiet .qt-skills{
  display:grid;grid-template-columns:17mm repeat(4,minmax(0,1fr));column-gap:3mm;
  align-items:start;
  margin-top:1.5mm;padding-top:1.3mm;border-top:1px solid var(--qt-line2);
}
.t-quiet .qt-skills-k{
  font-family:var(--qt-mono);font-size:5.4pt;letter-spacing:.16em;
  text-transform:uppercase;color:var(--qt-grey);align-self:start;
}
.t-quiet .qt-skill{display:flex;flex-direction:column;gap:.7mm;min-width:0}
.t-quiet .qt-skill > span:first-child{
  font-family:var(--qt-mono);font-size:5.4pt;letter-spacing:.12em;
  text-transform:uppercase;color:var(--qt-grey);white-space:nowrap;
}
.t-quiet .qt-track{position:relative;display:block;height:.6mm;background:var(--qt-line)}
.t-quiet .qt-track i{position:absolute;left:0;top:0;bottom:0;display:block;background:var(--qt-ink)}

.t-quiet .qt-edu{
  display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:2.5mm;
  padding-bottom:.95mm;border-bottom:1px solid var(--qt-line2);
}
.t-quiet .qt-edu h3{display:inline;font-size:7.42pt;font-weight:600;letter-spacing:.05em;color:var(--qt-ink)}
.t-quiet .qt-edu .qt-en{
  margin-left:1.5mm;font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.1em;
  text-transform:uppercase;color:var(--qt-grey);
}
.t-quiet .qt-edu .qt-date{text-align:right}
.t-quiet .qt-edu-sub{margin-top:1mm;font-size:6.4pt;color:var(--qt-grey)}
.t-quiet .qt-certs{list-style:none;margin-top:1.8mm;display:grid;gap:1.1mm}
.t-quiet .qt-certs li{
  display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:2.5mm;
  font-family:var(--qt-mono);font-size:6.4pt;line-height:1.4;letter-spacing:.005em;
  color:#1A1A1A;
}
.t-quiet .qt-cert-y{font-size:5.9pt;letter-spacing:.1em;color:var(--qt-grey)}

/* ── footer: real colour card ──────────────────────────────────── */
.t-quiet .qt-foot{
  flex:0 0 auto;margin-top:auto;
  border-top:1px solid var(--blue);
  padding-top:2.1mm;
}
.t-quiet .qt-flow{
  display:flex;align-items:baseline;justify-content:space-between;gap:4mm;
  margin-bottom:1mm;
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.13em;
  text-transform:uppercase;
}
.t-quiet .qt-flow-label{color:var(--qt-grey);white-space:nowrap}
.t-quiet .qt-flow-steps{
  display:flex;align-items:center;gap:.9mm;flex:0 1 auto;
  color:var(--qt-ink);white-space:nowrap;overflow:hidden;
}
.t-quiet .qt-step + .qt-step::before{
  content:"";display:inline-block;width:.8mm;height:.8mm;
  background:var(--blue);margin-right:.9mm;vertical-align:.05em;
}
.t-quiet .qt-flow-tag{color:var(--qt-grey);white-space:nowrap}
.t-quiet .qt-colophon{
  display:flex;align-items:baseline;justify-content:space-between;gap:4mm;
  margin-bottom:1mm;
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.12em;
  text-transform:uppercase;color:var(--qt-grey);
}
.t-quiet .qt-colophon > *{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.t-quiet .qt-colophon .qt-mid{color:var(--qt-grey2)}
.t-quiet .qt-sw-foot{
  display:flex;align-items:baseline;justify-content:space-between;gap:4mm;
  margin-top:1mm;
  font-family:var(--qt-mono);font-size:5.9pt;letter-spacing:.12em;
  text-transform:uppercase;color:var(--qt-grey);
}
.t-quiet .qt-sw-foot > *{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.t-quiet .qt-sig{font-family:var(--qt-cn);letter-spacing:.16em;color:var(--qt-ink)}
`;
