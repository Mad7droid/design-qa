import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
const page=await browser.newPage({viewport:{width:390,height:900},deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('https://hyper.local/**',async route=>{const name=new URL(route.request().url()).pathname.slice(1)||'panel.html';try{await route.fulfill({body:await fs.readFile('extension/'+name),contentType:name.endsWith('.svg')?'image/svg+xml':name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.addInitScript(()=>{
 const listeners=[];const read=()=>JSON.parse(localStorage.getItem('mockStorage')||'{}');
 window.chrome={storage:{local:{get:async()=>read(),set:async values=>{const storage=read(),changes={};for(const[key,newValue]of Object.entries(values)){changes[key]={oldValue:storage[key],newValue};storage[key]=newValue;}localStorage.setItem('mockStorage',JSON.stringify(storage));listeners.forEach(fn=>fn(changes,'local'));},remove:async key=>{const storage=read();delete storage[key];localStorage.setItem('mockStorage',JSON.stringify(storage));}},onChanged:{addListener:fn=>listeners.push(fn)}},tabs:{query:async()=>[{id:1,windowId:1,url:'https://example.com'}],captureVisibleTab:async()=>window.testScreenshot},scripting:{executeScript:async()=>[{result:{url:'https://example.com',pageTitle:'Example page',component:'Page viewport',selector:'document',componentSource:'Page capture',viewport:{width:390,height:900}}}]}};window.confirm=()=>true;
 window.windowCalls=[];window.chrome.windows={getLastFocused:async()=>({id:1,type:'normal'}),getCurrent:async()=>({id:9,type:'popup'}),update:async(id,options)=>{window.windowCalls.push({id,...options});}};
 window.chrome.storage.session={get:async()=>({reviewWindowId:1})};window.chrome.runtime={sendMessage:async message=>{window.lastMessage=message;return {ok:true,sourceWindowId:1};}};window.chrome.sidePanel={close:async options=>{window.closedPanel=options;},open:async options=>{window.openedPanel=options;}};
 window.chrome.tabs.query=async options=>{window.lastTabQuery=options;return [{id:1,windowId:1,url:'https://example.com'}];};window.close=()=>{window.windowClosed=true;};
});
await page.goto('https://hyper.local/panel.html');await page.waitForSelector('#export:disabled');
await page.getByRole('button',{name:'Light mode',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.reload();await expect(page.getByRole('button',{name:'Light mode',exact:true})).toHaveAttribute('aria-pressed','true');await page.screenshot({path:'.context/theme-light.png',fullPage:true});await page.setViewportSize({width:280,height:850});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:390,height:900});await page.getByRole('button',{name:'Dark mode',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.locator('header').screenshot({path:'.context/theme-switch.png'});

const screenshot=(await page.screenshot()).toString('base64');await page.evaluate(s=>window.testScreenshot='data:image/png;base64,'+s,screenshot);
await page.click('#page');await page.waitForSelector('#editor:not([hidden])',{timeout:5000}).catch(async e=>{console.log(await page.locator('body').innerText(),errors);throw e;});
await page.click('#save');assert.equal(await page.locator('#comment').getAttribute('aria-invalid'),'true');
await page.fill('#comment','The header needs more space above it.');await page.fill('#component','Page header');await page.screenshot({path:'.context/editor.png',fullPage:true});await page.click('#save');
await page.waitForSelector('.finding');assert.match(await page.locator('.finding').innerText(),/Page header/);
await page.reload();await expect(page.locator('.finding')).toHaveCount(1);
await page.getByRole('button',{name:'Edit',exact:true}).click();await expect(page.locator('#comment')).toHaveValue('The header needs more space above it.');await page.fill('#comment','The header needs 24px of space above it.');await page.click('#save');await expect(page.locator('.finding')).toContainText('24px');
await page.getByRole('button',{name:'Delete',exact:true}).click();await expect(page.locator('.finding')).toHaveCount(0);await page.click('#undo');await expect(page.locator('.finding')).toHaveCount(1);
const downloadEvent=page.waitForEvent('download');await page.click('#export');const download=await downloadEvent;await download.saveAs('.context/browser-report.zip');
await page.screenshot({path:'.context/findings.png',fullPage:true});
await page.setViewportSize({width:280,height:850});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
// Explicit rename flow and reversible session creation.
await page.setViewportSize({width:390,height:900});
await page.click('#rename');await page.fill('#sessionName','Checkout review');await page.getByRole('button',{name:'Save name',exact:true}).click();await expect(page.locator('#sessionTitle')).toHaveText('Checkout review');
await page.click('#rename');await page.fill('#sessionName','Do not save');await page.press('#sessionName','Escape');await expect(page.locator('#sessionTitle')).toHaveText('Checkout review');
await page.click('#reset');await expect(page.locator('#newSessionDialog')).toBeVisible();await expect(page.locator('#newSessionDescription')).toContainText('1 finding');await page.click('#cancelNew');await expect(page.locator('.finding')).toHaveCount(1);
await page.click('#reset');await page.click('#startNew');await expect(page.locator('.finding')).toHaveCount(0);await expect(page.locator('#renameForm')).toBeVisible();await page.click('#cancelRename');await page.click('#restorePrevious');await expect(page.locator('.finding')).toHaveCount(1);await expect(page.locator('#sessionTitle')).toHaveText('Checkout review');
await page.reload();await expect(page.locator('#restorePrevious')).toBeVisible();await expect(page.locator('#sessionTitle')).toHaveText('Checkout review');
assert.equal(await page.locator('.mark').evaluate(img=>img.complete&&img.naturalWidth>0),true);
await page.screenshot({path:'.context/session-improved.png',fullPage:true});await page.screenshot({path:'.context/session-controls.png',clip:{x:0,y:0,width:390,height:270}});
// Pop-out handoff, browser targeting, and docking use Chrome APIs.
await page.click('#popout');await page.waitForFunction(()=>window.closedPanel);assert.equal(await page.evaluate(()=>window.lastMessage.type),'popout');
await page.goto('https://hyper.local/panel.html?floating=1');await expect(page.getByRole('button',{name:'Return to side panel',exact:true})).toBeVisible();await expect(page.locator('.finding')).toHaveCount(1);
await page.evaluate(s=>window.testScreenshot='data:image/png;base64,'+s,screenshot);await page.click('#page');await expect(page.locator('#editor')).toBeVisible();assert.deepEqual(await page.evaluate(()=>window.lastTabQuery),{active:true,windowId:1});assert.deepEqual(await page.evaluate(()=>window.windowCalls.map(x=>x.id)),[1,9]);
await page.fill('#comment','Draft preserved across windows');await page.click('#popout');await page.waitForFunction(()=>window.windowClosed);assert.equal(await page.evaluate(()=>window.openedPanel.windowId),1);
await page.goto('https://hyper.local/panel.html');await expect(page.locator('#comment')).toHaveValue('Draft preserved across windows');
// Exercise the actual page picker against nested elements, not the panel mock.
const target=await browser.newPage({viewport:{width:1000,height:700}});
await target.route('https://hyper.local/fixture',route=>route.fulfill({body:'<!doctype html><html><body></body></html>',contentType:'text/html'}));await target.goto('https://hyper.local/fixture');await target.setContent('<main><h1>Store</h1><button id="purchase" data-component="PurchaseButton" style="padding:16px">Buy now</button></main>');
await target.evaluate(()=>{window.chrome={runtime:{sendMessage:async message=>{window.selection=message;return {ok:true};}}};});
await target.addScriptTag({path:'extension/picker.js'});await target.locator('#purchase').click();
await target.waitForFunction(()=>window.selection);const selected=await target.evaluate(()=>window.selection);assert.equal(selected.data.component,'PurchaseButton');assert.equal(selected.data.selector,'#purchase');assert.equal(selected.data.specs.padding,'16px');assert.ok(selected.data.rect.width>0);assert.equal(await target.locator('text=Click an element').count(),0);
await target.addScriptTag({path:'extension/picker.js'});await target.keyboard.press('Escape');assert.equal(await target.evaluate(()=>!!window.__hyperQA),false);
assert.deepEqual(errors,[]);console.log('Browser checks passed: capture, required note, save, reload, edit, delete/undo, ZIP download, narrow layout, element picker, Escape.');
} finally {await browser.close();}
