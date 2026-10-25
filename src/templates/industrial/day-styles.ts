/* ------------------------------------------------------------------
   Industrial "day" skin — light, restrained variant of the shared
   .t-industrial implementation. Rendered with the extra root class
   `t-industrial-day`; every override doubles the scope prefix so it
   wins the cascade regardless of injection order. Accent (--blue) is
   injected inline by the page root from the template's registry accent.
------------------------------------------------------------------- */
export const INDUSTRIAL_DAY_CSS = String.raw`
.t-industrial.t-industrial-day{--blue-tint:color-mix(in srgb,var(--blue) 8%,var(--paper))}
.t-industrial.t-industrial-day .reg.inv{background:var(--ink)}
.t-industrial.t-industrial-day .id-band{background:var(--blue-tint);color:var(--ink);border-bottom:var(--hair) solid var(--ink)}
.t-industrial.t-industrial-day .id-name .tag{border-color:rgba(0,0,0,.4)}
.t-industrial.t-industrial-day .id-rule{height:1.2mm}
.t-industrial.t-industrial-day .yrs{background:var(--paper);color:var(--blue);border:1.2px solid var(--blue)}
.t-industrial.t-industrial-day .card.blue{background:var(--blue-tint);border-color:var(--ink);color:var(--ink)}
.t-industrial.t-industrial-day .card.blue .card-head{border-bottom-color:rgba(0,0,0,.3)}
.t-industrial.t-industrial-day .pstats{border-top-color:rgba(0,0,0,.3)}
.t-industrial.t-industrial-day .bar .track i{background:color-mix(in srgb,var(--blue) 16%,var(--paper))}
.t-industrial.t-industrial-day .job-band{background:var(--blue-tint);color:var(--ink);border-bottom:var(--hair) solid var(--ink)}
.t-industrial.t-industrial-day .job-band .idx{color:var(--blue)}
.t-industrial.t-industrial-day .job-band .date{border-left-color:rgba(0,0,0,.35)}
.t-industrial.t-industrial-day .proj-band{background:var(--blue-tint);color:var(--ink);border-bottom:var(--hair) solid var(--ink)}
.t-industrial.t-industrial-day .foot-band{background:var(--blue-tint);color:var(--ink)}
.t-industrial.t-industrial-day .foot-word{-webkit-text-stroke-color:color-mix(in srgb,var(--blue) 42%,var(--paper))}
.t-industrial.t-industrial-day .foot-signal{border:1px solid rgba(0,0,0,.3)}
.t-industrial.t-industrial-day .foot-plate{border:1px solid rgba(0,0,0,.25)}
.t-industrial.t-industrial-day .p2-head{border-bottom-width:1.6mm}
.t-industrial.t-industrial-day .p2-hero{background:var(--blue-tint);color:var(--ink)}
`
