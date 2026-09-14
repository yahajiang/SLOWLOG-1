import fs from "fs";
const path = "public/design/gallery.html";
let h = fs.readFileSync(path, "utf8");
const start = h.indexOf('    <h2 class="m-h2">关于');
const endMarker = "    </div>`;\n  document.getElementById(\"mask\").classList.add(\"open\");";
// find end of about function body
const fn = h.indexOf("function openAbout(){");
const after = h.indexOf("document.body.style.overflow=\"hidden\";\n}", fn);
if (fn < 0) throw new Error("no openAbout");
// replace from first m-h2 inside about until closing of innerHTML template
const s = h.indexOf("innerHTML=`", fn) + "innerHTML=`".length;
const e = h.indexOf("`;", s);
if (s < 0 || e < 0) throw new Error("template bounds");
const replacement = `
    <h2 class="m-h2">设计蓝图 · 慢日志 UI</h2>
    <div class="m-meta"><span class="tag">DESIGN.md v1.6</span><span class="tag">46 组件</span><span class="tag">与真代码同源</span></div>
    <div class="ab-card">
      <div class="ab-k mono">§ Identity · 你是谁在设计</div>
      <p class="ab-lead" style="margin:0">Editorial Web Designer — 画廊是设计契约的展品柜，不是营销落地页。每条提示词都应对齐真站源码路径与令牌。</p>
    </div>
    <div class="ab-card">
      <div class="ab-k mono">§ Objective · 单一目标</div>
      <p class="ab-lead" style="margin:0">让访客 10 秒看懂纸感排印语言，并把任意组件提示词复制给 AI，生成同源 UI。</p>
    </div>
    <div class="ab-card">
      <div class="ab-k mono">§ Visual Foundations · 令牌与字体</div>
      <dl class="bp-grid">
        <dt>Paper</dt><dd><span class="swatch" style="background:#fefdfa"></span><span class="mono">#fefdfa</span> 浅 / <span class="swatch" style="background:#14110d"></span><span class="mono">#14110d</span> 暗</dd>
        <dt>Ink</dt><dd><span class="mono">#1c1c1e</span> · Muted <span class="mono">#6e6e73</span> · Border <span class="mono">#e5e5e7</span></dd>
        <dt>Accent</dt><dd><span class="swatch" style="background:#4a6fb5"></span><span class="mono">oklch(.55 .15 250)</span> 仅点缀，不做铺底</dd>
        <dt>Type</dt><dd>serif = Cormorant + Noto Serif SC（标题）· sans = Plus Jakarta · mono = JetBrains 11–12px / .14em</dd>
        <dt>Form</dt><dd>直角 rounded-none · 1px var(--yh-border) · 纸面 --dash-card · 无圆角阴影卡</dd>
      </dl>
    </div>
    <div class="ab-card">
      <div class="ab-k mono">§ Motion · 动效契约</div>
      <dl class="bp-grid">
        <dt>入场</dt><dd>opacity 淡入 1.6–1.8s；禁描线冲刺</dd>
        <dt>循环</dt><dd>cover-sway 只动 translateY(±1.5px)；关键帧禁止写死 opacity:1</dd>
        <dt>错峰</dt><dd>--cm-dur / --cm-delay 按文章 hash，多元素各自轻缓</dd>
        <dt>Reduced</dt><dd>prefers-reduced-motion 全关；静态直出</dd>
      </dl>
    </div>
    <div class="ab-card">
      <div class="ab-k mono">§ Cover System · 封面世界</div>
      <dl class="bp-grid">
        <dt>分类</dt><dd>只定色 art-*（paper/ink/wash/accent）</dd>
        <dt>母题</dt><dd>resolveTagSymbol → 8 族签名章 + mono 代号；未命中走通用几何</dd>
        <dt>构图</dt><dd>hash(title+id, 8) 轮换 8 套密拼贴；大面积色块改描边或 opacity≤0.22</dd>
        <dt>底栏</dt><dd>一行 ABBR · noNum · TAG（剥 []）</dd>
      </dl>
    </div>
    <div class="ab-card">
      <div class="ab-k mono">§ Decision Trace · 关键决策</div>
      <div class="bp-trace"><span class="q">DECISION</span>封面从 ArticleArt 切到 CoverArt —— 主站已切换，画廊不同步会误导 AI</div>
      <div class="bp-trace"><span class="q">DECISION</span>循环关键帧不写死 opacity —— 淡描边被拉成满黑会突然出现</div>
      <div class="bp-trace"><span class="q">DECISION</span>可交互预览真点击；不可交互用循环动效 —— 展品柜要能试</div>
      <div class="bp-trace"><span class="q">TRADEOFF</span>不做圆角卡片与渐变 hero —— 编辑气质优先</div>
    </div>
    <div class="ab-card" style="margin-bottom:0">
      <div class="ab-k mono">§ Workflow · 怎么用</div>
      <div class="ab-list" style="border:none">
        <div>点卡片 → 复制提示词 → 交给任意 AI 生成同源 UI</div>
        <div>改主站组件后同步画廊条目与本蓝图契约</div>
        <div>仓库 · <span class="mono">yahajiang/SLOWLOG-1</span> · <span class="mono">localhost:3000/design/gallery.html</span></div>
        <div>© 2026 Yahajiang · SlowLog</div>
      </div>
    </div>`;
h = h.slice(0, s) + replacement + h.slice(e);
fs.writeFileSync(path, h);
console.log("about rewritten");
