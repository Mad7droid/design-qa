(() => {
  if (window.__hyperQA) { window.__hyperQA.cancel(); }
  window.__hyperQAToast?.();
  let target;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #e34b30;background:#e34b3014;box-sizing:border-box;display:none';
  const hint = document.createElement('div');
  hint.textContent = 'Hyper-Design-QA · Click an element · Esc to cancel';
  hint.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;top:12px;left:50%;transform:translateX(-50%);background:#202820;color:white;padding:12px 18px;border-radius:8px;font:13px system-ui;box-shadow:0 4px 24px #0003';
  document.documentElement.append(overlay, hint);
  function move(e) {
    target = e.composedPath()[0];
    const r = target.getBoundingClientRect();
    Object.assign(overlay.style, {display:'block',left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});
  }
  function cancel() {
    overlay.remove(); hint.remove();
    window.removeEventListener('pointermove',move,true);
    window.removeEventListener('click',select,true);
    window.removeEventListener('keydown',key,true);
    delete window.__hyperQA;
  }
  function key(e) { if(e.key==='Escape') { e.preventDefault(); cancel(); } }
  function selector(el) {
    const parts=[];
    while(el && el.nodeType===1) {
      if(el.id) { parts.unshift('#'+CSS.escape(el.id)); break; }
      let part=el.localName;
      const test=el.getAttribute('data-testid');
      if(test) part+='[data-testid="'+CSS.escape(test)+'"]';
      else if(el.parentElement) part+=':nth-of-type('+([...el.parentElement.children].filter(x=>x.localName===el.localName).indexOf(el)+1)+')';
      parts.unshift(part);
      if(el.getRootNode() instanceof ShadowRoot) { parts.unshift('/* shadow root */'); break; }
      el=el.parentElement;
    }
    return parts.join(' > ');
  }
  async function select(e) {
    e.preventDefault(); e.stopImmediatePropagation();
    const el=e.composedPath()[0];
    const r=el.getBoundingClientRect(), s=getComputedStyle(el);
    const specs={};
    for(const p of ['display','position','box-sizing','color','background-color','font-family','font-size','font-weight','line-height','letter-spacing','text-align','padding','margin','gap','border','border-radius','box-shadow','opacity','align-items','justify-content']) specs[p]=s.getPropertyValue(p);
    const data={url:location.href,pageTitle:document.title,component:el.getAttribute('data-component')||el.getAttribute('data-testid')||el.localName,componentSource:el.hasAttribute('data-component')?'data-component':el.hasAttribute('data-testid')?'data-testid':'DOM tag (framework name unavailable)',selector:selector(el),tag:el.localName,role:el.getAttribute('role'),accessibleLabel:el.getAttribute('aria-label')||el.getAttribute('alt')||'',text:(el.innerText||el.textContent||'').trim().slice(0,1000),specs,rect:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight,devicePixelRatio,scrollX,scrollY},shadowRoot:el.getRootNode() instanceof ShadowRoot};
    cancel();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const result=await chrome.runtime.sendMessage({type:'selection',data});
    if(result?.error) alert('Hyper-Design-QA: '+result.error);
    else note(result?.id, data.rect);
  }
  // Inline note box next to the selection, so typing can start the moment the capture lands.
  function note(id, rect) {
    if (!id) return;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;z-index:2147483647;inset:auto';
    const root = host.attachShadow({mode:'closed'});
    root.innerHTML = '<style>:host{all:initial}.box{position:fixed;width:320px;background:#19191c;color:#ededf0;border:1px solid #36363e;border-radius:10px;box-shadow:0 16px 48px #0007;font:13px/1.5 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:10px}textarea{box-sizing:border-box;width:100%;min-height:64px;resize:vertical;background:#101012;color:inherit;border:1px solid #36363e;border-radius:6px;padding:8px 9px;font:inherit;outline:none}textarea:focus{border-color:#d8d4c9}.foot{display:flex;justify-content:space-between;gap:8px;margin-top:8px;color:#a0a0ab;font-size:11px}kbd{font:inherit;border:1px solid #36363e;border-radius:4px;padding:0 4px;margin-right:3px}.title{font-size:11px;color:#a0a0ab;margin:0 0 6px}</style><div class="box" role="dialog" aria-label="Hyper-Design-QA note"><p class="title">Captured · What needs fixing?</p><textarea placeholder="Start typing your note…"></textarea><div class="foot"><span><kbd>↵</kbd>Save <kbd>⇧↵</kbd>New line</span><span><kbd>Esc</kbd>Discard</span></div></div>';
    const box = root.querySelector('.box'), field = root.querySelector('textarea');
    const r = rect || {x: innerWidth/2 - 160, y: 60, width: 320, height: 0};
    const below = r.y + r.height + 10, top = below + 150 < innerHeight ? below : Math.max(10, r.y - 150);
    box.style.left = Math.min(Math.max(10, r.x), innerWidth - 330) + 'px'; box.style.top = Math.min(top, innerHeight - 150) + 'px';
    document.documentElement.append(host);
    let timer;
    const sync = () => { clearTimeout(timer); timer = setTimeout(async () => { try { const {draft} = await chrome.storage.local.get('draft'); if (draft?.id === id) await chrome.storage.local.set({draft: {...draft, comment: field.value}}); } catch {} }, 150); };
    const close = () => { clearTimeout(timer); host.remove(); window.removeEventListener('pointerdown', outside, true); delete window.__hyperQAToast; };
    const outside = e => { if (!e.composedPath().includes(host)) { flush(); close(); } };
    const flush = () => { if (field.value) chrome.storage.local.get('draft').then(({draft}) => draft?.id === id && chrome.storage.local.set({draft: {...draft, comment: field.value}})).catch(()=>{}); };
    field.addEventListener('input', sync);
    field.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); chrome.runtime.sendMessage({type:'discard-draft'}).catch(()=>{}); close(); }
      else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!field.value.trim()) return; chrome.runtime.sendMessage({type:'save-draft', id, comment: field.value.trim()}).catch(()=>{}); close(); }
    });
    // Keep page shortcuts from reacting while the reviewer types.
    for (const type of ['keyup','keypress']) field.addEventListener(type, e => e.stopPropagation());
    window.addEventListener('pointerdown', outside, true);
    window.__hyperQAToast = close;
    field.focus();
  }
  window.__hyperQA={cancel};
  window.addEventListener('pointermove',move,true);
  window.addEventListener('click',select,true);
  window.addEventListener('keydown',key,true);
})();
