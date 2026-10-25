/* ------------------------------------------------------------------
   打样稿（proof）— 拼贴小报的安静版：纸墨印刷气质不变，
   装饰收进细规则线：勾线巨字、hairline 网格、小条码，无噪点/胶带/反色块。
   所有选择器都收在 .t-proof 之下；内部类名统一 .pf- 前缀。
   页面尺寸由 .tpl-page（210×297mm）提供，这里只写纸面内部的版面。
   主色只经 --blue（默认深朱红），只用于编号/标签/数值等文字点缀。
------------------------------------------------------------------- */
export const PROOF_CSS = String.raw`
.t-proof{
  --paper:#FFFFFF;--ink:#191712;--muted:#6F6A5B;
  --line:rgba(25,23,18,.26);
  --disp:"Impact","Haettenschweiler","Arial Narrow","Helvetica Neue","PingFang SC",sans-serif;
  --cn:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  --mono:"SF Mono",Menlo,Consolas,"Courier New",monospace;
  --pad:13mm;
  position:relative;
  box-sizing:border-box; /* PAGE_CSS scopes box-sizing to descendants only — the root needs its own */
  padding:6mm var(--pad) 0;
  background:var(--paper);color:var(--ink);
  font-family:var(--cn);font-size:8pt;line-height:1.4;
  overflow:hidden;overflow-wrap:break-word;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
  print-color-adjust:exact;-webkit-print-color-adjust:exact;
}
.t-proof *{box-sizing:border-box;margin:0;padding:0}
.t-proof :is(h1,h2,h3,p,ul,ol,li){list-style:none}

/* ==========================================================================
   1. 刊头 —— 系列名 / 小章 / 标题说明行 / 勾线巨字 / 联系方式
   ========================================================================== */
.t-proof .pf-mast{display:flex;justify-content:space-between;align-items:flex-start;gap:4mm}
.t-proof .pf-series{font-family:var(--mono);font-size:6pt;letter-spacing:.14em;text-transform:uppercase}
.t-proof .pf-series b{display:block}
.t-proof .pf-series span{display:block;margin-top:.4mm;color:var(--muted);letter-spacing:.1em}
.t-proof .pf-chip{
  flex:0 0 auto;border:.35mm solid var(--ink);padding:.5mm 1.6mm .4mm;
  font-family:var(--mono);font-size:6pt;font-weight:700;letter-spacing:.22em;
}
.t-proof .pf-chip i{font-style:normal;color:var(--blue)}

.t-proof .pf-caption{display:flex;justify-content:space-between;align-items:baseline;gap:4mm;margin-top:1.6mm}
.t-proof .pf-caption > span:first-child{font-family:var(--mono);font-size:6pt;letter-spacing:.18em;color:var(--muted)}
.t-proof .pf-say{font-family:var(--mono);font-size:6.6pt;letter-spacing:.05em;text-transform:uppercase;text-align:right}
.t-proof .pf-say em{font-style:normal;color:var(--blue)}

/* 勾线巨字：实心 + 描边两行，横线只留双细规则 */
.t-proof .pf-title{
  display:flex;flex-direction:column;align-items:stretch;
  margin-top:1mm;padding-bottom:1.6mm;
  border-bottom:.35mm solid var(--ink);
  font-family:var(--disp);font-weight:400;line-height:.9;letter-spacing:.01em;text-transform:uppercase;
}
.t-proof .pf-ln{display:block;white-space:nowrap;color:var(--ink)}
.t-proof .pf-sub{display:flex;justify-content:space-between;align-items:center;gap:4mm;margin-top:1.4mm}
.t-proof .pf-role{display:flex;align-items:baseline;gap:2.6mm;min-width:0}
.t-proof .pf-role b{font-size:11pt;font-weight:800;letter-spacing:.06em;white-space:nowrap}
.t-proof .pf-role > span{font-family:var(--mono);font-size:6pt;letter-spacing:.22em;color:var(--muted);text-transform:uppercase}
.t-proof .pf-years{
  flex:0 0 auto;display:flex;align-items:baseline;gap:1.6mm;
  border:.3mm solid var(--ink);padding:.7mm 1.7mm;
  font-family:var(--mono);font-size:6.2pt;letter-spacing:.16em;
}
.t-proof .pf-years b{font-size:7.2pt}
.t-proof .pf-contacts{
  display:flex;flex-wrap:wrap;gap:.7mm 3.2mm;margin-top:1.6mm;padding:1mm 0 .9mm;
  border-top:.25mm dotted var(--line);border-bottom:.25mm dotted var(--line);
}
.t-proof .pf-ct{display:flex;gap:1.3mm;font-family:var(--mono);font-size:6pt;letter-spacing:.04em}
.t-proof .pf-ct b{color:var(--muted);font-weight:700}

/* ==========================================================================
   2. 区块标题
   ========================================================================== */
.t-proof .pf-shead{display:flex;align-items:baseline;gap:2.4mm}
.t-proof .pf-shead .no{font-family:var(--mono);font-size:6.4pt;font-weight:700;color:var(--ink)}
.t-proof .pf-shead h2{font-family:var(--mono);font-size:7.2pt;font-weight:700;letter-spacing:.3em;text-transform:uppercase}
.t-proof .pf-shead .zh{font-size:7.4pt;font-weight:700;letter-spacing:.3em}
.t-proof .pf-shead .rule{flex:1;border-top:.3mm solid var(--ink)}
.t-proof .pf-shead .meta{font-family:var(--mono);font-size:5.4pt;letter-spacing:.14em;color:var(--muted);text-transform:uppercase}
.t-proof .pf-shead2{display:flex;align-items:baseline;gap:2.8mm;margin-top:3.2mm;padding-top:1.2mm;border-top:.35mm solid var(--ink)}
.t-proof .pf-shead2 .no{font-family:var(--mono);font-size:7.4pt;font-weight:700;color:var(--ink)}
.t-proof .pf-shead2 h2{font-size:12.5pt;font-weight:900;letter-spacing:.1em}
.t-proof .pf-shead2 h2 i{font-family:var(--mono);font-style:normal;font-size:6.2pt;font-weight:700;letter-spacing:.32em;color:var(--muted);text-transform:uppercase;margin-left:1.6mm}
.t-proof .pf-shead2 .meta{margin-left:auto;font-family:var(--mono);font-size:5.6pt;letter-spacing:.16em;color:var(--muted);text-transform:uppercase}

/* ==========================================================================
   3. 个人简介 —— 导语 + 一行数据
   ========================================================================== */
.t-proof .pf-lede{margin-top:1.8mm;font-size:8pt;line-height:1.5;max-width:168mm}
.t-proof .pf-stats{display:flex;flex-wrap:wrap;gap:1mm 5mm;margin-top:1.3mm;font-family:var(--mono)}
.t-proof .pf-stats b{font-size:9pt;font-weight:700;color:var(--ink)}
.t-proof .pf-stats span{font-size:5.6pt;letter-spacing:.18em;color:var(--muted);text-transform:uppercase}
/* 富文本强调：等宽 + 主色文字（安静版不上底色） */
.t-proof .pf-lede b,.t-proof .pf-bul b,.t-proof .pf-desc b{
  font-family:var(--mono);font-size:.94em;font-weight:600;color:var(--blue);
}

/* ==========================================================================
   4. 工作经历 —— 无框条目，细线分隔
   ========================================================================== */
.t-proof .pf-job{padding:1.8mm 0 1.7mm}
.t-proof .pf-job + .pf-job{border-top:.25mm solid var(--line)}
.t-proof .pf-job.cur .pf-date{font-weight:700}
.t-proof .pf-job-h{display:flex;align-items:baseline;gap:2.4mm}
.t-proof .pf-idx{font-family:var(--mono);font-size:7.4pt;font-weight:700;color:var(--ink)}
.t-proof .pf-job-h h3{font-size:9.5pt;font-weight:800;letter-spacing:.04em;white-space:nowrap}
.t-proof .pf-co{font-family:var(--mono);font-size:5.8pt;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-proof .pf-date{flex:0 0 auto;margin-left:auto;font-family:var(--mono);font-size:5.8pt;font-weight:600;letter-spacing:.12em;color:var(--ink)}
.t-proof .pf-date.plain{margin-left:0}
.t-proof .pf-bul{display:grid;gap:.45mm;margin-top:.9mm}
.t-proof .pf-bul li{position:relative;padding-left:4mm;font-size:7.2pt;line-height:1.4}
.t-proof .pf-bul li::before{content:"—";position:absolute;left:0;top:0;font-size:6pt;color:var(--muted)}

/* ==========================================================================
   5. 项目 —— hairline 网格，无底色反转
   ========================================================================== */
.t-proof .pf-grid{display:grid;grid-template-columns:1fr 1fr;gap:2.4mm;margin-top:2mm}
.t-proof .pf-cell{border:.3mm solid var(--line);padding:1.5mm 2.2mm 1.5mm}
.t-proof .pf-cell-top{display:flex;justify-content:space-between;gap:2mm;font-family:var(--mono);font-size:5.4pt;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.t-proof .pf-cell-top .code{color:var(--ink)}
.t-proof .pf-cell h3{margin-top:.8mm;font-size:9.5pt;font-weight:900;letter-spacing:.05em}
.t-proof .pf-desc{margin-top:.8mm;font-size:6.8pt;line-height:1.45}
.t-proof .pf-cell-stats{
  display:flex;flex-wrap:wrap;gap:.5mm 2.4mm;margin-top:1mm;padding-top:.8mm;
  border-top:.25mm dotted var(--line);
  font-family:var(--mono);font-size:5.6pt;letter-spacing:.06em;color:var(--muted);
}
.t-proof .pf-cell-stats b{color:var(--ink);font-weight:700}

/* ==========================================================================
   6. 技术栈 + 教育 —— 双栏规格表
   ========================================================================== */
.t-proof .pf-duo{display:grid;grid-template-columns:1.25fr 1fr;gap:6mm;margin-top:3.2mm}
.t-proof .pf-spec{margin-top:1.8mm}
.t-proof .pf-srow{display:flex;align-items:baseline;gap:1.6mm;margin-top:.9mm}
.t-proof .pf-srow .k{flex:0 0 auto;font-family:var(--mono);font-size:5.9pt;font-weight:700;letter-spacing:.14em}
.t-proof .pf-srow .lead{flex:1 1 3mm;border-bottom:.3mm dotted var(--line);transform:translateY(-.7mm)}
.t-proof .pf-srow .v{flex:0 1 auto;max-width:46mm;text-align:right;font-size:6.6pt;line-height:1.28}
.t-proof .pf-dots{display:grid;gap:.6mm;margin-top:1.6mm;padding-top:1.2mm;border-top:.25mm dotted var(--line)}
.t-proof .pf-skill{display:flex;align-items:center;gap:2.4mm;font-family:var(--mono);font-size:5.8pt;letter-spacing:.14em}
.t-proof .pf-skill .lb{flex:0 0 11mm}
.t-proof .pf-skill .sq{flex:1;display:flex;gap:.7mm}
.t-proof .pf-skill .sq i{display:block;width:1.9mm;height:1.9mm;border:.3mm solid var(--ink)}
.t-proof .pf-skill .sq i.on{background:var(--ink)}
.t-proof .pf-edu{margin-top:1.8mm}
.t-proof .pf-edu-h{display:flex;align-items:baseline;gap:2.4mm;justify-content:space-between}
.t-proof .pf-edu-h h3{font-size:9.5pt;font-weight:800;letter-spacing:.04em}
.t-proof .pf-edu-h .pf-date{border:.3mm solid var(--ink);padding:.4mm 1.4mm}
.t-proof .pf-edu-meta{margin-top:.7mm;font-family:var(--mono);font-size:5.4pt;letter-spacing:.14em;color:var(--muted);text-transform:uppercase}
.t-proof .pf-degree{margin-top:.6mm;font-size:6.9pt;color:var(--muted)}
.t-proof .pf-certs{display:grid;gap:.8mm;margin-top:1.4mm}
.t-proof .pf-certs li{display:flex;justify-content:space-between;gap:2.4mm;align-items:baseline;border-bottom:.3mm dotted var(--line);padding-bottom:.6mm;font-size:6.8pt;line-height:1.35}
.t-proof .pf-certs .yr{flex:0 0 auto;font-family:var(--mono);font-size:6pt;font-weight:700;color:var(--ink)}

/* ==========================================================================
   7. 页脚 —— 细线收底：流程 / 小条码 / 铭牌 / 字标
   ========================================================================== */
.t-proof .pf-foot{margin-top:auto;border-top:.35mm solid var(--ink);padding:1.8mm 0 2.6mm}
.t-proof .pf-flow{
  display:flex;flex-wrap:wrap;align-items:baseline;gap:1mm 2.2mm;padding-bottom:1.2mm;
  border-bottom:.25mm dotted var(--line);
  font-family:var(--mono);font-size:5.8pt;letter-spacing:.16em;text-transform:uppercase;
}
.t-proof .pf-flow .fl{font-weight:700}
.t-proof .pf-flow .sep{font-style:normal;color:var(--muted)}
.t-proof .pf-flow .tag{margin-left:auto;color:var(--muted)}
.t-proof .pf-foot-main{display:flex;align-items:flex-end;gap:5mm;padding-top:1.6mm}
.t-proof .pf-plate b{display:block;font-size:8.5pt;font-weight:800;letter-spacing:.06em}
.t-proof .pf-plate span{display:block;margin-top:.4mm;font-family:var(--mono);font-size:5pt;letter-spacing:.18em;color:var(--muted);text-transform:uppercase}
.t-proof .pf-mark{flex:0 0 auto;margin-left:auto;text-align:right}
.t-proof .pf-mark b{display:block;font-family:var(--mono);font-size:8pt;font-weight:700;letter-spacing:.35em;text-transform:uppercase}
.t-proof .pf-mark span{display:block;margin-top:.5mm;font-family:var(--mono);font-size:5pt;letter-spacing:.3em;color:var(--muted);text-transform:uppercase}
.t-proof .pf-colophon{
  display:flex;justify-content:space-between;gap:4mm;margin-top:1.3mm;padding-top:.9mm;
  border-top:.25mm dotted var(--line);
  font-family:var(--mono);font-size:5pt;letter-spacing:.14em;color:var(--muted);text-transform:uppercase;
}
`;
