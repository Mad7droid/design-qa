import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function worker(){
  const handlers=[],access=[],writes=[],calls=[];
  const draft={id:'capture-1',url:'https://shop.test/cart',screenshot:'private-png',comment:'original'};
  const local={draft};
  const chrome={
    runtime:{id:'test',getURL:p=>'chrome-extension://test/'+p,onMessage:{addListener:f=>handlers.push(f)},onConnect:{addListener(){}}},
    storage:{local:{setAccessLevel:async o=>access.push(o.accessLevel),get:async()=>local,set:async v=>{writes.push(v);Object.assign(local,v);}},session:{setAccessLevel:async()=>{},set:async()=>{},get:async()=>({panelOpen:false})}},
    commands:{onCommand:{addListener(){}}},sidePanel:{setPanelBehavior(){}},
    windows:{onFocusChanged:{addListener(){}},onRemoved:{addListener(){}},create:async()=>calls.push('window')},
    tabs:{query:async()=>{calls.push('tabs');return [];}}
  };
  vm.runInNewContext(readFileSync('extension/background.js','utf8'),{chrome});
  const send=async(message,sender)=>{
    let result,answered=false;
    const results=handlers.map(f=>f(message,sender,r=>{result=r;answered=true;}));
    if(results.includes(true))for(let i=0;i<20&&!answered;i++)await new Promise(r=>setImmediate(r));
    return result;
  };
  return {send,local,access,writes,calls};
}
const page={id:'test',frameId:0,url:'https://shop.test/cart',tab:{id:1,url:'https://shop.test/cart'}};
test('review data is restricted to trusted contexts; draft updates cannot overwrite evidence',async()=>{
  const w=worker();assert.deepEqual(w.access,['TRUSTED_CONTEXTS']);
  const reply=await w.send({type:'update-draft',id:'capture-1',patch:{comment:'new note',severity:'High',screenshot:'attacker',id:'../../outside',url:'javascript:alert(1)'}},page);
  assert.equal(reply.ok,true);assert.equal(w.local.draft.comment,'new note');assert.equal(w.local.draft.severity,'High');
  assert.equal(w.local.draft.screenshot,'private-png');assert.equal(w.local.draft.id,'capture-1');assert.equal(w.local.draft.url,page.url);
  assert.deepEqual(Object.keys(reply),['ok']);
});
test('cross-page, stale, subframe and external draft messages are rejected',async()=>{
  const w=worker();
  for(const [id,sender] of [
    ['stale',page],['capture-1',{...page,url:'https://other.test/',tab:{id:2,url:'https://other.test/'}}],
    ['capture-1',{...page,frameId:1}],['capture-1',{...page,id:'another-extension'}]
  ])await w.send({type:'update-draft',id,patch:{comment:'overwrite'}},sender);
  assert.equal(w.writes.length,0);assert.equal(w.local.draft.comment,'original');
});
test('content scripts cannot request window creation, navigation or a capture with the panel closed',async()=>{
  const w=worker();
  for(const message of [{type:'popout'},{type:'reveal',url:'https://target.test/'},{type:'hotkey',command:'capture-page'}])await w.send(message,page);
  await new Promise(r=>setImmediate(r));assert.deepEqual(w.calls,[]);
});
