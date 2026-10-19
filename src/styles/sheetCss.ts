/* ------------------------------------------------------------------
   Resume sheet — design language: industrial die-cut labels.
   Ported 1:1 from the static template (cobalt #2F52E0 / paper white /
   1px black hairlines / registration marks / barcode / outlined type).
   Scoped to `.sheet` so the editor chrome stays independent.
------------------------------------------------------------------- */
export const SHEET_CSS = String.raw`
:root{--blue:#2F52E0;
    --ink:#000;
    --paper:#fff;
    --cn:"HarmonyOS Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
    --disp:"DIN Condensed","Avenir Next Condensed","Arial Narrow",Impact,sans-serif;
    --mono:"SF Mono",Menlo,"PT Mono",Monaco,monospace;
    --sans:"Helvetica Neue","HarmonyOS Sans SC","PingFang SC",Arial,sans-serif;
    --hair:1px;
    --star:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><g stroke='%23000' stroke-width='1.7' stroke-linecap='square'><path d='M6 0.6V11.4'/><path d='M1.3 3.2L10.7 8.8'/><path d='M10.7 3.2L1.3 8.8'/></g></svg>");
    --reg:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><g fill='%23000'><rect x='0' y='0' width='3.6' height='3.6'/><rect x='8.4' y='0' width='3.6' height='3.6'/><rect x='4.2' y='4.2' width='3.6' height='3.6'/><rect x='0' y='8.4' width='3.6' height='3.6'/><rect x='8.4' y='8.4' width='3.6' height='3.6'/></g></svg>");}
.sheet, .sheet *{margin:0;padding:0;box-sizing:border-box}
/* ============ SHEET ============ */ .sheet{position:relative;
    width:210mm;height:297mm;
    background:var(--paper);color:var(--ink);
    padding:8mm 9mm 7mm;
    overflow:hidden;
    display:flex;flex-direction:column;
    gap:4mm;
    font-family:var(--sans);
    font-size:7.6pt;line-height:1.5;
    box-shadow:0 1px 0 rgba(0,0,0,.14),0 26px 70px rgba(0,0,0,.22);
    print-color-adjust:exact;-webkit-print-color-adjust:exact;}
.sheet > .reg{position:absolute;width:2.6mm;height:2.6mm}
.sheet > .reg.tl{left:3mm;top:3mm}
.sheet > .reg.tr{right:3mm;top:3mm}
.sheet > .reg.bl{left:3mm;bottom:3mm}
.sheet > .reg.br{right:3mm;bottom:3mm}
/* ============ PRIMITIVES ============ */ .mono{font-family:var(--mono);font-size:5.5pt;letter-spacing:.07em;text-transform:uppercase;line-height:1.35}
.cn{font-family:var(--cn)}
.disp{font-family:var(--disp);font-weight:bold;line-height:.84}
.blue{color:var(--blue)}
.star{display:inline-block;width:1.6mm;height:1.6mm;background:var(--blue);-webkit-mask:var(--star) center/contain no-repeat;mask:var(--star) center/contain no-repeat;vertical-align:-.1mm;margin-right:1mm}
.reg{display:block;width:2.4mm;height:2.4mm;background:var(--ink);-webkit-mask:var(--reg) center/contain no-repeat;mask:var(--reg) center/contain no-repeat}
.reg.inv{background:#fff}
.hair{height:var(--hair);background:var(--ink)}
/* ============ TOP STRIP ============ */ .strip{display:flex;align-items:center;justify-content:space-between;
    height:4.2mm;flex:0 0 auto;
    font-family:var(--mono);font-size:5.1pt;letter-spacing:.09em;text-transform:uppercase;
    border-bottom:var(--hair) solid var(--ink);padding-bottom:1.2mm;}
.strip .l,.strip .r{display:flex;align-items:center;gap:5mm}
.strip b{font-weight:400;color:var(--blue)}
/* ============ ID CARD ============ */ .id-card{position:relative;flex:0 0 auto;
    border:1.2px solid var(--ink);border-radius:5mm;
    overflow:hidden;background:var(--paper);}
.id-band{position:relative;background:var(--blue);color:var(--paper);
    padding:3.6mm 5mm;
    display:flex;align-items:center;gap:4mm;height:26mm;}
.id-band .reg{position:absolute}
.id-band .reg.tr{right:2.4mm;top:2.2mm}
.id-band .reg.bl{left:2.4mm;bottom:2.2mm}
.brand{display:flex;align-items:center;gap:2mm;flex:0 0 auto}
.logomark{width:9.4mm;height:9.4mm;display:block}
.brand-txt{font-family:var(--mono);font-size:4.9pt;letter-spacing:.1em;line-height:1.5;text-transform:uppercase}
.brand-txt em{display:block;font-style:normal;opacity:.75;font-size:4.2pt;letter-spacing:.07em}
.id-name{flex:1 1 auto;display:flex;align-items:center;gap:2.6mm;padding-left:1mm}
.id-name .cn-name{font-family:var(--cn);font-weight:900;font-size:24pt;letter-spacing:.05em;line-height:1}
.id-name .tag{font-family:var(--mono);font-size:4.7pt;letter-spacing:.09em;text-transform:uppercase;
    border:1px solid rgba(255,255,255,.7);border-radius:1.4mm;padding:.6mm 1.5mm;white-space:nowrap;}
.id-title{flex:0 0 auto;text-align:right;padding-right:3.6mm}
.id-title .t-cn{font-family:var(--cn);font-weight:700;font-size:15pt;letter-spacing:.1em;line-height:1.1}
.id-title .t-en{font-family:var(--disp);font-size:10.6pt;letter-spacing:.2em;line-height:.95;opacity:.9;margin-top:.8mm}
.id-rule{height:2.4mm;background:var(--blue);margin-top:1.5mm}
.id-main{position:relative;
    display:flex;align-items:center;justify-content:space-between;gap:4mm;
    padding:3.9mm 5mm 3.6mm;height:26mm;}
.latin{font-family:var(--disp);font-weight:bold;font-size:30pt;line-height:.82;letter-spacing:.015em;color:var(--blue);white-space:nowrap}
.id-sub{display:flex;align-items:center;gap:1.8mm;margin-top:1.8mm;font-family:var(--mono);font-size:4.9pt;letter-spacing:.075em;text-transform:uppercase}
.yrs{flex:0 0 auto;width:14.5mm;height:14.5mm;border-radius:50%;background:var(--blue);color:var(--paper);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4mm;}
.yrs b{font-family:var(--disp);font-size:14pt;line-height:.78;letter-spacing:.02em}
.yrs span{font-family:var(--mono);font-size:3.9pt;letter-spacing:.12em;opacity:.85}
.id-meta{display:grid;grid-template-columns:auto auto;flex:0 0 auto;border-left:var(--hair) solid var(--ink)}
.id-meta > div{padding:1mm 0 1mm 3mm;min-width:30mm}
.id-meta > div:nth-child(2),.id-meta > div:nth-child(4){border-left:var(--hair) solid var(--ink);margin-left:3mm}
.id-meta > div:nth-child(n+3){border-top:var(--hair) solid var(--ink)}
.id-meta b{display:block;font-family:var(--mono);font-size:4.4pt;letter-spacing:.1em;color:var(--blue);font-weight:500}
.id-meta span{font-family:var(--mono);font-size:5.7pt;letter-spacing:.01em;white-space:nowrap}
.id-meta a{color:inherit;text-decoration:none}
.id-main .reg{position:absolute;right:2.2mm;top:2mm;opacity:.85}
/* ============ BODY COLUMNS ============ */ .cols{flex:1 1 auto;display:grid;grid-template-columns:62mm 1fr;gap:4.5mm;min-height:0}
.col{display:flex;flex-direction:column;gap:3.6mm;min-height:0}
.card{position:relative;border:1.2px solid var(--ink);border-radius:4.2mm;
    background:var(--paper);padding:3.2mm 3.4mm;overflow:hidden;flex:0 0 auto;}
.card.blue{background:var(--blue);border-color:var(--blue);color:var(--paper)}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:2mm;margin-bottom:2mm;height:5mm}
.card.blue .card-head{border-bottom:1px solid rgba(255,255,255,.45);padding-bottom:1.4mm;height:6.4mm}
.card-head .k{font-family:var(--mono);font-size:5pt;letter-spacing:.1em;text-transform:uppercase}
.card-head .n{font-family:var(--disp);font-size:8.6pt;letter-spacing:.16em}
/* profile */ .profile{display:flex;gap:2.6mm;align-items:flex-start}
.pixel{width:6.4mm;height:6.4mm;flex:0 0 auto;margin-top:.4mm}
.profile p{font-family:var(--cn);font-size:7.05pt;line-height:1.72;letter-spacing:.01em;flex:1 1 auto}
.pstats{display:grid;grid-template-columns:repeat(3,1fr);margin-top:2.4mm;border-top:1px solid rgba(255,255,255,.5);padding-top:1.9mm;gap:2mm}
.pstats b{display:block;font-family:var(--disp);font-size:13pt;line-height:.8;letter-spacing:.02em}
.pstats span{display:block;font-family:var(--mono);font-size:4.3pt;letter-spacing:.1em;opacity:.8;margin-top:.8mm}
/* spec rows */ .spec{display:flex;flex-direction:column}
.spec-row{display:grid;grid-template-columns:11mm 1fr;gap:1.4mm;align-items:baseline;padding:1.32mm 0;border-bottom:1px dotted rgba(0,0,0,.42)}
.spec-row:last-child{border-bottom:0;padding-bottom:0}
.spec-row .k{font-family:var(--mono);font-size:4.3pt;letter-spacing:.05em;color:var(--blue)}
.spec-row .v{font-family:var(--mono);font-size:5.85pt;letter-spacing:0;line-height:1.32;white-space:nowrap}
.bars{margin-top:2.1mm;display:flex;flex-direction:column;gap:1.1mm}
.bar{display:grid;grid-template-columns:8.6mm 1fr;align-items:center;gap:1.4mm}
.bar .lbl{font-family:var(--mono);font-size:4.4pt;letter-spacing:.03em}
.bar .track{display:flex;gap:.5mm}
.bar .track i{flex:1;height:1.35mm;background:#D6DCFA}
.bar .track i.on{background:var(--blue)}
/* credentials */ .edu-item .h{display:flex;align-items:baseline;justify-content:space-between;gap:2mm}
.edu-item .h b{font-family:var(--cn);font-size:8.2pt;font-weight:700;letter-spacing:.02em}
.edu-item .h span{font-family:var(--mono);font-size:4.7pt;letter-spacing:.03em;color:var(--blue);white-space:nowrap}
.edu-item .s{font-family:var(--mono);font-size:5.2pt;letter-spacing:.05em;text-transform:uppercase;margin-top:.6mm}
.edu-item .d{font-family:var(--cn);font-size:6.2pt;margin-top:.7mm;color:#1a1a1a}
.cred{display:flex;flex-direction:column;gap:1mm;margin-top:2mm;padding-top:1.8mm;border-top:var(--hair) solid var(--ink)}
.cred div{font-family:var(--mono);font-size:5.1pt;letter-spacing:.01em;display:flex;gap:1.5mm;line-height:1.4}
.cred div::before{content:"";width:1.2mm;height:1.2mm;background:var(--blue);flex:0 0 auto;margin-top:.45mm}
/* ============ SECTION HEAD ============ */ .sec{display:flex;flex-direction:column;gap:2mm}
.sec-head{display:flex;align-items:center;gap:2.2mm;height:5.8mm}
.sec-head .num{font-family:var(--disp);font-size:8.6pt;line-height:1;
    background:var(--blue);color:var(--paper);
    width:5.4mm;height:5.4mm;display:grid;place-items:center;border-radius:1.1mm;letter-spacing:.02em;}
.sec-head h2{font-family:var(--disp);font-size:12pt;letter-spacing:.15em;line-height:1;font-weight:bold}
.sec-head .zh{font-family:var(--cn);font-size:7pt;font-weight:700;letter-spacing:.15em;color:var(--blue);white-space:nowrap}
.sec-head .rule{flex:1 1 auto;height:var(--hair);background:var(--ink);position:relative}
.sec-head .rule::after{content:"";position:absolute;right:0;top:-.65mm;width:1.4mm;height:1.4mm;background:var(--blue)}
.sec-head .meta{font-family:var(--mono);font-size:4.6pt;letter-spacing:.07em;white-space:nowrap}
/* ============ JOB ============ */ .job{border:1.2px solid var(--ink);border-radius:3.2mm;overflow:hidden;background:var(--paper);flex:0 0 auto}
.job-band{position:relative;background:var(--blue);color:var(--paper);
    display:flex;align-items:center;gap:3mm;height:8.2mm;padding:0 3.2mm;}
.job-band .idx{font-family:var(--disp);font-size:10.4pt;line-height:1;letter-spacing:.05em;opacity:.95;width:5.6mm}
.job-band .role{display:flex;align-items:baseline;gap:1.8mm;flex:0 0 auto}
.job-band .role b{font-family:var(--cn);font-size:8.5pt;font-weight:700;letter-spacing:.05em;white-space:nowrap}
.job-band .role span{font-family:var(--disp);font-size:7.1pt;letter-spacing:.17em;opacity:.82;white-space:nowrap}
.job-band .co{flex:1 1 auto;text-align:right;font-family:var(--mono);font-size:4.9pt;letter-spacing:.05em;text-transform:uppercase;opacity:.92;white-space:nowrap}
.job-band .date{flex:0 0 auto;font-family:var(--mono);font-size:5.2pt;letter-spacing:.04em;border-left:1px solid rgba(255,255,255,.55);padding-left:2.2mm;white-space:nowrap}
.bul{list-style:none;padding:1.85mm 3.2mm;display:flex;flex-direction:column;gap:.95mm}
.bul li{position:relative;padding-left:3mm;font-family:var(--cn);font-size:7.05pt;line-height:1.45;letter-spacing:.005em}
.bul li::before{content:"";position:absolute;left:0;top:1.25mm;width:1.4mm;height:1.4mm;background:var(--blue)}
.bul li b{font-weight:500;font-family:var(--mono);font-size:6.1pt;letter-spacing:0;color:var(--blue);white-space:nowrap}
/* ============ PROJECTS ============ */ .proj-grid{display:grid;grid-template-columns:1fr 1fr;gap:2.4mm}
.proj{border:1.2px solid var(--ink);border-radius:2.8mm;overflow:hidden;background:var(--paper)}
.proj-band{background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:2mm;padding:1.3mm 2.4mm;height:6mm}
.proj-band b{font-family:var(--disp);font-size:8pt;letter-spacing:.09em;line-height:1}
.proj-band span{font-family:var(--mono);font-size:4.4pt;letter-spacing:.07em;opacity:.82;white-space:nowrap}
.proj-body{padding:1.55mm 2.4mm 1.75mm}
.proj-body .kind{font-family:var(--mono);font-size:4.2pt;letter-spacing:.08em;color:var(--blue);text-transform:uppercase}
.proj-body .desc{font-family:var(--cn);font-size:6.1pt;line-height:1.42;margin-top:.65mm;color:#111}
.proj-body .nums{display:flex;gap:2.4mm;margin-top:1.2mm;padding-top:1.1mm;border-top:1px dotted rgba(0,0,0,.45);font-family:var(--mono);font-size:4.8pt;letter-spacing:.01em}
.proj-body .nums b{font-weight:400;color:var(--blue)}
/* ============ FLOW STRIP ============ */ .flow{flex:0 0 auto;border-top:var(--hair) solid var(--ink);border-bottom:var(--hair) solid var(--ink);
    display:flex;align-items:center;justify-content:space-between;gap:3mm;height:9.4mm;padding:0 .5mm;overflow:hidden;}
.flow .lab{font-family:var(--mono);font-size:4.5pt;letter-spacing:.1em;color:var(--blue);white-space:nowrap}
.flow .steps{display:flex;align-items:center;gap:1.9mm;font-family:var(--disp);font-size:8.6pt;letter-spacing:.1em;line-height:1;white-space:nowrap;flex:0 1 auto;overflow:hidden}
.flow .steps i{display:block;width:1.35mm;height:1.35mm;background:var(--blue);flex:0 0 auto;margin:0 1.9mm 0 0}
.flow .tag{font-family:var(--mono);font-size:4.2pt;letter-spacing:.05em;border:1px solid var(--ink);border-radius:1mm;padding:.45mm 1.2mm;white-space:nowrap}
/* ============ FOOTER ============ */ .foot{flex:0 0 auto;display:flex;flex-direction:column;gap:1.3mm}
.foot-top{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:4.6pt;letter-spacing:.08em;text-transform:uppercase;color:var(--blue)}
.foot-band{position:relative;background:var(--blue);color:#fff;border-radius:3.4mm;
    height:32mm;overflow:hidden;display:flex;align-items:center;}
.foot-word{position:absolute;left:2.6mm;top:50%;transform:translateY(calc(-50% + 5.3mm));
    font-family:var(--disp);font-weight:bold;font-size:108pt;line-height:.72;letter-spacing:.005em;
    color:transparent;-webkit-text-stroke:1.25px var(--paper);
    white-space:nowrap;}
.foot-right{position:relative;margin-left:auto;margin-right:3.6mm;display:flex;align-items:flex-start;gap:3mm;z-index:2}
.foot-barcode{width:32mm;background:#fff;padding:1.3mm 1.5mm 1.1mm;border-radius:.7mm}
.foot-barcode .bars{height:5.4mm;background:repeating-linear-gradient(90deg,var(--ink) 0 .32mm,transparent .32mm .64mm,var(--ink) .64mm .94mm,transparent .94mm 1.36mm);margin-bottom:.8mm}
.foot-barcode .num{font-family:var(--mono);font-size:4.2pt;letter-spacing:.15em;color:var(--blue);text-align:center}
.foot-sig{font-family:var(--mono);font-size:4.4pt;line-height:1.6;letter-spacing:.07em;text-transform:uppercase;opacity:.88;text-align:right;padding-top:.8mm}
.foot .reg{position:absolute;right:2.4mm;bottom:2.2mm}
.foot-plate{position:absolute;left:3.2mm;top:3.2mm;z-index:2;background:#fff;border-radius:.7mm;
    padding:1.2mm 1.8mm;color:var(--blue);display:flex;flex-direction:column;gap:.5mm;}
.foot-plate b{font-family:var(--disp);font-size:7pt;letter-spacing:.12em;line-height:1}
.foot-plate span{font-family:var(--mono);font-size:3.9pt;letter-spacing:.07em;line-height:1}
/* edge labels */ .edge{position:absolute;top:0;bottom:0;width:9mm;display:flex;align-items:center;justify-content:center;pointer-events:none}
.edge span{font-family:var(--mono);font-size:4.4pt;letter-spacing:.32em;text-transform:uppercase;
    writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;color:var(--blue);}
.edge.r span{transform:none;color:#000;opacity:.5}
/* ============ PRINT / RESPONSIVE ============ */ @page{size:A4 portrait;margin:0}
`

/* Page shell used only by the exported / published standalone HTML. */
export const EXPORT_PAGE_CSS = String.raw`
@page{size:A4 portrait;margin:0}
html,body{background:#dedfd9}
body{margin:0;padding:28px 16px 64px;display:flex;justify-content:center;align-items:flex-start;-webkit-font-smoothing:antialiased}
.sheet{box-shadow:0 1px 0 rgba(0,0,0,.14),0 26px 70px rgba(0,0,0,.22)}
@media print{
  html,body{background:#fff}
  body{padding:0;display:block}
  .sheet{box-shadow:none;margin:0}
}
@media screen and (max-width:880px){body{padding:10px 8px 40px}.sheet{zoom:.68}}
@media screen and (max-width:640px){.sheet{zoom:.46}}
`
