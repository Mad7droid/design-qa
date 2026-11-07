// Only extension UI may request privileged window/navigation actions.
const fromPanel = sender => sender?.id === chrome.runtime.id &&
  sender.url?.split('?')[0] === chrome.runtime.getURL('panel.html');
const fromPage = sender => sender?.id === chrome.runtime.id && sender.tab?.id != null &&
  sender.frameId === 0 && sender.url === sender.tab.url;
// Review storage is private to trusted extension contexts, not injected page scripts.
const storageReady = chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
// Remember the browser being reviewed while the floating window has focus.
chrome.windows.onFocusChanged.addListener(async id=>{if(id===chrome.windows.WINDOW_ID_NONE)return;try{const win=await chrome.windows.get(id);if(win.type==='normal')await chrome.storage.session.set({reviewWindowId:id});}catch{}});
let openingWindow=null;
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(message?.type!=='popout'||!fromPanel(sender))return;
 openingWindow ||= (async()=>{
   const source=await chrome.windows.getLastFocused({windowTypes:['normal']});
   await chrome.storage.session.set({reviewWindowId:source.id});
   const {floatingWindowId}=await chrome.storage.session.get('floatingWindowId');
   if(floatingWindowId){try{await chrome.windows.update(floatingWindowId,{focused:true});return {ok:true,sourceWindowId:source.id};}catch{}}
   const win=await chrome.windows.create({url:chrome.runtime.getURL('panel.html?floating=1'),type:'popup',width:390,height:740,focused:true});
   await chrome.storage.session.set({floatingWindowId:win.id});
   return {ok:true,sourceWindowId:source.id};
 })();
 openingWindow.then(respond,error=>respond({error:error.message})).finally(()=>{openingWindow=null;});return true;
});
chrome.windows.onRemoved.addListener(async id=>{const {floatingWindowId}=await chrome.storage.session.get('floatingWindowId');if(id===floatingWindowId)await chrome.storage.session.remove('floatingWindowId');});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
let queue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== 'selection' || !fromPage(sender)) return;
  queue = queue.then(async () => {
    await storageReady;
    if (!message.data || message.data.url !== sender.url || typeof message.data.selector !== 'string') throw new Error('Invalid selection.');
    const tab = await chrome.tabs.get(sender.tab.id);
    const [active] = await chrome.tabs.query({active: true, windowId: tab.windowId});
    if (active?.id !== tab.id || tab.url !== sender.url) throw new Error('Return to the selected tab and capture again.');
    let framework = null;
    if (!message.data.shadowRoot) {
      try {
        const [result] = await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',func:(selector)=>{
          const element=document.querySelector(selector);if(!element)return null;
          let owner=element.__vueParentComponent;
          if(owner){const type=owner.type;return {component:type.name||type.__name||'Vue component',componentSource:'Vue runtime metadata (best effort)'};}
          const key=Object.keys(element).find(k=>k.startsWith('__reactFiber$'));
          let fiber=key?element[key]:null;
          for(let i=0;fiber&&i<30;i++,fiber=fiber.return){const type=fiber.type;if(typeof type==='function'||(type&&typeof type==='object')){const name=type.displayName||type.name||type.render?.displayName||type.render?.name;if(name)return {component:name,componentSource:'React runtime metadata (best effort; may be minified)'};}}
          return null;
        },args:[message.data.selector]});
        framework=result?.result;
      } catch {}
    }
    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'});
    const [stillActive] = await chrome.tabs.query({active:true,windowId:tab.windowId});
    const currentTab=await chrome.tabs.get(tab.id);
    if(stillActive?.id!==tab.id||currentTab.url!==message.data.url)throw new Error('The page changed during capture. Please select the element again.');
    // Skip generated names (styled-components hashes, one-letter minified names); the readable label is more useful.
    if(framework&&(/styled|__|^[A-Za-z_$]{1,2}$/.test(framework.component)))framework=null;
    const draft = {...message.data, ...(framework||{}), screenshot, id: crypto.randomUUID(), capturedAt: new Date().toISOString()};
    await chrome.storage.local.set({draft});
    // The page keeps focus so the reviewer can type straight into the inline note box.
    respond({ok: true, id: draft.id});
  }).catch(error => respond({error: error.message}));
  return true;
});
// Keyboard shortcuts work from the page itself, so reviewers never have to reach for the panel.
chrome.commands.onCommand.addListener((command,tab)=>runCommand(command,tab,true).catch(()=>{}));
chrome.runtime.onMessage.addListener((message,sender)=>{if(message?.type==='hotkey'&&fromPage(sender))runCommand(message.command,sender.tab,false).catch(()=>{});});
// Page S / P keys only listen while a panel is connected.
// The flag lives in session storage so page scripts never receive the (large) review session in change events.
let panels=0;
chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_AND_UNTRUSTED_CONTEXTS'}).catch(()=>{});
chrome.storage.session.set({panelOpen:false});
chrome.runtime.onConnect.addListener(port=>{if(port.name!=='panel'||!fromPanel(port.sender))return;panels++;chrome.storage.session.set({panelOpen:true});port.onDisconnect.addListener(()=>{panels=Math.max(0,panels-1);if(!panels)chrome.storage.session.set({panelOpen:false});});});
async function runCommand(command,tab,openPanel){
  if(!tab?.id||!/^https?:|^file:/.test(tab.url||''))return;
  // Open synchronously: the shortcut's user gesture expires after the first await.
  if(openPanel)chrome.sidePanel.open({windowId:tab.windowId}).catch(()=>{});
  if (!['select-element','capture-page'].includes(command)) return;
  if (!openPanel && !panels) return;
  const [active] = await chrome.tabs.query({active:true,windowId:tab.windowId});
  const current = await chrome.tabs.get(tab.id);
  if (active?.id !== tab.id || current.url !== tab.url) return;
  await storageReady;
  const {floatingWindowId}=await chrome.storage.session.get('floatingWindowId');
  if(command==='select-element')await chrome.scripting.executeScript({target:{tabId:tab.id},files:['format.js','picker.js']});
  if(command==='capture-page'){
    const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>({url:location.href,pageTitle:document.title,component:'Page viewport',componentSource:'Page capture',selector:'document',tag:'document',specs:{},viewport:{width:innerWidth,height:innerHeight,devicePixelRatio,scrollX,scrollY}})});
    const screenshot=await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'});
    const [stillActive] = await chrome.tabs.query({active:true,windowId:tab.windowId});
    if (stillActive?.id !== tab.id || (await chrome.tabs.get(tab.id)).url !== result.url) return;
    await chrome.storage.local.set({draft:{...result,screenshot,id:crypto.randomUUID(),capturedAt:new Date().toISOString()}});
    if(floatingWindowId)try{await chrome.windows.update(floatingWindowId,{focused:true});}catch{}
  }
}
// Reopen a finding: reuse a tab already on that URL, otherwise open one, then flash the element.
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message?.type!=='reveal'||!fromPanel(sender))return;
  if(!/^(https?|file):/.test(message.url||'')){respond({error:'Only web pages can be reopened.'});return;}
  (async()=>{
    const {reviewWindowId}=await chrome.storage.session.get('reviewWindowId');
    const win=reviewWindowId?await chrome.windows.get(reviewWindowId).catch(()=>null):null;
    const windowId=win?.id??(await chrome.windows.getLastFocused({windowTypes:['normal']})).id;
    let tab=(await chrome.tabs.query({windowId})).find(t=>t.url===message.url);
    if(tab)await chrome.tabs.update(tab.id,{active:true});
    else{tab=await chrome.tabs.create({windowId,url:message.url});await new Promise(resolve=>{const done=(id,info)=>{if(id===tab.id&&info.status==='complete'){chrome.tabs.onUpdated.removeListener(done);resolve();}};chrome.tabs.onUpdated.addListener(done);setTimeout(resolve,15000);});}
    const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},args:[message.selector],func:selector=>{
      let el=null;try{el=document.querySelector(selector);}catch{}
      if(!el)return {missing:true};
      el.scrollIntoView({block:'center',behavior:'smooth'});
      const ring=document.createElement('div');ring.style.cssText='position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #e34b30;border-radius:2px;box-shadow:0 0 0 4px #e34b3033;transition:opacity 600ms';document.documentElement.append(ring);
      const place=()=>{const r=el.getBoundingClientRect();Object.assign(ring.style,{left:r.x-3+'px',top:r.y-3+'px',width:r.width+6+'px',height:r.height+6+'px'});};
      const t=setInterval(place,16);place();setTimeout(()=>{ring.style.opacity='0';},2200);setTimeout(()=>{clearInterval(t);ring.remove();},2900);
      return {ok:true};
    }});
    return result||{ok:true};
  })().then(respond,error=>respond({error:'Could not open that page: '+error.message}));
  return true;
});

chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message?.type!=='update-draft'||!fromPage(sender))return;
  (async()=>{
    await storageReady;
    const {draft}=await chrome.storage.local.get('draft');
    if(!draft||draft.id!==message.id||draft.url!==sender.url)throw new Error('This capture is no longer active.');
    const patch={};
    if(typeof message.patch?.comment==='string')patch.comment=message.patch.comment.slice(0,50000);
    if(['High','Medium','Low'].includes(message.patch?.severity))patch.severity=message.patch.severity;
    await chrome.storage.local.set({draft:{...draft,...patch}});
    return {ok:true};
  })().then(respond,()=>respond({error:'Could not update this capture.'}));
  return true;
});
