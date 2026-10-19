/* Shared A4 page box + export shell. Every template renders `.tpl-page`
   elements, so pagination, preview scaling and print work the same way. */
export const PAGE_CSS = String.raw`
.tpl-page{
  position:relative;
  display:flex;flex-direction:column;
  width:210mm;height:297mm;
  background:#fff;color:#000;
  overflow:hidden;
  box-shadow:0 1px 0 rgba(0,0,0,.14),0 26px 70px rgba(0,0,0,.22);
  print-color-adjust:exact;-webkit-print-color-adjust:exact;
}
.tpl-page *,.tpl-page *::before,.tpl-page *::after{box-sizing:border-box}
.tpl-flow{position:relative;display:flex;flex-direction:column;flex:1 1 auto;min-height:0}
@media screen{ .tpl-page{flex:0 0 auto} }
`

export const EXPORT_PAGE_CSS = String.raw`
@page{size:A4 portrait;margin:0}
html,body{background:#dedfd9}
body{margin:0;padding:28px 16px 64px;display:flex;justify-content:center;align-items:flex-start;-webkit-font-smoothing:antialiased}
.tpl-export{display:flex;flex-direction:column;align-items:center;gap:26px}
.tpl-export .tpl-page{flex:0 0 auto}
@media print{
  html,body{background:#fff}
  body{padding:0;display:block}
  .tpl-export{display:block;gap:0}
  .tpl-page{box-shadow:none;margin:0;break-after:page;page-break-after:always}
  .tpl-page:last-child{break-after:auto;page-break-after:auto}
}
@media screen and (max-width:880px){ body{padding:10px 8px 40px} .tpl-export{zoom:.68} }
@media screen and (max-width:640px){ .tpl-export{zoom:.46} }
`
