// End-to-end check with the real unpacked extension: service worker, page shortcuts, picker, capture, note box, panel.
// Needs a Chromium build that allows --load-extension (Playwright's Chromium); set CHROMIUM_PATH if it isn't the default.
import {chromium} from '@playwright/test';import path from 'node:path';import assert from 'node:assert/strict';
const ext=path.resolve('extension');
const ctx=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH||undefined,headless:false,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`],viewport:{width:1100,height:750}});
const errors=[];const t0=Date.now();
let [sw]=ctx.serviceWorkers();if(!sw)sw=await ctx.waitForEvent('serviceworker');
const id=sw.url().split('/')[2];
await ctx.route('https://shop.test/**',r=>r.fulfill({contentType:'text/html',body:'<title>Cart - Shop</title><main style="padding:60px;font:16px system-ui"><h1>Cart</h1><button id="pay" style="padding:10px 16px">Pay now</button><p>Some text</p></main>'}));
const panel=await ctx.newPage();panel.on('pageerror',e=>errors.push('panel: '+e.message));
await panel.goto(`chrome-extension://${id}/panel.html`);await panel.waitForSelector('#pick');
const site=await ctx.newPage();site.on('pageerror',e=>errors.push('site: '+e.message));
await site.goto('https://shop.test/cart');await site.bringToFront();await site.waitForTimeout(500);
// A web page cannot forge keyboard shortcuts to trigger capture.
await site.evaluate(()=>{for(const key of ['s','p'])window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));});
await site.waitForTimeout(100);
assert.equal(await site.locator('text=Hyper Spec · Click to select').count(),0);
// Injected code cannot read other pages' reviews from extension storage.
const access=await sw.evaluate(async tabUrl=>{
  const [tab]=await chrome.tabs.query({url:tabUrl});
  const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:async()=>{
    try{await chrome.storage.local.get(null);return 'exposed';}catch{return 'denied';}
  }});
  return result;
},'https://shop.test/cart');
assert.equal(access,'denied');
// page S key -> picker
await site.locator('h1').click();await site.keyboard.press('s');await site.waitForTimeout(600);
const pickerOn=await site.evaluate(()=>!!document.querySelector('div')&&[...document.querySelectorAll('div')].some(d=>d.textContent.includes('Click to select')));
// Synthetic picker input must not select or capture an element either.
await site.evaluate(()=>{
  document.querySelector('#pay').dispatchEvent(new MouseEvent('click',{bubbles:true}));
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
});
assert.equal(await sw.evaluate(async()=>!!(await chrome.storage.local.get('draft')).draft),false);
await site.locator('#pay').hover();await site.waitForTimeout(100);const tc=Date.now();await site.locator('#pay').click();
await site.waitForTimeout(1500);const captureMs=Date.now()-tc;
await site.keyboard.type('Pay button needs **more padding** and 44px height');await site.keyboard.press('Alt+Digit1');await site.keyboard.press('Enter');
await site.waitForTimeout(1200);
const state=await sw.evaluate(async()=>{const {session,draft}=await chrome.storage.local.get(['session','draft']);const s=await chrome.storage.session.get('panelOpen');return {count:session?.findings?.length,name:session?.name,comp:session?.findings?.[0]?.component,sev:session?.findings?.[0]?.severity,draft:!!draft,panelOpen:s.panelOpen,bytes:JSON.stringify(session||{}).length};});
await panel.bringToFront();await panel.waitForTimeout(300);
const cards=await panel.locator('.finding').count();

// page P key capture
await site.bringToFront();await site.locator('main').click({position:{x:5,y:5}});await site.keyboard.press('p');await site.waitForTimeout(1500);
const draftAfterP=await sw.evaluate(async()=>!!(await chrome.storage.local.get('draft')).draft);
// copy markdown + export
await panel.bringToFront();
assert.ok(pickerOn,'S on the page starts the picker');assert.equal(state.count,1);assert.equal(state.comp,'Button · “Pay now”');assert.equal(state.sev,'High');assert.equal(state.panelOpen,true);assert.equal(cards,1);assert.ok(draftAfterP,'P on the page captures');assert.deepEqual(errors,[]);
console.log(`Extension checks passed in ${Date.now()-t0}ms: page S/P keys, picker, capture, note box save with priority, readable name, auto session name, panel render.`);
await ctx.close();
