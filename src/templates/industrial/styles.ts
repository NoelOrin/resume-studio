/* ------------------------------------------------------------------
   Industrial label template — ported 1:1 from the static resume,
   fully scoped under `.t-industrial` so templates never collide.
------------------------------------------------------------------- */
export const INDUSTRIAL_CSS = String.raw`
.t-industrial{position:relative;--blue:#2F52E0;
    --ink:#000;
    --paper:#fff;
    --cn:"HarmonyOS Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
    --disp:"DIN Condensed","Avenir Next Condensed","Arial Narrow",Impact,sans-serif;
    --mono:"SF Mono",Menlo,"PT Mono",Monaco,monospace;
    --sans:"Helvetica Neue","HarmonyOS Sans SC","PingFang SC",Arial,sans-serif;
    --hair:1px;
    --star:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><g stroke='%23000' stroke-width='1.7' stroke-linecap='square'><path d='M6 0.6V11.4'/><path d='M1.3 3.2L10.7 8.8'/><path d='M10.7 3.2L1.3 8.8'/></g></svg>");
    --reg:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><g fill='%23000'><rect x='0' y='0' width='3.6' height='3.6'/><rect x='8.4' y='0' width='3.6' height='3.6'/><rect x='4.2' y='4.2' width='3.6' height='3.6'/><rect x='0' y='8.4' width='3.6' height='3.6'/><rect x='8.4' y='8.4' width='3.6' height='3.6'/></g></svg>");}
.t-industrial, .t-industrial *{box-sizing:border-box;margin:0;padding:0}
.t-industrial{position:relative;position:relative;
    
    background:var(--paper);color:var(--ink);
    padding:8mm 9mm 7mm;
    overflow:hidden;
    display:flex;flex-direction:column;
    gap:4mm;
    font-family:var(--sans);
    font-size:7.6pt;line-height:1.5;
    
    print-color-adjust:exact;-webkit-print-color-adjust:exact;}
.t-industrial > .reg{position:absolute;width:2.6mm;height:2.6mm}
.t-industrial > .reg.tl{left:3mm;top:3mm}
.t-industrial > .reg.tr{right:3mm;top:3mm}
.t-industrial > .reg.bl{left:3mm;bottom:3mm}
.t-industrial > .reg.br{right:3mm;bottom:3mm}
.t-industrial .mono{font-family:var(--mono);font-size:5.5pt;letter-spacing:.07em;text-transform:uppercase;line-height:1.35}
.t-industrial .cn{font-family:var(--cn)}
.t-industrial .disp{font-family:var(--disp);font-weight:bold;line-height:.84}
.t-industrial .blue{color:var(--blue)}
.t-industrial .star{display:inline-block;width:1.6mm;height:1.6mm;background:var(--blue);-webkit-mask:var(--star) center/contain no-repeat;mask:var(--star) center/contain no-repeat;vertical-align:-.1mm;margin-right:1mm}
.t-industrial .reg{display:block;width:2.4mm;height:2.4mm;background:var(--ink);-webkit-mask:var(--reg) center/contain no-repeat;mask:var(--reg) center/contain no-repeat}
.t-industrial .reg.inv{background:#fff}
.t-industrial .hair{height:var(--hair);background:var(--ink)}
.t-industrial .strip{display:flex;align-items:center;justify-content:space-between;
    height:4.2mm;flex:0 0 auto;
    font-family:var(--mono);font-size:5.1pt;letter-spacing:.09em;text-transform:uppercase;
    border-bottom:var(--hair) solid var(--ink);padding-bottom:1.2mm;}
.t-industrial .strip .l,.strip .r{display:flex;align-items:center;gap:5mm}
.t-industrial .strip b{font-weight:400;color:var(--blue)}
.t-industrial .id-card{position:relative;flex:0 0 auto;
    border:1.2px solid var(--ink);border-radius:5mm;
    overflow:hidden;background:var(--paper);}
.t-industrial .id-band{position:relative;background:var(--blue);color:var(--paper);
    padding:3.6mm 5mm;
    display:flex;align-items:center;gap:4mm;height:26mm;}
.t-industrial .id-band .reg{position:absolute}
.t-industrial .id-band .reg.tr{right:2.4mm;top:2.2mm}
.t-industrial .id-band .reg.bl{left:2.4mm;bottom:2.2mm}
.t-industrial .brand{display:flex;align-items:center;gap:2mm;flex:0 0 auto}
.t-industrial .logomark{width:9.4mm;height:9.4mm;display:block}
.t-industrial .brand-txt{font-family:var(--mono);font-size:4.9pt;letter-spacing:.1em;line-height:1.5;text-transform:uppercase}
.t-industrial .brand-txt em{display:block;font-style:normal;opacity:.75;font-size:4.2pt;letter-spacing:.07em}
.t-industrial .id-name{flex:1 1 auto;display:flex;align-items:center;gap:2.6mm;padding-left:1mm}
.t-industrial .id-name .cn-name{font-family:var(--cn);font-weight:900;font-size:24pt;letter-spacing:.05em;line-height:1}
.t-industrial .id-name .tag{font-family:var(--mono);font-size:4.7pt;letter-spacing:.09em;text-transform:uppercase;
    border:1px solid rgba(255,255,255,.7);border-radius:1.4mm;padding:.6mm 1.5mm;white-space:nowrap;}
.t-industrial .id-title{flex:0 0 auto;text-align:right;padding-right:3.6mm}
.t-industrial .id-title .t-cn{font-family:var(--cn);font-weight:700;font-size:15pt;letter-spacing:.1em;line-height:1.1}
.t-industrial .id-title .t-en{font-family:var(--disp);font-size:10.6pt;letter-spacing:.2em;line-height:.95;opacity:.9;margin-top:.8mm}
.t-industrial .id-rule{height:2.4mm;background:var(--blue);margin-top:1.5mm}
.t-industrial .id-main{position:relative;
    display:flex;align-items:center;justify-content:space-between;gap:4mm;
    padding:3.9mm 5mm 3.6mm;height:26mm;}
.t-industrial .latin{font-family:var(--disp);font-weight:bold;font-size:30pt;line-height:.82;letter-spacing:.015em;color:var(--blue);white-space:nowrap}
.t-industrial .id-sub{display:flex;align-items:center;gap:1.8mm;margin-top:1.8mm;font-family:var(--mono);font-size:4.9pt;letter-spacing:.075em;text-transform:uppercase}
.t-industrial .yrs{flex:0 0 auto;width:14.5mm;height:14.5mm;border-radius:50%;background:var(--blue);color:var(--paper);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4mm;}
.t-industrial .yrs b{font-family:var(--disp);font-size:14pt;line-height:.78;letter-spacing:.02em}
.t-industrial .yrs span{font-family:var(--mono);font-size:3.9pt;letter-spacing:.12em;opacity:.85}
.t-industrial .id-meta{display:grid;grid-template-columns:auto auto;flex:0 0 auto;border-left:var(--hair) solid var(--ink)}
.t-industrial .id-meta > div{padding:1mm 0 1mm 3mm;min-width:30mm}
.t-industrial .id-meta > div:nth-child(2),.id-meta > div:nth-child(4){border-left:var(--hair) solid var(--ink);margin-left:3mm}
.t-industrial .id-meta > div:nth-child(n+3){border-top:var(--hair) solid var(--ink)}
.t-industrial .id-meta b{display:block;font-family:var(--mono);font-size:4.4pt;letter-spacing:.1em;color:var(--blue);font-weight:500}
.t-industrial .id-meta span{font-family:var(--mono);font-size:5.7pt;letter-spacing:.01em;white-space:nowrap}
.t-industrial .id-meta a{color:inherit;text-decoration:none}
.t-industrial .id-main .reg{position:absolute;right:2.2mm;top:2mm;opacity:.85}
.t-industrial .cols{flex:1 1 auto;display:grid;grid-template-columns:62mm 1fr;gap:4.5mm;min-height:0}
.t-industrial .col{display:flex;flex-direction:column;gap:3.6mm;min-height:0}
.t-industrial .card{position:relative;border:1.2px solid var(--ink);border-radius:4.2mm;
    background:var(--paper);padding:3.2mm 3.4mm;overflow:hidden;flex:0 0 auto;}
.t-industrial .card.blue{background:var(--blue);border-color:var(--blue);color:var(--paper)}
.t-industrial .card-head{display:flex;align-items:center;justify-content:space-between;gap:2mm;margin-bottom:2mm;height:5mm}
.t-industrial .card.blue .card-head{border-bottom:1px solid rgba(255,255,255,.45);padding-bottom:1.4mm;height:6.4mm}
.t-industrial .card-head .k{font-family:var(--mono);font-size:5pt;letter-spacing:.1em;text-transform:uppercase}
.t-industrial .card-head .n{font-family:var(--disp);font-size:8.6pt;letter-spacing:.16em}
.t-industrial .profile{display:flex;gap:2.6mm;align-items:flex-start}
.t-industrial .pixel{width:6.4mm;height:6.4mm;flex:0 0 auto;margin-top:.4mm}
.t-industrial .profile p{font-family:var(--cn);font-size:7.05pt;line-height:1.72;letter-spacing:.01em;flex:1 1 auto}
.t-industrial .pstats{display:grid;grid-template-columns:repeat(3,1fr);margin-top:2.4mm;border-top:1px solid rgba(255,255,255,.5);padding-top:1.9mm;gap:2mm}
.t-industrial .pstats b{display:block;font-family:var(--disp);font-size:13pt;line-height:.8;letter-spacing:.02em}
.t-industrial .pstats span{display:block;font-family:var(--mono);font-size:4.3pt;letter-spacing:.1em;opacity:.8;margin-top:.8mm}
.t-industrial .spec{display:flex;flex-direction:column}
.t-industrial .spec-row{display:grid;grid-template-columns:11mm 1fr;gap:1.4mm;align-items:baseline;padding:1.32mm 0;border-bottom:1px dotted rgba(0,0,0,.42)}
.t-industrial .spec-row:last-child{border-bottom:0;padding-bottom:0}
.t-industrial .spec-row .k{font-family:var(--mono);font-size:4.3pt;letter-spacing:.05em;color:var(--blue)}
.t-industrial .spec-row .v{font-family:var(--mono);font-size:5.85pt;letter-spacing:0;line-height:1.32;white-space:nowrap}
.t-industrial .bars{margin-top:2.1mm;display:flex;flex-direction:column;gap:1.1mm}
.t-industrial .bar{display:grid;grid-template-columns:8.6mm 1fr;align-items:center;gap:1.4mm}
.t-industrial .bar .lbl{font-family:var(--mono);font-size:4.4pt;letter-spacing:.03em}
.t-industrial .bar .track{display:flex;gap:.5mm}
.t-industrial .bar .track i{flex:1;height:1.35mm;background:#D6DCFA}
.t-industrial .bar .track i.on{background:var(--blue)}
.t-industrial .edu-item .h{display:flex;align-items:baseline;justify-content:space-between;gap:2mm}
.t-industrial .edu-item .h b{font-family:var(--cn);font-size:8.2pt;font-weight:700;letter-spacing:.02em}
.t-industrial .edu-item .h span{font-family:var(--mono);font-size:4.7pt;letter-spacing:.03em;color:var(--blue);white-space:nowrap}
.t-industrial .edu-item .s{font-family:var(--mono);font-size:5.2pt;letter-spacing:.05em;text-transform:uppercase;margin-top:.6mm}
.t-industrial .edu-item .d{font-family:var(--cn);font-size:6.2pt;margin-top:.7mm;color:#1a1a1a}
.t-industrial .cred{display:flex;flex-direction:column;gap:1mm;margin-top:2mm;padding-top:1.8mm;border-top:var(--hair) solid var(--ink)}
.t-industrial .cred div{font-family:var(--mono);font-size:5.1pt;letter-spacing:.01em;display:flex;gap:1.5mm;line-height:1.4}
.t-industrial .cred div::before{content:"";width:1.2mm;height:1.2mm;background:var(--blue);flex:0 0 auto;margin-top:.45mm}
.t-industrial .sec{display:flex;flex-direction:column;gap:2mm}
.t-industrial .sec-head{display:flex;align-items:center;gap:2.2mm;height:5.8mm}
.t-industrial .sec-head .num{font-family:var(--disp);font-size:8.6pt;line-height:1;
    background:var(--blue);color:var(--paper);
    width:5.4mm;height:5.4mm;display:grid;place-items:center;border-radius:1.1mm;letter-spacing:.02em;}
.t-industrial .sec-head h2{font-family:var(--disp);font-size:12pt;letter-spacing:.15em;line-height:1;font-weight:bold}
.t-industrial .sec-head .zh{font-family:var(--cn);font-size:7pt;font-weight:700;letter-spacing:.15em;color:var(--blue);white-space:nowrap}
.t-industrial .sec-head .rule{flex:1 1 auto;height:var(--hair);background:var(--ink);position:relative}
.t-industrial .sec-head .rule::after{content:"";position:absolute;right:0;top:-.65mm;width:1.4mm;height:1.4mm;background:var(--blue)}
.t-industrial .sec-head .meta{font-family:var(--mono);font-size:4.6pt;letter-spacing:.07em;white-space:nowrap}
.t-industrial .job{border:1.2px solid var(--ink);border-radius:3.2mm;overflow:hidden;background:var(--paper);flex:0 0 auto}
.t-industrial .job-band{position:relative;background:var(--blue);color:var(--paper);
    display:flex;align-items:center;gap:3mm;height:8.2mm;padding:0 3.2mm;}
.t-industrial .job-band .idx{font-family:var(--disp);font-size:10.4pt;line-height:1;letter-spacing:.05em;opacity:.95;width:5.6mm}
.t-industrial .job-band .role{display:flex;align-items:baseline;gap:1.8mm;flex:0 0 auto}
.t-industrial .job-band .role b{font-family:var(--cn);font-size:8.5pt;font-weight:700;letter-spacing:.05em;white-space:nowrap}
.t-industrial .job-band .role span{font-family:var(--disp);font-size:7.1pt;letter-spacing:.17em;opacity:.82;white-space:nowrap}
.t-industrial .job-band .co{flex:1 1 auto;text-align:right;font-family:var(--mono);font-size:4.9pt;letter-spacing:.05em;text-transform:uppercase;opacity:.92;white-space:nowrap}
.t-industrial .job-band .date{flex:0 0 auto;font-family:var(--mono);font-size:5.2pt;letter-spacing:.04em;border-left:1px solid rgba(255,255,255,.55);padding-left:2.2mm;white-space:nowrap}
.t-industrial .bul{list-style:none;padding:1.85mm 3.2mm;display:flex;flex-direction:column;gap:.95mm}
.t-industrial .bul li{position:relative;padding-left:3mm;font-family:var(--cn);font-size:7.05pt;line-height:1.45;letter-spacing:.005em}
.t-industrial .bul li::before{content:"";position:absolute;left:0;top:1.25mm;width:1.4mm;height:1.4mm;background:var(--blue)}
.t-industrial .bul li b{font-weight:500;font-family:var(--mono);font-size:6.1pt;letter-spacing:0;color:var(--blue);white-space:nowrap}
.t-industrial .proj-grid{display:grid;grid-template-columns:1fr 1fr;gap:2.4mm}
.t-industrial .proj{border:1.2px solid var(--ink);border-radius:2.8mm;overflow:hidden;background:var(--paper)}
.t-industrial .proj-band{background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:2mm;padding:1.3mm 2.4mm;height:6mm}
.t-industrial .proj-band b{font-family:var(--disp);font-size:8pt;letter-spacing:.09em;line-height:1}
.t-industrial .proj-band span{font-family:var(--mono);font-size:4.4pt;letter-spacing:.07em;opacity:.82;white-space:nowrap}
.t-industrial .proj-body{padding:1.55mm 2.4mm 1.75mm}
.t-industrial .proj-body .kind{font-family:var(--mono);font-size:4.2pt;letter-spacing:.08em;color:var(--blue);text-transform:uppercase}
.t-industrial .proj-body .desc{font-family:var(--cn);font-size:6.1pt;line-height:1.42;margin-top:.65mm;color:#111}
.t-industrial .proj-body .nums{display:flex;gap:2.4mm;margin-top:1.2mm;padding-top:1.1mm;border-top:1px dotted rgba(0,0,0,.45);font-family:var(--mono);font-size:4.8pt;letter-spacing:.01em}
.t-industrial .proj-body .nums b{font-weight:400;color:var(--blue)}
.t-industrial .flow{flex:0 0 auto;border-top:var(--hair) solid var(--ink);border-bottom:var(--hair) solid var(--ink);
    display:flex;align-items:center;justify-content:space-between;gap:3mm;height:9.4mm;padding:0 .5mm;overflow:hidden;}
.t-industrial .flow .lab{font-family:var(--mono);font-size:4.5pt;letter-spacing:.1em;color:var(--blue);white-space:nowrap}
.t-industrial .flow .steps{display:flex;align-items:center;gap:1.9mm;font-family:var(--disp);font-size:8.6pt;letter-spacing:.1em;line-height:1;white-space:nowrap;flex:0 1 auto;overflow:hidden}
.t-industrial .flow .steps i{display:block;width:1.35mm;height:1.35mm;background:var(--blue);flex:0 0 auto;margin:0 1.9mm 0 0}
.t-industrial .flow .tag{font-family:var(--mono);font-size:4.2pt;letter-spacing:.05em;border:1px solid var(--ink);border-radius:1mm;padding:.45mm 1.2mm;white-space:nowrap}
.t-industrial .foot{flex:0 0 auto;display:flex;flex-direction:column;gap:1.3mm}
.t-industrial .foot-top{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:4.6pt;letter-spacing:.08em;text-transform:uppercase;color:var(--blue)}
.t-industrial .foot-band{position:relative;background:var(--blue);color:#fff;border-radius:3.4mm;
    height:32mm;overflow:hidden;display:flex;align-items:center;}
.t-industrial .foot-word{position:absolute;left:2.6mm;top:50%;transform:translateY(calc(-50% + 5.3mm));
    font-family:var(--disp);font-weight:bold;font-size:108pt;line-height:.72;letter-spacing:.005em;
    color:transparent;-webkit-text-stroke:1.25px var(--paper);
    white-space:nowrap;}
.t-industrial .foot-right{position:relative;margin-left:auto;margin-right:3.6mm;display:flex;align-items:flex-start;gap:3mm;z-index:2}
.t-industrial .foot-barcode{width:32mm;background:#fff;padding:1.3mm 1.5mm 1.1mm;border-radius:.7mm}
.t-industrial .foot-barcode .bars{height:5.4mm;background:repeating-linear-gradient(90deg,var(--ink) 0 .32mm,transparent .32mm .64mm,var(--ink) .64mm .94mm,transparent .94mm 1.36mm);margin-bottom:.8mm}
.t-industrial .foot-barcode .num{font-family:var(--mono);font-size:4.2pt;letter-spacing:.15em;color:var(--blue);text-align:center}
.t-industrial .foot-sig{font-family:var(--mono);font-size:4.4pt;line-height:1.6;letter-spacing:.07em;text-transform:uppercase;opacity:.88;text-align:right;padding-top:.8mm}
.t-industrial .foot .reg{position:absolute;right:2.4mm;bottom:2.2mm}
.t-industrial .foot-plate{position:absolute;left:3.2mm;top:3.2mm;z-index:2;background:#fff;border-radius:.7mm;
    padding:1.2mm 1.8mm;color:var(--blue);display:flex;flex-direction:column;gap:.5mm;}
.t-industrial .foot-plate b{font-family:var(--disp);font-size:7pt;letter-spacing:.12em;line-height:1}
.t-industrial .foot-plate span{font-family:var(--mono);font-size:3.9pt;letter-spacing:.07em;line-height:1}
.t-industrial .edge{position:absolute;top:0;bottom:0;width:9mm;display:flex;align-items:center;justify-content:center;pointer-events:none}
.t-industrial .edge span{font-family:var(--mono);font-size:4.4pt;letter-spacing:.32em;text-transform:uppercase;
    writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;color:var(--blue);}
.t-industrial .edge.r span{transform:none;color:#000;opacity:.5}
.t-industrial .tpl-flow{display:flex;flex-direction:column;gap:4mm;flex:1 1 auto;min-height:0;position:relative}
.t-industrial .tpl-flow > *{min-width:0}
.t-industrial--p2 .p2-head{display:flex;align-items:flex-end;justify-content:space-between;gap:6mm;border-bottom:2.6mm solid var(--blue);padding-bottom:3mm}
.t-industrial--p2 .p2-head .who{display:flex;align-items:baseline;gap:3mm}
.t-industrial--p2 .p2-head .who b{font-family:var(--cn);font-weight:900;font-size:17pt;letter-spacing:.05em;line-height:1}
.t-industrial--p2 .p2-head .who span{font-family:var(--mono);font-size:5.2pt;letter-spacing:.14em;text-transform:uppercase;color:var(--blue)}
.t-industrial--p2 .p2-head .pg{font-family:var(--mono);font-size:5.2pt;letter-spacing:.12em;text-transform:uppercase;text-align:right;line-height:1.6}
.t-industrial--p2 .p2-head .pg b{display:block;font-family:var(--disp);font-size:13pt;letter-spacing:.08em;line-height:1;color:var(--blue)}
.t-industrial--p2 .proj-grid{gap:3.4mm}
.t-industrial--p2 .proj-band{height:8mm;padding:1.6mm 3mm}
.t-industrial--p2 .proj-band b{font-size:11.5pt}
.t-industrial--p2 .proj-body{padding:2.4mm 3mm 2.6mm}
.t-industrial--p2 .proj-body .desc{font-size:7.4pt;line-height:1.55;margin-top:1mm}
.t-industrial--p2 .proj-body .kind{font-size:4.6pt}
.t-industrial--p2 .proj-body .nums{font-size:5.6pt;margin-top:2mm;padding-top:1.8mm;gap:3.4mm}
.t-industrial--p2 .proj-body .nums b{font-family:var(--disp);font-size:11pt;letter-spacing:.02em}
.t-industrial--p2 .p2-bottom{display:grid;grid-template-columns:1fr 1fr;gap:4mm}
.t-industrial--p2 .edu-wide .edu-item .h b{font-size:10pt}
.t-industrial--p2 .edu-wide .cred div{font-size:5.8pt;padding:1.2mm 0}
.t-industrial--p2 .foot{margin-top:auto}

.t-industrial .foot{margin-top:auto}
.t-industrial .profile-wide{display:grid;grid-template-columns:1fr auto;gap:6mm;align-items:start}
.t-industrial .profile-wide .pw-body{display:flex;flex-direction:column;gap:3mm;min-width:0}
.t-industrial .profile-wide p{font-family:var(--cn);font-size:8.6pt;line-height:1.8;max-width:152mm}
.t-industrial .profile-wide .pstats{margin-top:0;border-top:1px solid rgba(255,255,255,.5);padding-top:2.4mm;grid-template-columns:repeat(3,1fr);gap:6mm;max-width:82mm}
.t-industrial .profile-wide .pw-pixel{width:15mm;height:15mm;margin-top:1mm}
.t-industrial .stack-wide .spec{display:grid;grid-template-columns:1fr 1fr;column-gap:10mm}
.t-industrial .stack-wide .spec-row{grid-template-columns:16mm 1fr}
.t-industrial .stack-wide .bars{flex-direction:row;gap:4mm 7mm;margin-top:3mm}
.t-industrial .stack-wide .bar{flex:1 1 38mm}
.t-industrial .contact-wide{display:grid;grid-template-columns:1fr;gap:0}
.t-industrial .contact-wide > div{display:flex;justify-content:space-between;align-items:baseline;gap:4mm;padding:1.7mm 0;border-bottom:1px dotted rgba(0,0,0,.4)}
.t-industrial .contact-wide .k{font-family:var(--mono);font-size:4.6pt;letter-spacing:.07em;color:var(--blue)}
.t-industrial .contact-wide .v{font-family:var(--mono);font-size:6.2pt;white-space:nowrap}
.t-industrial--p2 .tpl-flow{justify-content:space-between}
.t-industrial--p2 .proj{display:flex;flex-direction:column;min-height:48mm}
.t-industrial--p2 .proj-band b{font-size:12.5pt}
.t-industrial--p2 .proj-body{display:flex;flex-direction:column;flex:1}
.t-industrial--p2 .proj-body .nums{margin-top:auto}
.t-industrial--p2 .foot-band{height:36mm}
.t-industrial--p2 .foot-word{font-size:120pt}

/* ---- override: wide profile grid wrapper ---- */
.t-industrial .profile-wide{display:block}
.t-industrial .pw{display:grid;grid-template-columns:1fr auto;gap:6mm;align-items:start}
.t-industrial .pw .pstats{margin-top:0}
.t-industrial .pw .pw-pixel{width:15mm;height:15mm;margin-top:1mm}
.t-industrial--p2 .proj{min-height:42mm;position:relative}
.t-industrial--p2 .proj-mark{position:absolute;right:2mm;bottom:-1mm;font-family:var(--disp);font-size:46pt;line-height:.75;color:transparent;-webkit-text-stroke:1px var(--blue);opacity:.35;pointer-events:none;letter-spacing:.02em}
.t-industrial .p2-hero{background:var(--blue);color:#fff;border-radius:4.2mm;padding:5mm 5.5mm;display:flex;align-items:flex-end;justify-content:space-between;gap:8mm;min-height:44mm}
.t-industrial .p2-hero .kick{font-family:var(--mono);font-size:5.2pt;letter-spacing:.16em;text-transform:uppercase}
.t-industrial .p2-hero h2{font-family:var(--cn);font-weight:900;font-size:24pt;letter-spacing:.12em;line-height:1;margin-top:2.5mm}
.t-industrial .p2-hero .who{text-align:right;font-family:var(--mono);font-size:5pt;letter-spacing:.12em;line-height:1.9;text-transform:uppercase;white-space:nowrap}
.t-industrial .p2-hero .who b{display:block;font-family:var(--disp);font-size:25pt;letter-spacing:.04em;line-height:.9;margin-bottom:1.5mm}

.t-industrial--p2 .foot{margin-top:0}
`
