import {icon} from './icons.js';
import {markdown,zip} from './report.js';
const $=id=>document.getElementById(id);
for(const element of document.querySelectorAll('[data-icon]'))element.replaceChildren(icon(element.dataset.icon));
function applyTheme(theme){const value=theme==='light'?'light':'dark';document.documentElement.dataset.theme=value;localStorage.setItem('hyper-theme',value);$('themeLight').setAttribute('aria-pressed',String(value==='light'));$('themeDark').setAttribute('aria-pressed',String(value==='dark'));}
applyTheme(document.documentElement.dataset.theme);
for(const [id,value]of [['themeLight','light'],['themeDark','dark']])$(id).onclick=async()=>{applyTheme(value);try{await chrome.storage.local.set({theme:value});}catch(e){status('Could not save your appearance preference.',true);}};
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.theme?.newValue)applyTheme(changes.theme.newValue);});
const floating=new URLSearchParams(location.search).has('floating');
let reviewWindowId=null;
if(floating){document.body.classList.add('floating');$('popout').replaceChildren(icon('dock'));$('popout').setAttribute('aria-label','Return to side panel');$('popout').title='Return to side panel';chrome.storage.session.get('reviewWindowId').then(data=>{reviewWindowId=data.reviewWindowId;});}
$('popout').onclick=()=>run(async()=>{
 await draftQueue;
 if(floating){
   if(!reviewWindowId){const normal=await chrome.windows.getLastFocused({windowTypes:['normal']});reviewWindowId=normal.id;}
   await chrome.sidePanel.open({windowId:reviewWindowId});await chrome.windows.update(reviewWindowId,{focused:true});window.close();
 }else{
   const result=await chrome.runtime.sendMessage({type:'popout'});if(result?.error)throw new Error(result.error);
   if(chrome.sidePanel.close)await chrome.sidePanel.close({windowId:result.sourceWindowId});
   else status('Floating window opened. You can close this side panel.');
 }
});
let session,draft,editing=false,busy=false,deleted=null,hasPrevious=false;
const fresh=()=>({id:crypto.randomUUID(),name:'Untitled design review',createdAt:new Date().toISOString(),findings:[]});
const status=(text,error=false)=>{$('status').textContent=text;$('statusWrap').hidden=!text;$('statusWrap').classList.toggle('error',error);};
async function persist(){await chrome.storage.local.set({session});render();}
function render(){
  $('restorePrevious').hidden=!hasPrevious;$('sessionTitle').textContent=session.name;if($('renameForm').hidden)$('sessionName').value=session.name;
  $('count').textContent=`${session.findings.length} ${session.findings.length===1?'finding':'findings'}`;$('badge').textContent=String(session.findings.length).padStart(2,'0');
  $('empty').hidden=!!session.findings.length;$('export').disabled=!session.findings.length;$('exportMd').disabled=!session.findings.length;$('exportHint').textContent=session.findings.length?'Includes Markdown, screenshots, and captured details.':'Add a finding to create your report.';
  $('findings').replaceChildren();
  for(const [i,f] of session.findings.entries()){
    const card=document.createElement('article');card.className='finding';
    const title=document.createElement('h3');const number=document.createElement('span');number.className='finding-number';number.textContent=`QA-${String(i+1).padStart(2,'0')}`;const name=document.createElement('span');name.className='finding-title';name.textContent=f.component;title.append(number,name);
    const meta=document.createElement('small');meta.textContent=`${f.severity} · ${new URL(f.url).hostname}`;
    const comment=document.createElement('p');comment.textContent=f.comment;
    const actions=document.createElement('div');actions.className='actions';
    for(const [label,action] of [['Edit',async()=>{if(draft&&!confirm('Replace your unfinished note with a new capture?'))return;editing=true;await showDraft(f);}],['Delete',async()=>{deleted={finding:f,index:i};session.findings=session.findings.filter(x=>x.id!==f.id);await persist();status('Finding deleted.');$('undo').hidden=false;}]]){const b=document.createElement('button');b.append(icon(label==='Edit'?'edit':'trash'),document.createTextNode(label));b.onclick=()=>run(action);actions.append(b);}
    card.append(title,meta,comment,actions);$('findings').append(card);
  }
}
async function run(fn){if(busy)return;busy=true;try{await fn();}catch(e){status(e.message,true);}finally{busy=false;}}
async function activeTab(){let query={active:true,currentWindow:true};if(floating){const normal=await chrome.windows.getLastFocused({windowTypes:['normal']});reviewWindowId=normal.id;query={active:true,windowId:normal.id};await chrome.windows.update(normal.id,{focused:true});}const [tab]=await chrome.tabs.query(query);if(!tab||!/^https?:|^file:/.test(tab.url||''))throw new Error('Open a regular website to capture a finding. Browser settings and extension pages cannot be inspected.');return tab;}
async function annotate(f){
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Could not load screenshot.'));i.src=f.screenshot;});
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  if(f.rect){const sx=canvas.width/f.viewport.width,sy=canvas.height/f.viewport.height;ctx.strokeStyle='#f04d2e';ctx.lineWidth=3*Math.max(sx,sy);ctx.strokeRect(f.rect.x*sx,f.rect.y*sy,f.rect.width*sx,f.rect.height*sy);}
  return canvas.toDataURL('image/png');
}
async function showDraft(f){draft=f;document.body.classList.add('editing');$('editor').hidden=false;$('editorTitle').textContent=editing?'Edit finding':'Describe the issue';const preview=annotate(f);$('component').value=f.component;$('location').textContent=f.selector+' · '+f.url;$('comment').value=f.comment||'';$('severity').value=f.severity||'Medium';$('comment').focus();status('');$('preview').src=await preview;}
$('pick').onclick=()=>run(async()=>{if(draft&&!confirm('Replace your unfinished note with a new capture?'))return;const tab=await activeTab();await chrome.scripting.executeScript({target:{tabId:tab.id},files:['picker.js']});status('Click an element on the page. Press Esc to cancel.');});
$('page').onclick=()=>run(async()=>{if(draft&&!confirm('Replace your unfinished note with a new capture?'))return;const tab=await activeTab();const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>({url:location.href,pageTitle:document.title,component:'Page viewport',componentSource:'Page capture',selector:'document',tag:'document',specs:{},viewport:{width:innerWidth,height:innerHeight,devicePixelRatio,scrollX,scrollY}})});const screenshot=await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'});await chrome.storage.local.set({draft:{...result,screenshot,id:crypto.randomUUID(),capturedAt:new Date().toISOString()}});if(floating){const current=await chrome.windows.getCurrent();await chrome.windows.update(current.id,{focused:true});}});
$('save').onclick=()=>run(async()=>{if(!draft)return;if(!$('comment').value.trim()){$('comment').setAttribute('aria-invalid','true');status('Describe what needs fixing before saving.',true);$('comment').focus();return;}const f={...draft,component:$('component').value.trim()||draft.component,comment:$('comment').value.trim(),severity:$('severity').value};const index=session.findings.findIndex(x=>x.id===f.id);if(index<0)session.findings.push(f);else session.findings[index]=f;await persist();await clearDraft();status('Finding saved. Keep browsing to add more.');});
async function clearDraft(){await draftQueue;await chrome.storage.local.remove('draft');document.body.classList.remove('editing');$('comment').removeAttribute('aria-invalid');draft=null;editing=false;$('editor').hidden=true;}
$('discard').onclick=()=>run(async()=>{if(draft?.comment&&!confirm('Discard this unfinished note?'))return;await clearDraft();});
function closeRename(){ $('renameForm').hidden=true;$('sessionDisplay').hidden=false;$('nameError').hidden=true;$('sessionName').removeAttribute('aria-invalid');$('rename').focus(); }
$('rename').onclick=()=>{ $('sessionName').value=session.name;$('sessionDisplay').hidden=true;$('renameForm').hidden=false;$('sessionName').focus();$('sessionName').select(); };
$('cancelRename').onclick=closeRename;
$('sessionName').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();closeRename();}};
$('renameForm').onsubmit=e=>{e.preventDefault();run(async()=>{const name=$('sessionName').value.trim();if(!name){$('nameError').hidden=false;$('sessionName').setAttribute('aria-invalid','true');$('sessionName').focus();return;}const updated={...session,name};await chrome.storage.local.set({session:updated});session=updated;closeRename();render();status('Session renamed.');});};
$('reset').onclick=()=>{const count=session.findings.length;$('newSessionDescription').textContent=count?`This review contains ${count} ${count===1?'finding':'findings'}${draft?' and an unfinished note':''}. Export it before starting a new review.`:draft?'You have an unfinished note in this review. It will be kept with the previous session.':'You’ll start with an empty review and a new name.';$('exportAndNew').hidden=!count;$('startNew').textContent=count?'Start without exporting':'Start new session';$('newSessionDialog').showModal();};
$('cancelNew').onclick=()=>$('newSessionDialog').close();
async function startNewSession(){await draftQueue;const previousSession={session,draft};const next=fresh();await chrome.storage.local.set({previousSession,session:next});session=next;hasPrevious=true;deleted=null;$('undo').hidden=false;await clearDraft();$('newSessionDialog').close();$('renameForm').hidden=true;$('sessionDisplay').hidden=false;render();status('New session started. Restore the previous review with Undo.');$('rename').click();}
$('startNew').onclick=()=>run(startNewSession);
$('exportAndNew').onclick=()=>run(async()=>{await exportReport();await startNewSession();});
async function exportReport(){
  status('Preparing your report…');
  const files=[{name:'report.md',data:markdown(session)},{name:'session.json',data:JSON.stringify({...session,schemaVersion:1,findings:session.findings.map(({screenshot,...f})=>({...f,screenshotPath:`screenshots/${f.id}.png`}))},null,2)}];
  for(const f of session.findings){const data=await annotate(f);files.push({name:`screenshots/${f.id}.png`,data:Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0))});}
  const url=URL.createObjectURL(zip(files)),a=document.createElement('a');a.href=url;a.download='hyper-design-qa-'+new Date().toISOString().slice(0,10)+'.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status('Report downloaded. Unzip it, then attach report.md and the screenshots to Claude.');
}
$('export').onclick=()=>run(exportReport);
// Persist unfinished comments, including when the browser panel is closed.
let draftQueue=Promise.resolve();
for(const id of ['comment','component','severity']) $(id).addEventListener('input',()=>{if(!draft)return;draft={...draft,comment:$('comment').value,component:$('component').value,severity:$('severity').value};$('comment').removeAttribute('aria-invalid');const snapshot=draft;draftQueue=draftQueue.then(()=>chrome.storage.local.set({draft:snapshot})).catch(e=>status(e.message));});
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.draft?.newValue&&changes.draft.newValue.id!==draft?.id){editing=false;showDraft(changes.draft.newValue).catch(e=>status(e.message));}});
// Keep the two surfaces current if Chrome leaves the side panel open.
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area!=='local')return;
 if(changes.session?.newValue){session=changes.session.newValue;render();}
 if(changes.previousSession){hasPrevious=!!changes.previousSession.newValue;$('restorePrevious').hidden=!hasPrevious;}
 if(changes.draft&&!changes.draft.newValue){draft=null;editing=false;$('editor').hidden=true;document.body.classList.remove('editing');}
 if(changes.draft?.newValue?.id===draft?.id&&!document.hasFocus()){draft=changes.draft.newValue;$('comment').value=draft.comment||'';$('component').value=draft.component;}
});
async function restorePreviousReview(){const {previousSession}=await chrome.storage.local.get('previousSession');if(!previousSession)return;await draftQueue;await chrome.storage.local.set({previousSession:{session,draft},session:previousSession.session});await clearDraft();session=previousSession.session;hasPrevious=true;$('renameForm').hidden=true;$('sessionDisplay').hidden=false;render();if(previousSession.draft)await chrome.storage.local.set({draft:previousSession.draft});$('undo').hidden=true;status('Previous review restored.');}
$('undo').onclick=()=>run(async()=>{if(!deleted){await restorePreviousReview();return;}session.findings.splice(deleted.index,0,deleted.finding);await persist();deleted=null;$('undo').hidden=true;status('Finding restored.');});
$('exportMd').onclick=()=>run(async()=>{const url=URL.createObjectURL(new Blob([markdown(session)],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download='hyper-design-qa-report.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status('Markdown downloaded. Export the full report to include screenshots.');});
$('restorePrevious').onclick=()=>run(async()=>{if((session.findings.length||draft)&&!confirm('Switch to the previous review? Your current review will be kept so you can switch back.'))return;deleted=null;await restorePreviousReview();});
const stored=await chrome.storage.local.get(['session','draft','previousSession','theme']);if(stored.theme)applyTheme(stored.theme);hasPrevious=!!stored.previousSession;session=stored.session||fresh();if(!stored.session)await persist();render();if(stored.draft)await showDraft(stored.draft);
