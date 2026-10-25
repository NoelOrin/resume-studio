/* MOONLIGHT — 夜行海报式单页模板。
   所有选择器都收在 .t-moonlight 之下；内部类名统一 .ml- 前缀。
   页面尺寸由 .tpl-page（210×297mm）提供，这里只写纸面内部的版面。 */
export const MOONLIGHT_CSS = String.raw`
.t-moonlight{
  --onyx:#111111;--onyx-2:#1C1C1C;--onyx-3:#242424;--onyx-4:#2E2E2E;
  --paper:#F2F3EC;--smokey:#707070;--smokey-l:#8E8E99;
  --line:rgba(242,243,236,.18);--line-soft:rgba(242,243,236,.10);
  --disp:"Helvetica Neue","Arial Narrow","Nimbus Sans Narrow",Impact,"PingFang SC",sans-serif;
  --cn:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  --mono:"SF Mono",Menlo,Monaco,"Courier New",monospace;
  --pad:8mm;
  position:relative;background:var(--onyx);color:var(--paper);
  font-family:var(--cn);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.t-moonlight :is(h1,h2,h3,p,ul,ol,li,dl,dt,dd,figure){margin:0;padding:0;list-style:none}
.t-moonlight .tpl-flow{gap:0}

/* ==========================================================================
   0. 页面级装饰 —— 细线扫描层 / 贴边竖排字
   ========================================================================== */
.t-moonlight .ml-grain{
  position:absolute;inset:0;z-index:9;pointer-events:none;
  background:repeating-linear-gradient(180deg,rgba(17,17,17,.26) 0 .3mm,transparent .3mm .82mm);
  opacity:.32;mix-blend-mode:multiply;
}
.t-moonlight .ml-edge{position:absolute;top:0;bottom:0;width:5mm;z-index:8;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:hidden}
.t-moonlight .ml-edge span{
  font-family:var(--mono);font-size:3.4pt;line-height:1;letter-spacing:.42em;
  text-transform:uppercase;white-space:nowrap;color:var(--smokey-l);writing-mode:vertical-rl;
}
.t-moonlight .ml-edge.l{left:1.4mm}
.t-moonlight .ml-edge.l span{transform:rotate(180deg);color:var(--blue);letter-spacing:.5em}
.t-moonlight .ml-edge.r{right:1.4mm}

/* ==========================================================================
   1. HERO —— 巨月 / 城市剪影 / 三行叠排巨型标题
   ========================================================================== */
.t-moonlight .ml-hero{
  position:relative;flex:0 0 auto;overflow:hidden;
  display:flex;flex-direction:column;
  min-height:66mm;padding:6mm var(--pad) 0;
  border-bottom:1px solid var(--onyx-4);
}
.t-moonlight .ml-sky{position:absolute;inset:0;z-index:0;pointer-events:none}

/* 巨月：纸白圆盘压住右上 */
.t-moonlight .ml-moon{
  position:absolute;top:5.5mm;right:10mm;width:48mm;height:48mm;border-radius:50%;
  background:var(--paper);overflow:hidden;isolation:isolate;
  box-shadow:0 0 9mm 1mm rgba(242,243,236,.10);
}
.t-moonlight .ml-crater{position:absolute;border-radius:50%;border:1px solid rgba(17,17,17,.11)}
.t-moonlight .ml-crater.c1{left:7%;top:13%;width:47%;height:47%;border-color:rgba(17,17,17,.13)}
.t-moonlight .ml-crater.c2{right:5%;top:31%;width:31%;height:31%;border-color:rgba(17,17,17,.09)}
.t-moonlight .ml-crater.c3{left:24%;bottom:-6%;width:58%;height:58%;border-color:rgba(17,17,17,.07)}
.t-moonlight .ml-crater.c4{right:24%;top:6%;width:13%;height:13%;border-color:rgba(17,17,17,.16);background:rgba(17,17,17,.035)}
.t-moonlight .ml-hz{position:absolute;left:-8%;right:-8%;height:1px;background:rgba(17,17,17,.15)}
.t-moonlight .ml-hz.a{top:57%}
.t-moonlight .ml-hz.b{top:61.5%;background:rgba(17,17,17,.08)}
.t-moonlight .ml-arc{
  position:absolute;inset:13%;border-radius:50%;border:1.5px solid transparent;
  border-top-color:var(--blue);border-right-color:var(--blue);
  transform:rotate(-28deg);opacity:.9;mix-blend-mode:multiply;
}
.t-moonlight .ml-arc2{
  position:absolute;inset:27%;border-radius:50%;border:1px solid transparent;
  border-bottom-color:var(--blue);border-left-color:var(--blue);
  transform:rotate(-14deg);opacity:.62;mix-blend-mode:multiply;
}
.t-moonlight .ml-moon-ring{
  position:absolute;top:4mm;right:8.5mm;width:51mm;height:51mm;border-radius:50%;
  border:1px solid var(--blue);opacity:.42;pointer-events:none;
}

/* 城市剪影：ONYX 提亮色压住月盘下缘 */
.t-moonlight .ml-city{position:absolute;left:0;right:0;bottom:0;width:100%;height:27mm;display:block;z-index:1}
.t-moonlight .ml-bldg-a{fill:#202020}
.t-moonlight .ml-bldg-b{fill:#2A2A2A}
.t-moonlight .ml-win{fill:var(--blue)}
.t-moonlight .ml-windim{fill:#8E8E99;opacity:.5}

/* 极细光带 / 速度线 / 星点 */
.t-moonlight .ml-lightband{
  position:absolute;left:-12%;right:-12%;top:46%;height:8mm;
  background:var(--paper);opacity:.05;transform:rotate(-7deg);
}
.t-moonlight .ml-speedline{position:absolute;left:0;right:0;height:1px;background:rgba(242,243,236,.30)}
.t-moonlight .ml-speedline.a{top:24%}
.t-moonlight .ml-speedline.b{top:72%;background:var(--blue);opacity:.34}
.t-moonlight .ml-spark{position:absolute;width:.8mm;height:.8mm;background:var(--paper);opacity:.5;border-radius:.2mm}
.t-moonlight .ml-spark.s1{left:30%;top:14%}
.t-moonlight .ml-spark.s2{left:66%;top:8%}
.t-moonlight .ml-spark.s3{left:88%;top:30%}
.t-moonlight .ml-spark.s4{left:52%;top:36%}
.t-moonlight .ml-spark.s5{left:16%;top:52%}

/* 彩纸碎屑（静态散布，无动画） */
.t-moonlight .ml-confetti{position:absolute;inset:0;z-index:2;overflow:hidden;pointer-events:none}
.t-moonlight .ml-cf{
  position:absolute;display:block;width:var(--s,4px);height:var(--s,4px);
  transform:rotate(var(--r,0deg));
}
.t-moonlight .ml-cf.blue{background:var(--blue);opacity:.92}
.t-moonlight .ml-cf.paper{background:var(--paper);opacity:.62}
.t-moonlight .ml-cf.grey{background:#8E8E99;opacity:.6}
.t-moonlight .ml-cf.dark{background:var(--blue);opacity:.4}
.t-moonlight .ml-cf.dia{clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.t-moonlight .ml-cf.tri{clip-path:polygon(50% 0,100% 100%,0 100%)}
.t-moonlight .ml-cf.strip{width:calc(var(--s) * .32);height:calc(var(--s) * 2.2);border-radius:.2mm}

/* 年份徽标：一枚盖在月盘上的印章（虚线环压暗，纸白上才看得清） */
.t-moonlight .ml-years{
  position:absolute;z-index:4;top:12mm;right:20mm;width:20mm;height:20mm;border-radius:50%;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:.4mm;color:var(--onyx);
}
.t-moonlight .ml-years::before{
  content:"";position:absolute;inset:0;border-radius:50%;
  border:1px dashed var(--blue);filter:brightness(.72);
}
.t-moonlight .ml-years b{font-family:var(--disp);font-weight:800;font-size:14pt;line-height:.86;letter-spacing:-.05em}
.t-moonlight .ml-years span{font-family:var(--mono);font-size:3.6pt;letter-spacing:.2em;text-transform:uppercase;opacity:.72}

/* 标题区 */
.t-moonlight .ml-copy{position:relative;z-index:3}
.t-moonlight .ml-kicker{
  display:flex;flex-wrap:wrap;align-items:center;gap:.55em;
  font-family:var(--mono);font-size:4.4pt;letter-spacing:.18em;text-transform:uppercase;color:var(--smokey-l);
}
.t-moonlight .ml-kicker i{width:1.5mm;height:1.5mm;background:var(--blue);transform:rotate(45deg);flex:0 0 auto}
.t-moonlight .ml-kicker .sep{color:var(--onyx-4);margin-right:.4em}
.t-moonlight .ml-name-cn{font-family:var(--cn);font-size:6.4pt;font-weight:700;letter-spacing:.14em;color:var(--blue)}

/* 三行叠排：压缩 / 负字距 / 行高 .78 / 左侧出血 */
.t-moonlight .ml-mega{
  line-height:.78;letter-spacing:-.045em;text-transform:uppercase;
  font-family:var(--disp);font-weight:800;margin:2.2mm 0 0 -1.2mm;
}
.t-moonlight .ml-ln{
  display:block;white-space:nowrap;font-size:17mm;color:var(--paper);
  transform:scaleX(.95);transform-origin:left center;
}
.t-moonlight .ml-ln-cn{
  font-family:var(--cn);font-weight:800;font-size:11.4mm;line-height:.86;
  letter-spacing:.02em;color:var(--blue);margin-top:.5mm;transform:scaleX(.98);
}

.t-moonlight .ml-role{
  display:flex;flex-wrap:wrap;align-items:baseline;gap:.8em;
  margin-top:2mm;padding-top:1.5mm;border-top:1px solid var(--line);max-width:118mm;
}
.t-moonlight .ml-role-cn{font-family:var(--cn);font-size:8.2pt;font-weight:700;letter-spacing:.14em;color:var(--paper)}
.t-moonlight .ml-role-en{font-family:var(--disp);font-weight:700;font-size:6.2pt;letter-spacing:.16em;text-transform:uppercase;color:var(--blue)}
.t-moonlight .ml-role-note{font-family:var(--mono);font-size:4.2pt;letter-spacing:.14em;text-transform:uppercase;color:var(--smokey-l);margin-left:auto}

/* 胶囊贴纸 */
.t-moonlight .ml-pills{display:flex;flex-wrap:wrap;gap:1.3mm;margin-top:2mm;max-width:178mm}
.t-moonlight .ml-pill{
  --r:0deg;
  display:inline-flex;align-items:center;gap:.5em;
  padding:.58em .9em;border-radius:999px;
  border:1px solid var(--smokey-l);background:rgba(17,17,17,.7);
  font-family:var(--mono);font-size:4.8pt;letter-spacing:.04em;line-height:1;
  text-transform:uppercase;color:var(--paper);white-space:nowrap;
  transform:rotate(var(--r));
}
.t-moonlight .ml-pill::before{content:"";width:1mm;height:1mm;background:var(--blue);border-radius:.2mm;flex:0 0 auto}
.t-moonlight .ml-pill.solid{background:var(--blue);border-color:var(--blue);color:var(--onyx);font-weight:700}
.t-moonlight .ml-pill.solid::before{background:var(--onyx)}
.t-moonlight .ml-pill.smoke{background:var(--smokey);border-color:var(--smokey)}
.t-moonlight .ml-pill.smoke::before{background:var(--paper)}
.t-moonlight .ml-pills li:nth-child(1) .ml-pill{--r:-1.6deg}
.t-moonlight .ml-pills li:nth-child(2) .ml-pill{--r:1.3deg}
.t-moonlight .ml-pills li:nth-child(3) .ml-pill{--r:-1.1deg}
.t-moonlight .ml-pills li:nth-child(4) .ml-pill{--r:1.5deg}
.t-moonlight .ml-pills li:nth-child(5) .ml-pill{--r:-1.4deg}
.t-moonlight .ml-pills li:nth-child(6) .ml-pill{--r:1.1deg}
.t-moonlight .ml-pills li:nth-child(7) .ml-pill{--r:-1.2deg}

/* ==========================================================================
   2. 数据条 —— var(--blue) 大面积色块 + Onyx 反切数字
   ========================================================================== */
.t-moonlight .ml-strip{
  display:flex;align-items:stretch;flex:0 0 auto;
  background:var(--blue);color:var(--onyx);
  border-bottom:1px solid var(--onyx);
}
.t-moonlight .ml-stat{display:flex;align-items:baseline;gap:1.2mm;padding:2.1mm 3.6mm;border-right:1px solid rgba(17,17,17,.24)}
.t-moonlight .ml-stat b{font-family:var(--disp);font-weight:800;font-size:15pt;line-height:.82;letter-spacing:-.03em}
.t-moonlight .ml-stat span{font-family:var(--mono);font-size:4.2pt;letter-spacing:.16em;text-transform:uppercase}
.t-moonlight .ml-statnote{
  flex:1 1 auto;min-width:40mm;display:flex;align-items:center;justify-content:flex-end;
  padding:0 var(--pad);font-family:var(--mono);font-size:4.2pt;letter-spacing:.14em;
  text-transform:uppercase;text-align:right;
}

/* ==========================================================================
   3. BODY —— 左：履历 + 项目 / 右：技术栈 + 证书 + 规格
   ========================================================================== */
.t-moonlight .ml-body{
  flex:1 1 auto;min-height:0;
  display:grid;
  grid-template-columns:minmax(0,1fr) 63mm;
  grid-template-areas:"profile profile" "main side";
  gap:2.4mm 3mm;
  padding:2.6mm var(--pad) 2mm;
}
.t-moonlight .ml-profile{grid-area:profile}
.t-moonlight .ml-main{grid-area:main;display:flex;flex-direction:column;gap:2.8mm;min-width:0;min-height:0}
.t-moonlight .ml-side{grid-area:side;display:flex;flex-direction:column;gap:2mm;min-width:0;min-height:0;align-self:stretch}

/* ---- 面板 ---- */
.t-moonlight .ml-panel{
  position:relative;min-width:0;
  background:var(--onyx-2);border:1px solid var(--line);border-radius:2.2mm;
  padding:2.2mm 2.6mm;overflow:hidden;
}
.t-moonlight .ml-profile{padding:2.4mm 3mm}

/* 面板头：01. / EN / ZH / rule / dot / meta */
.t-moonlight .ml-ph{display:flex;align-items:center;gap:1.1mm;margin-bottom:1.8mm}
.t-moonlight .ml-no{font-family:var(--disp);font-weight:800;font-size:11.5pt;line-height:.8;letter-spacing:-.04em;color:var(--blue)}
.t-moonlight .ml-en{font-family:var(--mono);font-size:5.4pt;letter-spacing:.16em;text-transform:uppercase;color:var(--paper);font-weight:500}
.t-moonlight .ml-zh{font-family:var(--cn);font-size:5.4pt;font-weight:600;letter-spacing:.1em;color:var(--blue);white-space:nowrap}
.t-moonlight .ml-rule{flex:1 1 auto;height:1px;background:var(--line);min-width:2mm}
.t-moonlight .ml-dot{width:1.2mm;height:1.2mm;background:var(--blue);transform:rotate(45deg);flex:0 0 auto}
.t-moonlight .ml-meta{font-family:var(--mono);font-size:4.1pt;letter-spacing:.12em;text-transform:uppercase;color:var(--smokey-l);white-space:nowrap}

/* ---- 01 PROFILE ---- */
.t-moonlight .ml-profile-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(43mm,.82fr);gap:4mm;align-items:center}
.t-moonlight .ml-quote{font-size:7.9pt;line-height:1.66;letter-spacing:.01em;color:rgba(242,243,236,.94)}
.t-moonlight .ml-quote b{font-family:var(--mono);font-size:.9em;font-weight:500;color:var(--blue)}
.t-moonlight .ml-pmeta-wrap{min-width:0;padding-left:3.4mm;border-left:1px solid var(--line)}
.t-moonlight .ml-pmeta{display:flex;flex-wrap:wrap;gap:.9mm}
.t-moonlight .ml-mini{
  font-family:var(--mono);font-size:4.1pt;letter-spacing:.05em;text-transform:uppercase;
  border:1px solid var(--smokey-l);border-radius:999px;padding:.3em .58em;color:var(--smokey-l);
}
.t-moonlight .ml-mini.on{border-color:var(--blue);color:var(--blue)}
.t-moonlight .ml-pnote{
  margin-top:1.4mm;font-family:var(--mono);font-size:4pt;line-height:1.55;letter-spacing:.1em;
  text-transform:uppercase;color:var(--smokey-l);
}

/* ---- 章节头（02 EXPERIENCE / 03 SELECTED WORK） ---- */
.t-moonlight .ml-shead{display:flex;align-items:center;gap:1.3mm;margin-bottom:2mm}
.t-moonlight .ml-sno{font-family:var(--disp);font-weight:800;font-size:10.5pt;line-height:.8;letter-spacing:-.05em;color:var(--blue)}
.t-moonlight .ml-sen{
  font-family:var(--disp);font-weight:800;text-transform:uppercase;font-size:13pt;line-height:.8;
  letter-spacing:-.03em;color:var(--paper);transform:scaleX(.94);transform-origin:left center;white-space:nowrap;
}
.t-moonlight .ml-szh{font-family:var(--cn);font-size:5.2pt;font-weight:600;letter-spacing:.16em;color:var(--blue);white-space:nowrap}
.t-moonlight .ml-srule{flex:1 1 auto;height:1px;background:var(--line);min-width:3mm}
.t-moonlight .ml-smeta{font-family:var(--mono);font-size:4pt;letter-spacing:.11em;text-transform:uppercase;color:var(--smokey-l);white-space:nowrap}

/* ---- 02 EXPERIENCE ---- */
.t-moonlight .ml-job{
  position:relative;overflow:hidden;
  background:var(--onyx-2);border:1px solid var(--line);border-radius:2mm;
}
.t-moonlight .ml-job + .ml-job{margin-top:1.7mm}
.t-moonlight .ml-job.cur{border-color:var(--blue)}
.t-moonlight .ml-jband{display:flex;align-items:center;flex-wrap:wrap;gap:1.1mm;padding:1.2mm 1.8mm;background:var(--onyx-3)}
.t-moonlight .ml-job.cur .ml-jband{background:var(--blue);color:var(--onyx)}
.t-moonlight .ml-jidx{font-family:var(--disp);font-weight:800;font-size:8.6pt;line-height:.8;letter-spacing:-.04em;color:var(--blue)}
.t-moonlight .ml-job.cur .ml-jidx{color:var(--onyx)}
.t-moonlight .ml-jrole{display:flex;align-items:baseline;gap:.9mm;flex-wrap:wrap}
.t-moonlight .ml-jrole b{font-family:var(--cn);font-size:6.8pt;font-weight:700;letter-spacing:.03em}
.t-moonlight .ml-jrole span{font-family:var(--mono);font-size:4.1pt;letter-spacing:.1em;text-transform:uppercase;color:var(--smokey-l)}
.t-moonlight .ml-job.cur .ml-jrole span{color:rgba(17,17,17,.7)}
.t-moonlight .ml-curtag{
  font-family:var(--mono);font-size:3.6pt;letter-spacing:.1em;text-transform:uppercase;
  background:var(--onyx);color:var(--blue);border-radius:999px;padding:.3em .5em;
}
.t-moonlight .ml-jco{font-family:var(--mono);font-size:4.1pt;letter-spacing:.04em;text-transform:uppercase;color:rgba(242,243,236,.84);margin-left:auto}
.t-moonlight .ml-job.cur .ml-jco{color:rgba(17,17,17,.82)}
.t-moonlight .ml-jdate{
  font-family:var(--mono);font-size:4.1pt;letter-spacing:.03em;white-space:nowrap;
  border:1px solid var(--smokey-l);border-radius:999px;padding:.3em .55em;color:var(--paper);
}
.t-moonlight .ml-job.cur .ml-jdate{border-color:rgba(17,17,17,.5);color:var(--onyx)}
.t-moonlight .ml-bul{display:flex;flex-direction:column;gap:.6mm;padding:1.3mm 1.8mm 1.5mm}
.t-moonlight .ml-bul li{
  position:relative;padding-left:2.4mm;font-size:6.5pt;line-height:1.48;
  color:rgba(242,243,236,.9);letter-spacing:.005em;
}
.t-moonlight .ml-bul li::before{content:"";position:absolute;left:0;top:1.05mm;width:1mm;height:1mm;background:var(--blue);transform:rotate(45deg)}
.t-moonlight .ml-bul li b{font-family:var(--mono);font-size:.92em;font-weight:500;color:var(--blue);white-space:nowrap}

/* ---- 03 SELECTED WORK ---- */
.t-moonlight .ml-projs{display:grid;grid-template-columns:1fr 1fr;gap:1.8mm}
.t-moonlight .ml-proj{
  position:relative;overflow:hidden;
  background:var(--onyx-2);border:1px solid var(--line);border-radius:1.6mm;
  padding:1.7mm 1.9mm 1.8mm 2.3mm;
}
.t-moonlight .ml-proj::before{content:"";position:absolute;left:0;top:0;bottom:0;width:.7mm;background:var(--blue)}
.t-moonlight .ml-ptop{display:flex;align-items:baseline;justify-content:space-between;gap:1mm}
.t-moonlight .ml-pcode{font-family:var(--mono);font-size:4.1pt;letter-spacing:.11em;color:var(--blue)}
.t-moonlight .ml-pname{
  font-family:var(--disp);font-weight:800;font-size:8.6pt;line-height:.9;letter-spacing:-.01em;
  text-transform:uppercase;color:var(--paper);margin-top:.9mm;
}
.t-moonlight .ml-pkind{font-family:var(--mono);font-size:4pt;letter-spacing:.07em;text-transform:uppercase;color:var(--smokey-l);margin-top:1.1mm}
.t-moonlight .ml-pdesc{font-size:6.1pt;line-height:1.42;color:rgba(242,243,236,.84);margin-top:1.1mm}
.t-moonlight .ml-pdesc b{font-family:var(--mono);font-size:.92em;color:var(--blue)}
.t-moonlight .ml-pnums{
  display:flex;flex-wrap:wrap;gap:2.4mm;margin-top:1.3mm;padding-top:1.1mm;
  border-top:1px dashed var(--line);
}
.t-moonlight .ml-pnums span{font-family:var(--mono);font-size:4pt;letter-spacing:.03em;text-transform:uppercase;color:var(--smokey-l)}
.t-moonlight .ml-pnums b{
  display:block;font-family:var(--disp);font-weight:800;font-size:8pt;line-height:1;
  letter-spacing:-.02em;color:var(--paper);margin-bottom:.5mm;
}

/* ---- 04 STACK（大面积 var(--blue) 色块） ---- */
.t-moonlight .ml-stack{background:var(--blue);border-color:var(--blue);color:var(--onyx)}
.t-moonlight .ml-stack .ml-no,.t-moonlight .ml-stack .ml-en,
.t-moonlight .ml-stack .ml-zh{color:var(--onyx)}
.t-moonlight .ml-stack .ml-rule{background:rgba(17,17,17,.35)}
.t-moonlight .ml-stack .ml-dot{background:var(--onyx)}
.t-moonlight .ml-sg{display:block;margin-top:1.3mm}
.t-moonlight .ml-sg:first-of-type{margin-top:0}
.t-moonlight .ml-sgl{
  display:block;margin-bottom:.55mm;font-family:var(--mono);font-size:3.8pt;
  letter-spacing:.14em;text-transform:uppercase;color:rgba(17,17,17,.72);
}
.t-moonlight .ml-tags{display:flex;flex-wrap:wrap;gap:.6mm}
.t-moonlight .ml-tag{
  font-family:var(--mono);font-size:4.4pt;letter-spacing:.005em;line-height:1;
  padding:.5em .66em;border-radius:999px;border:1px solid var(--onyx);
  color:var(--onyx);background:transparent;white-space:nowrap;
  transform:rotate(var(--r,0deg));
}
.t-moonlight .ml-tag.fill{background:var(--onyx);color:var(--blue)}
.t-moonlight .ml-tags .ml-tag:nth-child(2){--r:-1.8deg}
.t-moonlight .ml-tags .ml-tag:nth-child(3){--r:1.5deg}
.t-moonlight .ml-tags .ml-tag:nth-child(4){--r:-1.2deg}
.t-moonlight .ml-skills{margin-top:1.6mm;padding-top:1.2mm;border-top:1px solid rgba(17,17,17,.28);display:flex;flex-direction:column;gap:.8mm}
.t-moonlight .ml-skill{display:flex;align-items:center;gap:1.4mm;font-family:var(--mono);font-size:4pt;letter-spacing:.06em;text-transform:uppercase}
.t-moonlight .ml-skill span{flex:0 0 11mm}
.t-moonlight .ml-skill i{flex:1 1 auto;height:1.1mm;background:rgba(17,17,17,.18);border-radius:.6mm;position:relative;overflow:hidden}
.t-moonlight .ml-skill i b{position:absolute;left:0;top:0;bottom:0;background:var(--onyx);border-radius:.6mm}
.t-moonlight .ml-stack-foot{display:flex;align-items:center;justify-content:space-between;gap:1mm;margin-top:1.4mm;font-family:var(--mono);font-size:3.8pt;letter-spacing:.1em;text-transform:uppercase}
.t-moonlight .ml-checker{
  display:block;width:16mm;height:4.2mm;
  background:repeating-conic-gradient(var(--onyx) 0% 25%,transparent 0% 50%) 0 0 / 2.1mm 2.1mm;
  border:1px solid var(--onyx);
}
.t-moonlight .ml-spec .ml-checker{background-image:repeating-conic-gradient(var(--smokey-l) 0% 25%,transparent 0% 50%);border-color:var(--smokey-l)}

/* ---- 05 CREDENTIALS ---- */
.t-moonlight .ml-citem{margin-top:.4mm}
.t-moonlight .ml-crow{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:1mm}
.t-moonlight .ml-crow b{font-family:var(--cn);font-size:6.8pt;font-weight:700;letter-spacing:.03em}
.t-moonlight .ml-cyr{font-family:var(--mono);font-size:4.1pt;letter-spacing:.05em;color:var(--blue);white-space:nowrap}
.t-moonlight .ml-cs{font-family:var(--mono);font-size:4.1pt;letter-spacing:.05em;text-transform:uppercase;color:var(--smokey-l);margin-top:.6mm}
.t-moonlight .ml-cd{font-size:5.6pt;line-height:1.45;color:rgba(242,243,236,.8);margin-top:.5mm}
.t-moonlight .ml-clist{
  margin-top:1.5mm;padding-top:1.1mm;border-top:1px solid var(--line-soft);
  display:flex;flex-direction:column;gap:.9mm;
}
.t-moonlight .ml-clist li{
  position:relative;padding-left:2.2mm;font-family:var(--mono);font-size:4.4pt;
  line-height:1.42;letter-spacing:.005em;color:rgba(242,243,236,.88);
}
.t-moonlight .ml-clist li::before{content:"";position:absolute;left:0;top:.85mm;width:.9mm;height:.9mm;background:var(--blue);transform:rotate(45deg)}
.t-moonlight .ml-clist b{font-size:.95em;font-weight:500;color:var(--blue)}

/* ---- 06 SPEC ---- */
.t-moonlight .ml-spec-list{display:flex;flex-direction:column;gap:1.2mm;font-family:var(--mono);font-size:4.2pt}
.t-moonlight .ml-spec-list div{display:flex;justify-content:space-between;gap:2mm}
.t-moonlight .ml-spec-list dt{color:var(--smokey-l);text-transform:uppercase;letter-spacing:.1em;white-space:nowrap}
.t-moonlight .ml-spec-list dd{margin:0;color:var(--paper);text-align:right}
.t-moonlight .ml-spec .ml-checker{margin-top:1.4mm}
.t-moonlight .ml-rail{
  display:flex;align-items:center;gap:1.2mm;margin-top:auto;padding-top:1.4mm;
  font-family:var(--mono);font-size:3.8pt;letter-spacing:.12em;text-transform:uppercase;color:var(--smokey-l);
}
.t-moonlight .ml-rail i{display:block;width:1.2mm;height:1.2mm;background:var(--blue);transform:rotate(45deg);flex:0 0 auto}
.t-moonlight .ml-rail .line{flex:1 1 auto;height:1px;background:var(--line)}
.t-moonlight .ml-rail b{font-weight:400;color:var(--blue)}

/* ==========================================================================
   4. FOOTER —— 流程条 / 色卡 / 出血大字
   ========================================================================== */
.t-moonlight .ml-foot{position:relative;flex:0 0 auto;overflow:hidden;border-top:1px solid var(--blue);background:var(--onyx-2)}
.t-moonlight .ml-process{
  display:flex;flex-wrap:wrap;align-items:center;gap:.5mm 2.4mm;
  padding:1.3mm var(--pad);border-bottom:1px solid var(--line);
  font-family:var(--mono);font-size:4.1pt;letter-spacing:.13em;text-transform:uppercase;color:var(--smokey-l);
}
.t-moonlight .ml-process b{font-weight:400;color:var(--blue)}
.t-moonlight .ml-ptag{margin-left:auto;color:var(--blue)}
.t-moonlight .ml-foot-main{
  display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;
  gap:3mm;padding:2.2mm var(--pad) 2.4mm;
}
.t-moonlight .ml-contactcard{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:84mm;border:1px solid var(--line)}
.t-moonlight .ml-cc{padding:1.2mm 1.5mm;display:flex;flex-direction:column;gap:.45mm;min-width:0}
.t-moonlight .ml-cc .no{font-family:var(--mono);font-size:3.6pt;letter-spacing:.1em;opacity:.75}
.t-moonlight .ml-cc .nm{font-family:var(--disp);font-weight:800;font-size:6.2pt;line-height:1;text-transform:uppercase;color:var(--blue)}
.t-moonlight .ml-cc .v{font-family:var(--mono);font-size:4.1pt;line-height:1.4;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.t-moonlight .ml-cc + .ml-cc{border-left:1px solid var(--line)}
.t-moonlight .ml-cc:first-child{background:var(--blue);color:var(--onyx)}
.t-moonlight .ml-cc:first-child .nm{color:var(--onyx)}
.t-moonlight .ml-foot-info{display:flex;flex-direction:column;gap:.8mm;font-family:var(--mono);font-size:4.1pt;letter-spacing:.06em;text-transform:uppercase;color:var(--smokey-l)}
.t-moonlight .ml-plate{
  display:flex;flex-direction:column;gap:.7mm;padding-left:2.6mm;border-left:1px solid var(--line);
  font-family:var(--mono);font-size:3.9pt;line-height:1.4;letter-spacing:.07em;
  text-transform:uppercase;color:var(--smokey-l);
}
.t-moonlight .ml-plate b{font-family:var(--mono);font-size:4.8pt;font-weight:500;letter-spacing:.14em;color:var(--paper)}
.t-moonlight .ml-fline{display:flex;flex-wrap:wrap;gap:.8mm;align-items:center}
.t-moonlight .ml-fline .sq{width:1.1mm;height:1.1mm;background:var(--blue);transform:rotate(45deg);flex:0 0 auto}
.t-moonlight .ml-fline em{font-style:normal;color:var(--paper)}
.t-moonlight .ml-bleed{
  font-family:var(--disp);font-weight:800;font-size:22mm;line-height:.74;
  letter-spacing:-.045em;text-transform:uppercase;color:var(--blue);
  white-space:nowrap;margin-left:-1mm;margin-bottom:-.12em;
  transform:scaleX(.99);transform-origin:left top;user-select:none;
}
/* ==========================================================================
   6. DUPLEX PAGE 2 —— 项目档案附录页
   ========================================================================== */
.t-moonlight .ml-p2head{
  position:relative;z-index:3;flex:0 0 auto;
  padding:7mm var(--pad) 0;
}
.t-moonlight .ml-body--p2{grid-template-areas:"main side"}
.t-moonlight .ml-body--p2 .ml-main .ml-rail{margin-top:auto}
`;
