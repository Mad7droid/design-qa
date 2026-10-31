import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('pop-out reuses one native popup and remembers the reviewed window',async()=>{
 const handlers=[],storage={},created=[],focused=[];
 const chrome={windows:{WINDOW_ID_NONE:-1,onFocusChanged:{addListener(){}},onRemoved:{addListener(){}},getLastFocused:async()=>({id:7,type:'normal'}),create:async options=>{created.push(options);return{id:20};},update:async(id,options)=>focused.push({id,...options})},storage:{session:{get:async()=>storage,set:async values=>Object.assign(storage,values)}},runtime:{getURL:path=>'chrome-extension://test/'+path,onMessage:{addListener:fn=>handlers.push(fn)}},sidePanel:{setPanelBehavior(){}}};
 vm.runInNewContext(readFileSync('extension/background.js','utf8'),{chrome});
 const request=()=>new Promise(resolve=>handlers[0]({type:'popout'},null,resolve));
 assert.equal((await request()).ok,true);await new Promise(resolve=>setImmediate(resolve));assert.equal((await request()).ok,true);assert.equal(created.length,1);assert.equal(created[0].type,'popup');assert.match(created[0].url,/floating=1/);assert.equal(storage.reviewWindowId,7);assert.equal(storage.floatingWindowId,20);assert.equal(focused[0].id,20);
});
