/* MOONLIGHT "day" skin — light, restrained variant of the shared
   .t-moonlight implementation. Rendered with the extra root class
   `t-moonlight-day`; every override doubles the scope prefix so it
   wins the cascade regardless of injection order. The onyx ladder
   flips from "raised dark surfaces" to "paper-neighbour light greys"
   and --paper becomes the page ground. Accent (--blue) is injected
   inline by the page root from the template's registry accent. */
export const MOONLIGHT_DAY_CSS = String.raw`
.t-moonlight.t-moonlight-day{
  --onyx-2:#ECEDE5;--onyx-3:#E3E5D9;--onyx-4:#C7CBBA;
  --line:rgba(17,17,17,.16);--line-soft:rgba(17,17,17,.07);
  background:var(--paper);color:var(--onyx);
}
.t-moonlight.t-moonlight-day .ml-grain{opacity:.07}
.t-moonlight.t-moonlight-day .ml-moon{background:#fff;box-shadow:0 0 9mm 1mm rgba(17,17,17,.10)}
.t-moonlight.t-moonlight-day .ml-bldg-a{fill:#D7DACB}
.t-moonlight.t-moonlight-day .ml-bldg-b{fill:#E0E2D4}
.t-moonlight.t-moonlight-day .ml-lightband{background:var(--onyx);opacity:.045}
.t-moonlight.t-moonlight-day .ml-speedline{background:rgba(17,17,17,.25)}
.t-moonlight.t-moonlight-day .ml-spark{background:var(--onyx);opacity:.4}
.t-moonlight.t-moonlight-day .ml-cf.paper{background:var(--onyx);opacity:.32}
.t-moonlight.t-moonlight-day .ml-years::before{filter:none}
.t-moonlight.t-moonlight-day .ml-ln{color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-role-cn{color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-pill{background:rgba(255,255,255,.72);color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-strip{background:#fff;border-top:1px solid var(--onyx)}
.t-moonlight.t-moonlight-day .ml-en{color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-quote{color:rgba(17,17,17,.92)}
.t-moonlight.t-moonlight-day .ml-sen{color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-job.cur .ml-jband{background:var(--onyx-3);color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-job.cur .ml-jidx{color:var(--blue)}
.t-moonlight.t-moonlight-day .ml-job.cur .ml-jrole span{color:var(--smokey-l)}
.t-moonlight.t-moonlight-day .ml-job.cur .ml-jco{color:rgba(17,17,17,.8)}
.t-moonlight.t-moonlight-day .ml-job.cur .ml-jdate{border-color:var(--smokey-l);color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-curtag{background:var(--onyx);color:var(--paper)}
.t-moonlight.t-moonlight-day .ml-jco{color:rgba(17,17,17,.8)}
.t-moonlight.t-moonlight-day .ml-jdate{color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-bul li{color:rgba(17,17,17,.88)}
.t-moonlight.t-moonlight-day .ml-pname{color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-pdesc{color:rgba(17,17,17,.82)}
.t-moonlight.t-moonlight-day .ml-pnums b{color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-stack{background:#fff;border-color:var(--line)}
.t-moonlight.t-moonlight-day .ml-stack .ml-rule{background:var(--line)}
.t-moonlight.t-moonlight-day .ml-stack .ml-no,.t-moonlight.t-moonlight-day .ml-stack .ml-zh{color:var(--blue)}
.t-moonlight.t-moonlight-day .ml-stack .ml-dot{background:var(--blue)}
.t-moonlight.t-moonlight-day .ml-tag{border-color:rgba(17,17,17,.32)}
.t-moonlight.t-moonlight-day .ml-tag.fill{color:var(--paper)}
.t-moonlight.t-moonlight-day .ml-skills{border-top-color:var(--line)}
.t-moonlight.t-moonlight-day .ml-cd{color:rgba(17,17,17,.78)}
.t-moonlight.t-moonlight-day .ml-clist li{color:rgba(17,17,17,.85)}
.t-moonlight.t-moonlight-day .ml-spec-list dd{color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-plate b{color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-fline em{color:var(--onyx)}
.t-moonlight.t-moonlight-day .ml-bleed{color:transparent;-webkit-text-stroke:1.1px rgba(17,17,17,.45)}
`
