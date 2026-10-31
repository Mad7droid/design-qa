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
let session,draft,editing=false,busy=false,hasPrevious=false;const undoStack=[];
const mac=/Mac|iPhone|iPad/.test(navigator.platform);
for(const k of document.querySelectorAll('kbd[data-mod]'))k.textContent=(mac?'⌘':'Ctrl+')+k.textContent;
if(mac)for(const k of document.querySelectorAll('kbd'))k.textContent={Alt:'⌥',Shift:'⇧'}[k.textContent]||k.textContent;
function pushUndo(message,fn){undoStack.push(fn);$('undo').hidden=false;status(message);}
const fresh=()=>({id:crypto.randomUUID(),name:'Untitled design review',createdAt:new Date().toISOString(),findings:[]});
const parseLinks=text=>[...new Set(String(text||'').split(/[\s,]+/).map(x=>x.trim()).filter(x=>/^https?:\/\/\S+$/i.test(x)))];
const TAGS=['Spacing','Alignment','Typography','Colour','Copy','Accessibility','Responsive','Interaction'];
let selectedTags=new Set();
const hashTags=text=>[...String(text||'').matchAll(/#([a-z][\w-]*)/gi)].map(m=>TAGS.find(t=>t.toLowerCase()===m[1].toLowerCase())||m[1]);
const tagsFor=comment=>[...new Set([...selectedTags,...hashTags(comment)])];
function renderTags(){$('tags').replaceChildren(...TAGS.map((t,i)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.title=`${mac?'⌥':'Alt+'}${i+1}`;b.setAttribute('aria-pressed',String(selectedTags.has(t)));b.onclick=()=>toggleTag(t);return b;}));}
function toggleTag(t){selectedTags.has(t)?selectedTags.delete(t):selectedTags.add(t);renderTags();$('comment').dispatchEvent(new Event('input'));}
const status=(text,error=false)=>{$('status').textContent=text;$('statusWrap').hidden=!text;$('statusWrap').classList.toggle('error',error);};
async function persist(){await chrome.storage.local.set({session});render();}
function render(){
  $('restorePrevious').hidden=!hasPrevious;$('sessionTitle').textContent=session.name;if($('renameForm').hidden)$('sessionName').value=session.name;if(document.activeElement!==$('sessionLinks'))$('sessionLinks').value=(session.links||[]).join(' ');$('sessionLinksCount').textContent=session.links?.length?`· ${session.links.length}`:'';
  $('count').textContent=`${session.findings.length} ${session.findings.length===1?'finding':'findings'}`;$('badge').textContent=String(session.findings.length).padStart(2,'0');
  $('empty').hidden=!!session.findings.length;$('export').disabled=!session.findings.length;$('copyMd').disabled=!session.findings.length;$('exportMd').disabled=!session.findings.length;$('exportHint').textContent=session.findings.length?'Includes Markdown, screenshots, and captured details.':'Add a finding to create your report.';
  $('findings').replaceChildren();
  for(const [i,f] of session.findings.entries()){
    const card=document.createElement('article');card.className='finding';
    const title=document.createElement('h3');const number=document.createElement('span');number.className='finding-number';number.textContent=`QA-${String(i+1).padStart(2,'0')}`;const name=document.createElement('span');name.className='finding-title';name.textContent=f.component;title.append(number,name);
    const meta=document.createElement('small');meta.textContent=`${f.severity} · ${new URL(f.url).hostname}${f.tags?.length?' · '+f.tags.map(t=>'#'+t.toLowerCase()).join(' '):''}`;
    const comment=document.createElement('p');comment.textContent=f.comment;
    const linkList=document.createElement('div');linkList.className='finding-links';for(const url of f.links||[]){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent=/figma\.com/i.test(url)?'Figma ↗':new URL(url).hostname+' ↗';linkList.append(a);}
    const actions=document.createElement('div');actions.className='actions';
    card.tabIndex=0;card.setAttribute('aria-label',`QA-${String(i+1).padStart(2,'0')} ${f.component}. Enter to edit, Delete to remove.`);card.onkeydown=e=>{if(e.target!==card)return;if(e.key==='Enter'){e.preventDefault();run(()=>editFinding(f));}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();run(()=>deleteFinding(f,i));}};
    for(const [label,action] of [['Edit',()=>editFinding(f)],['Delete',()=>deleteFinding(f,i)]]){const b=document.createElement('button');b.append(icon(label==='Edit'?'edit':'trash'),document.createTextNode(label));b.onclick=()=>run(action);actions.append(b);}
    card.append(title,meta,comment,...(f.links?.length?[linkList]:[]),actions);$('findings').append(card);
  }
}
async function editFinding(f){if(draft&&!confirm('Replace your unfinished note with a new capture?'))return;editing=true;await showDraft(f);}
async function deleteFinding(f,i){session.findings=session.findings.filter(x=>x.id!==f.id);await persist();pushUndo('Finding deleted.',async()=>{session.findings.splice(i,0,f);await persist();status('Finding restored.');});const cards=$('findings').children;(cards[Math.min(i,cards.length-1)]||$('pick')).focus();}
async function run(fn){if(busy)return;busy=true;try{await fn();}catch(e){status(e.message,true);}finally{busy=false;}}
async function activeTab(){let query={active:true,currentWindow:true};if(floating){const normal=await chrome.windows.getLastFocused({windowTypes:['normal']});reviewWindowId=normal.id;query={active:true,windowId:normal.id};await chrome.windows.update(normal.id,{focused:true});}const [tab]=await chrome.tabs.query(query);if(!tab||!/^https?:|^file:/.test(tab.url||''))throw new Error('Open a regular website to capture a finding. Browser settings and extension pages cannot be inspected.');return tab;}
async function annotate(f){
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Could not load screenshot.'));i.src=f.screenshot;});
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  if(f.rect){const sx=canvas.width/f.viewport.width,sy=canvas.height/f.viewport.height;ctx.strokeStyle='#f04d2e';ctx.lineWidth=3*Math.max(sx,sy);ctx.strokeRect(f.rect.x*sx,f.rect.y*sy,f.rect.width*sx,f.rect.height*sy);}
  return canvas.toDataURL('image/png');
}
async function showDraft(f){draft=f;document.body.classList.add('editing');$('editor').hidden=false;$('editorTitle').textContent=editing?'Edit finding':'Describe the issue';const preview=annotate(f);$('component').value=f.component;$('location').textContent=f.selector+' · '+f.url;$('comment').value=f.comment||'';$('links').value=(f.links||[]).join(' ');selectedTags=new Set((f.tags||[]).filter(t=>TAGS.includes(t)));renderTags();$('severity').value=f.severity||'Medium';if(document.hasFocus())$('comment').focus();status('');preview.then(src=>{if(draft?.id===f.id)$('preview').src=src;},e=>status(e.message,true));}
$('pick').onclick=()=>run(async()=>{if(draft&&!confirm('Replace your unfinished note with a new capture?'))return;const tab=await activeTab();await chrome.scripting.executeScript({target:{tabId:tab.id},files:['picker.js']});status('Click an element on the page. Press Esc to cancel.');});
$('page').onclick=()=>run(async()=>{if(draft&&!confirm('Replace your unfinished note with a new capture?'))return;const tab=await activeTab();const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>({url:location.href,pageTitle:document.title,component:'Page viewport',componentSource:'Page capture',selector:'document',tag:'document',specs:{},viewport:{width:innerWidth,height:innerHeight,devicePixelRatio,scrollX,scrollY}})});const screenshot=await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'});await chrome.storage.local.set({draft:{...result,screenshot,id:crypto.randomUUID(),capturedAt:new Date().toISOString()}});if(floating){const current=await chrome.windows.getCurrent();await chrome.windows.update(current.id,{focused:true});}});
$('save').onclick=()=>run(async()=>{if(!draft)return;if(!$('comment').value.trim()){$('comment').setAttribute('aria-invalid','true');status('Describe what needs fixing before saving.',true);$('comment').focus();return;}const f={...draft,component:$('component').value.trim()||draft.component,comment:$('comment').value.trim(),links:parseLinks($('links').value),tags:tagsFor($('comment').value),severity:$('severity').value};const index=session.findings.findIndex(x=>x.id===f.id);if(index<0)session.findings.push(f);else session.findings[index]=f;await persist();await clearDraft();status('Finding saved. Keep browsing to add more.');});
async function clearDraft(){await draftQueue;selectedTags=new Set();await chrome.storage.local.remove('draft');document.body.classList.remove('editing');$('comment').removeAttribute('aria-invalid');draft=null;editing=false;$('editor').hidden=true;}
// Discarding is instant and reversible, so no confirmation is needed.
async function discardDraft(){if(!draft)return;const saved=draft,wasEditing=editing;await clearDraft();pushUndo(wasEditing?'Changes discarded.':'Capture discarded.',async()=>{draft=saved;await chrome.storage.local.set({draft:saved});editing=wasEditing;await showDraft(saved);});$('pick').focus();}
$('discard').onclick=()=>run(discardDraft);
$('sessionLinks').addEventListener('change',()=>run(async()=>{session={...session,links:parseLinks($('sessionLinks').value)};await persist();}));
// The on-page note box saves through the panel so validation and undo stay in one place.
chrome.runtime.onMessage?.addListener(message=>{if(message.type!=='save-draft'||!draft||message.id!==draft.id)return;$('comment').value=message.comment;draft={...draft,comment:message.comment};$('save').click();if(message.next){const again=()=>busy?setTimeout(again,30):draft||$('pick').click();setTimeout(again,30);}});
async function copyReport(){await navigator.clipboard.writeText(markdown(session));status('Report copied as Markdown. Screenshots aren’t included; use Export for those.');}
$('copyMd').onclick=()=>run(copyReport);
chrome.runtime.onMessage?.addListener(message=>{if(message.type==='discard-draft')run(discardDraft);});
function closeRename(){ $('renameForm').hidden=true;$('sessionDisplay').hidden=false;$('nameError').hidden=true;$('sessionName').removeAttribute('aria-invalid');$('rename').focus(); }
$('rename').onclick=()=>{ $('sessionName').value=session.name;$('sessionDisplay').hidden=true;$('renameForm').hidden=false;$('sessionName').focus();$('sessionName').select(); };
$('cancelRename').onclick=closeRename;
$('sessionName').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();closeRename();}};
$('renameForm').onsubmit=e=>{e.preventDefault();run(async()=>{const name=$('sessionName').value.trim();if(!name){$('nameError').hidden=false;$('sessionName').setAttribute('aria-invalid','true');$('sessionName').focus();return;}const updated={...session,name};await chrome.storage.local.set({session:updated});session=updated;closeRename();render();status('Session renamed.');});};
$('reset').onclick=()=>{const count=session.findings.length;$('newSessionDescription').textContent=count?`This review contains ${count} ${count===1?'finding':'findings'}${draft?' and an unfinished note':''}. Export it before starting a new review.`:draft?'You have an unfinished note in this review. It will be kept with the previous session.':'You’ll start with an empty review and a new name.';$('exportAndNew').hidden=!count;$('startNew').textContent=count?'Start without exporting':'Start new session';$('newSessionDialog').showModal();};
$('cancelNew').onclick=()=>$('newSessionDialog').close();
async function startNewSession(){await draftQueue;const previousSession={session,draft};const next=fresh();await chrome.storage.local.set({previousSession,session:next});session=next;hasPrevious=true;undoStack.length=0;undoStack.push(restorePreviousReview);$('undo').hidden=false;await clearDraft();$('newSessionDialog').close();$('renameForm').hidden=true;$('sessionDisplay').hidden=false;render();status('New session started. Restore the previous review with Undo.');$('rename').click();}
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
for(const id of ['comment','component','severity','links']) $(id).addEventListener('input',()=>{if(!draft)return;draft={...draft,comment:$('comment').value,component:$('component').value,severity:$('severity').value,links:parseLinks($('links').value),tags:tagsFor($('comment').value)};$('comment').removeAttribute('aria-invalid');const snapshot=draft;draftQueue=draftQueue.then(()=>chrome.storage.local.set({draft:snapshot})).catch(e=>status(e.message));});
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.draft?.newValue&&changes.draft.newValue.id!==draft?.id){editing=false;showDraft(changes.draft.newValue).catch(e=>status(e.message));}});
// Keep the two surfaces current if Chrome leaves the side panel open.
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area!=='local')return;
 if(changes.session?.newValue){session=changes.session.newValue;render();}
 if(changes.previousSession){hasPrevious=!!changes.previousSession.newValue;$('restorePrevious').hidden=!hasPrevious;}
 if(changes.draft&&!changes.draft.newValue){draft=null;editing=false;$('editor').hidden=true;document.body.classList.remove('editing');}
 if(changes.draft?.newValue?.id===draft?.id&&!document.hasFocus()){draft=changes.draft.newValue;$('comment').value=draft.comment||'';$('comment').removeAttribute('aria-invalid');$('component').value=draft.component;}
});
async function restorePreviousReview(){const {previousSession}=await chrome.storage.local.get('previousSession');if(!previousSession)return;await draftQueue;await chrome.storage.local.set({previousSession:{session,draft},session:previousSession.session});await clearDraft();session=previousSession.session;hasPrevious=true;$('renameForm').hidden=true;$('sessionDisplay').hidden=false;render();if(previousSession.draft)await chrome.storage.local.set({draft:previousSession.draft});undoStack.length=0;$('undo').hidden=true;status('Previous review restored.');}
$('undo').onclick=()=>run(async()=>{const fn=undoStack.pop();$('undo').hidden=!undoStack.length;if(fn)await fn();});
$('exportMd').onclick=()=>run(async()=>{const url=URL.createObjectURL(new Blob([markdown(session)],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download='hyper-design-qa-report.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status('Markdown downloaded. Export the full report to include screenshots.');});
$('restorePrevious').onclick=()=>run(async()=>{if((session.findings.length||draft)&&!confirm('Switch to the previous review? Your current review will be kept so you can switch back.'))return;await restorePreviousReview();});
// Linear-style shortcuts. Single keys only fire outside text fields.
const typing=el=>!!el?.matches?.('input,textarea,select,[contenteditable="true"]');
$('showShortcuts').onclick=()=>$('shortcutsDialog').showModal();
$('closeShortcuts').onclick=()=>$('shortcutsDialog').close();
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented||e.isComposing||document.querySelector('dialog[open]'))return;
 const mod=mac?e.metaKey:e.ctrlKey,key=e.key.toLowerCase(),inField=typing(document.activeElement);
 if(mod&&e.shiftKey&&key==='c'&&session.findings.length){e.preventDefault();run(copyReport);return;}
 if(draft&&e.altKey&&/^Digit[1-8]$/.test(e.code)){e.preventDefault();toggleTag(TAGS[+e.code.slice(5)-1]);return;}
 if(draft&&mod&&e.key==='Enter'){e.preventDefault();$('save').click();return;}
 if(draft&&e.key==='Escape'&&!$('renameForm').contains(document.activeElement)){e.preventDefault();run(discardDraft);return;}
 if(inField)return;
 if(mod&&!e.shiftKey&&key==='z'&&undoStack.length){e.preventDefault();$('undo').click();return;}
 if(e.metaKey||e.ctrlKey||e.altKey)return;
 if(draft&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();run(discardDraft);return;}
 const action={s:'pick',p:'page',e:'export'}[key];
 if(action&&!$(action).disabled){e.preventDefault();$(action).click();}
 else if(key==='c'&&draft){e.preventDefault();$('comment').focus();}
 else if(e.key==='?'){e.preventDefault();$('shortcutsDialog').showModal();}
});
// Clicking anywhere in the panel after a capture puts the cursor in the note.
const focusNote=()=>{if(draft&&!$('editor').hidden&&!typing(document.activeElement))$('comment').focus();};
window.addEventListener('focus',focusNote);
$('editor').addEventListener('click',e=>{if(!e.target.closest('button,input,textarea,select,summary,a,label,details'))$('comment').focus();});
renderTags();
chrome.runtime.connect?.({name:'panel'});
const stored=await chrome.storage.local.get(['session','draft','previousSession','theme']);if(stored.theme)applyTheme(stored.theme);hasPrevious=!!stored.previousSession;session=stored.session||fresh();if(!stored.session)await persist();render();if(stored.draft)await showDraft(stored.draft);
