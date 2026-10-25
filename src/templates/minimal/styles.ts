export const MINIMAL_CSS = String.raw`
.t-minimal{
  --ink:#0f0f0f;--muted:#6a6a63;--rule:rgba(15,15,15,.22);
  --mn:"Helvetica Neue","HarmonyOS Sans SC","PingFang SC","Hiragino Sans GB",Arial,sans-serif;
  --mm:"SF Mono",Menlo,"PT Mono",Monaco,monospace;
  position:relative;padding:14mm 15mm 12mm;background:#fff;color:var(--ink);
  font-family:var(--mn);
}
.t-minimal *{box-sizing:border-box;margin:0;padding:0}
.t-minimal{box-sizing:border-box}
.t-minimal .tpl-flow{gap:0}

/* header */
.t-minimal .mn-head{border-bottom:1px solid var(--ink);padding-bottom:5mm;flex:0 0 auto}
.t-minimal .mn-top{display:flex;justify-content:space-between;gap:6mm;font:500 5.6pt/1.4 var(--mm);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.t-minimal .mn-top b{font-weight:500;color:var(--blue)}
.t-minimal .mn-name{font-family:var(--mn);font-size:35pt;font-weight:700;letter-spacing:.05em;line-height:1;margin-top:5mm}
.t-minimal .mn-sub{display:flex;align-items:baseline;gap:5mm;margin-top:2.6mm;flex-wrap:wrap}
.t-minimal .mn-latin{font:400 8.2pt var(--mm);letter-spacing:.34em;text-transform:uppercase;color:var(--blue)}
.t-minimal .mn-title{font-family:var(--mn);font-size:8.6pt;letter-spacing:.1em;color:#444}
.t-minimal .mn-contacts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:6mm;border-top:1px solid var(--rule)}
.t-minimal .mn-contacts > div{padding:2.6mm 4mm 0 0;min-width:0}
.t-minimal .mn-contacts > div + div{border-left:1px solid var(--rule);padding-left:4mm}
.t-minimal .mn-contacts b{display:block;font:500 4.8pt var(--mm);letter-spacing:.14em;color:var(--muted);text-transform:uppercase}
.t-minimal .mn-contacts span{display:block;font:400 6.8pt var(--mm);margin-top:1.2mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* body */
.t-minimal .mn-body{display:grid;grid-template-columns:54mm minmax(0,1fr);gap:11mm;margin-top:7mm;flex:1 1 auto;min-height:0}
.t-minimal .mn-side,.t-minimal .mn-main{display:flex;flex-direction:column;gap:7mm;min-width:0}
.t-minimal .mn-sec{min-width:0}
.t-minimal .mn-sec > h2{font:500 6.4pt var(--mm);letter-spacing:.2em;text-transform:uppercase;padding-bottom:2mm;border-bottom:1px solid var(--ink);display:flex;justify-content:space-between;align-items:baseline;gap:3mm}
.t-minimal .mn-sec > h2 em{font-style:normal;color:var(--blue)}
.t-minimal .mn-sec > p{font-size:8pt;line-height:1.85;margin-top:3mm;color:#222}

/* sidebar */
.t-minimal .mn-group{padding:1.7mm 0;border-bottom:1px dotted var(--rule)}
.t-minimal .mn-group:last-child{border-bottom:0}
.t-minimal .mn-group b{display:block;font:500 4.7pt var(--mm);letter-spacing:.13em;color:var(--blue);text-transform:uppercase}
.t-minimal .mn-group span{display:block;font-size:7pt;line-height:1.55;margin-top:.8mm}
.t-minimal .mn-skill{display:flex;justify-content:space-between;gap:3mm;font:400 6.8pt var(--mm);padding:1.4mm 0;border-bottom:1px dotted var(--rule)}
.t-minimal .mn-skill:last-child{border-bottom:0}
.t-minimal .mn-skill i{font-style:normal;color:var(--blue);letter-spacing:.16em}
.t-minimal .mn-edu b{display:block;font-size:8.6pt;font-weight:700;margin-top:2.6mm}
.t-minimal .mn-edu span{display:block;font:400 5.8pt var(--mm);letter-spacing:.06em;color:var(--muted);margin-top:1mm}
.t-minimal .mn-edu p{font-size:7pt;line-height:1.6;margin-top:1.4mm}
.t-minimal .mn-list{margin-top:2.4mm;display:flex;flex-direction:column;gap:1.4mm}
.t-minimal .mn-list div{position:relative;padding-left:3mm;font-size:6.8pt;line-height:1.5;color:#333}
.t-minimal .mn-list div::before{content:"";position:absolute;left:0;top:1.4mm;width:1.6mm;height:.6mm;background:var(--blue)}

/* experience */
.t-minimal .mn-job{padding:3mm 0;border-bottom:1px solid var(--rule)}
.t-minimal .mn-job:first-of-type{padding-top:3.4mm}
.t-minimal .mn-job:last-child{border-bottom:0;padding-bottom:0}
.t-minimal .mn-job-head{display:flex;justify-content:space-between;align-items:baseline;gap:4mm}
.t-minimal .mn-job-head b{font-size:9.4pt;font-weight:700;letter-spacing:.02em}
.t-minimal .mn-job-head span{font:400 6.1pt var(--mm);color:var(--muted);white-space:nowrap;letter-spacing:.04em}
.t-minimal .mn-company{font:400 6.3pt var(--mm);color:var(--blue);margin-top:1.1mm;letter-spacing:.05em;text-transform:uppercase}
.t-minimal .mn-bullets{margin-top:2mm;display:flex;flex-direction:column;gap:1.1mm}
.t-minimal .mn-bullets li{list-style:none;position:relative;padding-left:3.2mm;font-size:7.35pt;line-height:1.65;color:#222}
.t-minimal .mn-bullets li::before{content:"";position:absolute;left:0;top:1.6mm;width:1.5mm;height:.6mm;background:var(--blue)}
.t-minimal .mn-bullets b{font-family:var(--mm);font-size:6.5pt;font-weight:500;color:var(--blue)}

/* projects */
.t-minimal .mn-proj{display:grid;grid-template-columns:38mm minmax(0,1fr) auto;gap:4mm;padding:2.6mm 0;border-bottom:1px solid var(--rule);align-items:baseline}
.t-minimal .mn-proj:last-child{border-bottom:0;padding-bottom:0}
.t-minimal .mn-proj b{font-size:7.5pt;letter-spacing:.04em}
.t-minimal .mn-proj .desc{font-size:6.9pt;color:#333;line-height:1.5}
.t-minimal .mn-proj .meta{font:400 5.5pt var(--mm);color:var(--muted);white-space:nowrap;text-align:right}
.t-minimal .mn-proj .meta b{font-family:var(--mm);font-size:6.6pt;color:var(--blue);font-weight:500}

/* footer */
.t-minimal .mn-foot{display:flex;justify-content:space-between;align-items:center;gap:6mm;font:400 5.2pt var(--mm);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);border-top:1px solid var(--ink);padding-top:3mm;margin-top:6mm;flex:0 0 auto}
.t-minimal .mn-foot b{color:var(--ink);font-weight:500}

/* duplex page 2 */
.t-minimal .mn-name--p2{font-size:24pt}
.t-minimal--p2 .mn-head{padding-bottom:5mm}
.t-minimal .mn-body--solo{display:block}
.t-minimal .mn-body--solo .mn-main{gap:7mm}
.t-minimal .mn-p2grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:11mm;margin-top:7mm}
.t-minimal .mn-p2grid .mn-sec{min-width:0}
.t-minimal .mn-contact-list{margin-top:3mm}
.t-minimal .mn-contact-list .mn-group span{font:400 8.4pt var(--mm);margin-top:1mm}
`
