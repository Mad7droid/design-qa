// Store listing images built from real pages on madhavnair.in with the actual extension UI (picker, note box, panel).
// Usage: node scripts/store-shots.mjs  → .context/release/assets/0[1-5]-*.png (1280×800, no alpha)
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';
import {markdown} from '../extension/report.js';
const out='.context/release/assets';await fs.mkdir(out,{recursive:true});
// Older demo-site screenshots from store-assets.mjs are replaced by these.
for(const old of ['01-review-dark.png','02-capture-notes.png','03-review-light.png'])await fs.rm(path.join(out,old),{force:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const site=await browser.newContext({viewport:{width:1000,height:720},deviceScaleFactor:2,bypassCSP:true});
const b64=buf=>'data:image/png;base64,'+buf.toString('base64');
const logo=b64(await fs.readFile('extension/logo.svg')).replace('image/png','image/svg+xml');

// Capture a site page, optionally running the real picker + note box on an element.
async function shoot(url,{dark=true,pick,note,priority,hoverOnly,scroll=0}={}){
  const p=await site.newPage();await p.emulateMedia({colorScheme:dark?'dark':'light'});
  await p.goto(url,{waitUntil:'networkidle'});await p.waitForTimeout(500);
  // The site keeps its own theme switch; force its dark mode so every listing image shows the dark site.
  if(dark&&await p.evaluate(()=>document.documentElement.dataset.mode==='light'))await p.click('#theme-toggle');
  await p.mouse.move(2,700);await p.waitForTimeout(700);
  if(scroll)await p.mouse.wheel(0,scroll),await p.waitForTimeout(600);
  const plain=await p.screenshot();let rect=null;
  if(pick){
    await p.evaluate(()=>{window.chrome={runtime:{onMessage:{addListener(){},removeListener(){}},sendMessage:async m=>m.type==='selection'?{ok:true,id:'demo'}:{ok:true}},storage:{local:{get:async()=>({}),set:async()=>{}}}};});
    await p.addScriptTag({path:'extension/format.js'});await p.addScriptTag({path:'extension/picker.js'});
    const el=pick(p);await el.hover();await p.waitForTimeout(250);
    rect=await el.evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
    if(!hoverOnly){await p.keyboard.press('Enter');await p.waitForTimeout(400);if(priority)await p.keyboard.press(`Alt+Digit${priority}`);if(note)for(const [i,line] of note.split('\n').entries()){if(i)await p.keyboard.press('Shift+Enter');await p.keyboard.type(line,{delay:2});}await p.waitForTimeout(300);}
  }
  const shot=await p.screenshot();await p.close();return {plain:b64(plain),shot:b64(shot),rect,url,title:''};
}
const design=await shoot('https://madhavnair.in/design/',{pick:p=>p.locator('a.btn',{hasText:'Download the zip'}).first(),note:'Download button needs **more contrast** on dark\n- use the `--accent-strong` token\n- min height 44px #accessibility',priority:1});
const notes=await shoot('https://madhavnair.in/notes/mcp-workflow/',{pick:p=>p.locator('h1').first(),hoverOnly:true});
const prec=await shoot('https://madhavnair.in/playground/precipice/',{pick:p=>p.locator('h1').first(),note:'Title feels heavy next to the canvas preview — try **48px / 600** and tighten the gap to 16px #typography',priority:2});

// Seeded review session shared by every panel render.
const vp={width:1000,height:720};
const findings=[
 {id:'f1',url:'https://madhavnair.in/design/',pageTitle:'Agentic Design System · Madhav Nair',component:'Link · “Download the zip”',componentSource:'Role and text',severity:'High',tags:['Accessibility'],comment:'Download button needs **more contrast** on dark\n- use the `--accent-strong` token\n- min height 44px',links:['https://www.figma.com/design/hyper-spec-demo'],selector:'main a.btn-primary',rect:design.rect,viewport:vp,screenshot:design.plain,capturedAt:'2026-11-07T12:00:00Z',specs:{'font-size':'14px','padding':'10px 16px','background-color':'rgb(212, 255, 74)','border-radius':'8px'}},
 {id:'f2',url:'https://madhavnair.in/notes/mcp-workflow/',pageTitle:'Two small MCPs that took the busywork out of my week · Madhav Nair',component:'Heading · “Two small MCPs that took…”',componentSource:'Role and text',severity:'Medium',tags:['Typography'],comment:'Headline wraps to 3 lines at 1000px — cap at **2 lines** with `max-width: 18ch`',links:[],selector:'h1',rect:notes.rect,viewport:vp,screenshot:notes.plain,capturedAt:'2026-11-07T12:03:00Z',specs:{'font-size':'48px','line-height':'52px'}},
 {id:'f3',url:'https://madhavnair.in/playground/precipice/',pageTitle:'Precipice: a canvas for product ideas · Madhav Nair',component:'Heading · “Precipice”',componentSource:'Role and text',severity:'Medium',tags:['Typography','Spacing'],comment:'Title feels heavy next to the canvas preview — try **48px / 600** and tighten the gap to 16px',links:['https://www.figma.com/design/precipice'],selector:'h1',rect:prec.rect,viewport:vp,screenshot:prec.plain,capturedAt:'2026-11-07T12:06:00Z',specs:{'font-size':'56px','font-weight':'700'}},
 {id:'f4',url:'https://madhavnair.in/design/',pageTitle:'Agentic Design System · Madhav Nair',component:'Text · “Tokens, themes and component…”',componentSource:'Role and text',severity:'Low',tags:['Copy'],comment:'Shorten to one line on desktop',links:[],selector:'main p',rect:null,viewport:vp,screenshot:design.plain,capturedAt:'2026-11-07T12:08:00Z',specs:{}},
];
const session={id:'demo',name:'madhavnair.in review · Nov 7',createdAt:'2026-11-07T12:00:00Z',links:['https://www.figma.com/design/madhavnair-site'],findings};

const panelCtx=await browser.newContext({viewport:{width:400,height:800},deviceScaleFactor:2});
await panelCtx.route('https://hyper.local/**',async r=>{const n=new URL(r.request().url()).pathname.slice(1);try{await r.fulfill({body:await fs.readFile('extension/'+n),contentType:n.endsWith('.svg')?'image/svg+xml':n.endsWith('.css')?'text/css':n.endsWith('.js')?'text/javascript':'text/html'});}catch{await r.fulfill({status:404,body:''});}});
async function panel({theme='dark',draft=null,filter,scrollTo,height=800}={}){
  const p=await panelCtx.newPage();await p.setViewportSize({width:400,height});
  await p.addInitScript(([s,d,t])=>{const st={session:s,theme:t,...(d?{draft:d}:{})};localStorage.setItem('hyper-theme',t);const read=()=>st;window.chrome={storage:{local:{get:async()=>read(),set:async v=>Object.assign(st,v),remove:async k=>{delete st[k];}},onChanged:{addListener(){}},session:{get:async()=>({}),set:async()=>{}}},runtime:{sendMessage:async()=>({ok:true}),onMessage:{addListener(){}},connect:()=>({onDisconnect:{addListener(){}}})},windows:{},tabs:{},scripting:{}};},[session,draft,theme]);
  await p.goto('https://hyper.local/panel.html');await p.waitForSelector(draft?'#editor:not([hidden])':'.finding');await p.waitForTimeout(500);
  if(filter)await p.getByRole('button',{name:filter}).click();
  if(scrollTo)await p.locator(scrollTo).evaluate(e=>e.scrollIntoView({block:'start'}));
  await p.waitForTimeout(200);const img=b64(await p.screenshot());await p.close();return img;
}
const pDark=await panel({scrollTo:'#findingsSection'});
const pEditor=await panel({draft:{...findings[1],id:'d2',comment:'Headline wraps to 3 lines at 1000px — cap at **2 lines** with `max-width: 18ch`'}});
const pLight=await panel({theme:'light',scrollTo:'#findingsSection'});
const pLightTop=await panel({theme:'light'});
const pDarkTop=await panel();

// Composition: brand canvas, headline, and a browser window with the page + side panel.
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
const css=`*{box-sizing:border-box}body{margin:0;width:1280px;height:800px;overflow:hidden;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.bg{position:absolute;inset:0;background:#0e0e10;background-image:radial-gradient(#ffffff0d 1px,transparent 1px);background-size:22px 22px}
.light .bg{background:#f4f3ef;background-image:radial-gradient(#0000000f 1px,transparent 1px)}
.cap{position:absolute;left:64px;top:44px;right:64px;display:flex;align-items:flex-end;justify-content:space-between;gap:24px}
.cap h1{margin:0;font-size:38px;line-height:1.1;letter-spacing:-.03em;font-weight:650;color:#efede7}.light .cap h1{color:#1d1d1b}
.cap p{margin:10px 0 0;font-size:16px;color:#9b9aa3;max-width:640px;line-height:1.45}.light .cap p{color:#5c5c55}
.brand{display:flex;align-items:center;gap:10px;color:#efede7;font-weight:600;font-size:15px;white-space:nowrap}.light .brand{color:#1d1d1b}.brand img{width:28px;height:28px}
.win{position:absolute;left:64px;right:64px;top:176px;bottom:-14px;border-radius:14px;overflow:hidden;background:#1b1b1e;box-shadow:0 30px 80px #0008,0 0 0 1px #ffffff14}.light .win{box-shadow:0 30px 70px #0002,0 0 0 1px #00000014;background:#fff}
.bar{height:38px;display:flex;align-items:center;gap:8px;padding:0 14px;background:#232327;border-bottom:1px solid #ffffff10}.light .bar{background:#ecebe6;border-color:#0000000f}
.dot{width:11px;height:11px;border-radius:50%;background:#ffffff26}.light .dot{background:#0000001f}
.url{margin-left:18px;flex:1;max-width:520px;height:24px;border-radius:7px;background:#ffffff0d;color:#b8b7bf;font-size:12px;display:flex;align-items:center;padding:0 12px}.light .url{background:#fff;color:#55554f}
.body{position:absolute;top:38px;left:0;right:0;bottom:0;display:flex}.site{flex:1;overflow:hidden;position:relative}.site img{position:absolute;top:0;left:0;width:100%}
.panel{width:340px;border-left:1px solid #ffffff12;overflow:hidden}.light .panel{border-color:#0000000f}.panel img{width:340px;display:block}`;
const shot=(o)=>`<!doctype html><html class="${o.light?'light':''}"><style>${css}</style><body><div class=bg></div>
<div class=cap><div><h1>${o.h}</h1><p>${o.p}</p></div><div class=brand><img src="${logo}">Hyper Spec</div></div>
<div class=win><div class=bar><span class=dot></span><span class=dot></span><span class=dot></span><span class=url>${o.url}</span></div>
<div class=body><div class=site><img src="${o.site}"></div><div class=panel><img src="${o.panel}"></div></div></div></body></html>`;
async function render(file,html){await page.setContent(html);await page.waitForTimeout(400);await page.screenshot({path:path.join(out,file),type:'png',omitBackground:false});}

await render('01-select-and-note.png',shot({h:'Point at it. Say what should change.',p:'Click any element on a live page and type your note right beside it — priority, tags and formatting included.',url:'madhavnair.in/design/',site:design.shot,panel:pDarkTop}));
await render('02-precise-selection.png',shot({h:'Pick the exact element, every time.',p:'A live label shows the element and its size. ↑/↓ moves to the parent or child. Specs and a marked screenshot are captured for you.',url:'madhavnair.in/notes/mcp-workflow/',site:notes.shot,panel:pEditor}));
await render('03-review-across-pages.png',shot({h:'One review across every page.',p:'Findings are grouped by page with thumbnails, priorities and Figma links. The panel comes in light and dark.',url:'madhavnair.in/playground/precipice/',site:prec.shot,panel:pLight}));

// 04: the export — the Markdown spec your AI agent reads.
const md=markdown(session,{screenshots:true}).split('\n').slice(0,58).join('\n');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const hl=s=>esc(s).replace(/^(#{1,3} .*)$/gm,'<b class=h>$1</b>').replace(/(\*\*[^*]+\*\*)/g,'<b>$1</b>').replace(/(`[^`]+`)/g,'<i class=c>$1</i>').replace(/^(- [A-Za-z ]+:)/gm,'<span class=k>$1</span>');
await render('04-export-spec.png',`<!doctype html><style>${css}
.ed{position:absolute;left:64px;top:176px;width:700px;bottom:-14px;border-radius:14px;background:#151517;box-shadow:0 30px 80px #0008,0 0 0 1px #ffffff14;overflow:hidden}
.ed .bar{justify-content:flex-start}.ed .url{max-width:300px}
pre{margin:0;padding:18px 22px;font:12.5px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;color:#c9c7c0;white-space:pre-wrap}
.h{color:#efede7}.k{color:#8f8e96}.c{font-style:normal;color:#d8c48f}b{color:#efede7}
.side{position:absolute;left:800px;right:64px;top:176px;display:grid;gap:14px}
.card{border-radius:12px;background:#19191c;border:1px solid #ffffff12;padding:18px 20px;color:#efede7}
.card h3{margin:0 0 6px;font-size:15px;font-weight:600}.card p{margin:0;font-size:13px;line-height:1.5;color:#9b9aa3}
.files{margin-top:10px;font:12px/1.8 ui-monospace,Menlo,monospace;color:#c9c7c0}.files span{color:#e34b30}
.term{font:12.5px/1.7 ui-monospace,Menlo,monospace;color:#c9c7c0}.term .p{color:#e34b30}</style><body><div class=bg></div>
<div class=cap><div><h1>Export a spec your AI can build from.</h1><p>Clean Markdown with selectors, styles, screenshots and your notes — ready for Claude Code, Codex or a teammate.</p></div><div class=brand><img src="${logo}">Hyper Spec</div></div>
<div class=ed><div class=bar><span class=dot></span><span class=dot></span><span class=dot></span><span class=url>madhavnair-in-review-2026-11-07-qa / report.md</span></div><pre>${hl(md)}</pre></div>
<div class=side><div class=card><h3>Copy or download</h3><p>Paste the Markdown straight into your agent, or export a ZIP.</p><div class=files>report.md<br>session.json<br>screenshots/<span>f1.png</span><br>screenshots/<span>f1-closeup.png</span></div></div>
<div class=card><h3>Hand it to your agent</h3><div class=term><span class=p>›</span> Fix every finding in report.md.<br>&nbsp;&nbsp;Match the selectors and screenshots.</div></div>
<div class=card><h3>Private by design</h3><p>Everything stays on your device. No account, no tracking, no automatic AI calls.</p></div></div></body>`);

// 05: branded — light and dark panels on a wireframe grid.
await render('05-brand-light-dark.png',`<!doctype html><style>${css}
.bg2{position:absolute;inset:0;background:linear-gradient(90deg,#f4f3ef 0 50%,#0e0e10 50%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(#80808018 1px,transparent 1px),linear-gradient(90deg,#80808018 1px,transparent 1px);background-size:40px 40px}
.mk{position:absolute;border:1.5px dashed #e34b3099;border-radius:6px}
.ph{position:absolute;top:120px;width:300px;border-radius:14px;overflow:hidden}.ph img{width:300px;display:block}
.l{left:250px;box-shadow:0 30px 70px #0002,0 0 0 1px #00000014}.d{left:730px;box-shadow:0 30px 80px #000a,0 0 0 1px #ffffff18}
.t{position:absolute;left:0;right:0;top:40px;text-align:center;font-size:15px;font-weight:600;letter-spacing:.02em}
.c1{position:absolute;left:64px;bottom:60px;width:150px;color:#1d1d1b}.c2{position:absolute;right:64px;bottom:60px;width:160px;color:#efede7;text-align:right}
.c1 b,.c2 b{display:block;font-size:22px;letter-spacing:-.02em;margin-bottom:6px}.c1 span,.c2 span{font-size:13px;line-height:1.5;opacity:.65}
.mid{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:120px;height:120px;border-radius:28px;background:#19191c;display:grid;place-items:center;box-shadow:0 20px 60px #0006,0 0 0 1px #ffffff1a}.mid img{width:120px;height:120px}
.cor{position:absolute;width:26px;height:26px;border:3px solid #e34b30}</style><body><div class=bg2></div><div class=grid></div>
<div class=t><span style="color:#1d1d1b">Hyper&nbsp;</span><span style="color:#efede7">Spec</span></div>
<div class="ph l"><img src="${pLightTop}"></div><div class="ph d"><img src="${pDarkTop}"></div>
<div class=mid><img src="${logo}"></div>
<div class=mk style="left:236px;top:106px;width:328px;height:640px"></div><div class=mk style="left:716px;top:106px;width:328px;height:640px;border-color:#e34b30aa"></div>
<div class=c1><b>Light</b><span>Select. Annotate. Export.</span></div><div class=c2><b>Dark</b><span>Turn any live page into a spec for AI.</span></div></body>`);

// Marquee promo tile 1400×560.
await page.setViewportSize({width:1400,height:560});
await page.setContent(`<!doctype html><style>${css}body{width:1400px;height:560px}.bg{background:#0e0e10;background-image:radial-gradient(#ffffff10 1px,transparent 1px);background-size:22px 22px}
.w{position:absolute;left:96px;top:50%;transform:translateY(-50%);color:#efede7}.w img{width:72px;height:72px}.w h1{font-size:64px;letter-spacing:-.04em;margin:22px 0 10px;font-weight:650}.w p{font-size:22px;color:#9b9aa3;margin:0;max-width:520px;line-height:1.4}
.s{position:absolute;right:80px;top:60px;width:300px;border-radius:14px;overflow:hidden;box-shadow:0 30px 80px #000a,0 0 0 1px #ffffff18}.s img{width:300px;display:block}
.s2{right:400px;top:110px;transform:rotate(-3deg)}</style><body><div class=bg></div><div class=w><img src="${logo}"><h1>Hyper Spec</h1><p>Turn any live page into a spec your AI can build from.</p></div><div class="s s2"><img src="${pLightTop}"></div><div class=s><img src="${pDarkTop}"></div></body>`);
await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'marquee-1400x560.png')});
await browser.close();console.log('Store images written to',out);
