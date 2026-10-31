(() => {
  if (window.__hyperQA) { window.__hyperQA.cancel(); }
  window.__hyperQAToast?.();
  let target, hovered, trail = [];
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #e34b30;background:#e34b3014;box-sizing:border-box;display:none';
  const label = document.createElement('div');
  label.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;display:none;background:#e34b30;color:#fff;font:600 11px/1 system-ui;padding:4px 6px;border-radius:4px;white-space:nowrap;max-width:60vw;overflow:hidden;text-overflow:ellipsis';
  const hint = document.createElement('div');
  hint.textContent = 'Hyper-Design-QA · Click to select · ↑ parent · ↓ child · Esc cancel';
  hint.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;top:12px;left:50%;transform:translateX(-50%);background:#19191c;color:#ededf0;padding:10px 16px;border-radius:8px;font:13px system-ui;box-shadow:0 4px 24px #0004';
  document.documentElement.append(overlay, label, hint);
  const nameOf = el => el.getAttribute('data-component') || el.getAttribute('data-testid') || el.getAttribute('aria-label') || (el.localName + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : ''));
  function show(el) {
    target = el;
    const r = el.getBoundingClientRect();
    Object.assign(overlay.style, {display:'block',left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});
    label.textContent = `${nameOf(el).slice(0,48)} · ${Math.round(r.width)}×${Math.round(r.height)}`;
    Object.assign(label.style, {display:'block',left:Math.max(4,Math.min(r.x,innerWidth-200))+'px',top:(r.y>26?r.y-24:Math.min(r.bottom+4,innerHeight-22))+'px'});
  }
  function move(e) {
    const el = e.composedPath()[0];
    if (!(el instanceof Element) || el === hovered) return;
    hovered = el; trail = []; show(el);
  }
  function cancel() {
    overlay.remove(); label.remove(); hint.remove();
    window.removeEventListener('pointermove',move,true);
    window.removeEventListener('click',select,true);
    window.removeEventListener('keydown',key,true);
    chrome.runtime.onMessage?.removeListener(relay);
    delete window.__hyperQA;
    if (!selecting) chrome.runtime.sendMessage({type:'picker-ended'}).catch(()=>{});
  }
  // Keys pressed while the panel has focus are forwarded here, so ↑/↓ work without clicking the page first.
  function relay(message) { if (message?.type === 'picker-key') key({key: message.key, preventDefault(){}, stopImmediatePropagation(){}, composedPath: () => [target]}); }
  let selecting = false;
  function key(e) {
    if (e.key === 'Escape') { e.preventDefault(); cancel(); return; }
    if (!target) return;
    if (e.key === 'ArrowUp' && target.parentElement && target.parentElement !== document.documentElement) { e.preventDefault(); trail.push(target); show(target.parentElement); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); const child = trail.pop() || target.firstElementChild; if (child) show(child); }
    else if (e.key === 'Enter') { e.preventDefault(); select(e); }
  }
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
    const el=target||e.composedPath()[0];
    if (!(el instanceof Element)) return;
    selecting = true;
    const r=el.getBoundingClientRect(), s=getComputedStyle(el);
    const specs={};
    for(const p of ['display','position','box-sizing','color','background-color','font-family','font-size','font-weight','line-height','letter-spacing','text-align','padding','margin','gap','border','border-radius','box-shadow','opacity','align-items','justify-content']) specs[p]=s.getPropertyValue(p);
    const data={url:location.href,pageTitle:document.title,component:el.getAttribute('data-component')||el.getAttribute('data-testid')||el.localName,componentSource:el.hasAttribute('data-component')?'data-component':el.hasAttribute('data-testid')?'data-testid':'DOM tag (framework name unavailable)',selector:selector(el),tag:el.localName,role:el.getAttribute('role'),accessibleLabel:el.getAttribute('aria-label')||el.getAttribute('alt')||'',text:(el.innerText||el.textContent||'').trim().slice(0,1000),specs,rect:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight,devicePixelRatio,scrollX,scrollY},shadowRoot:el.getRootNode() instanceof ShadowRoot};
    cancel();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const result=await chrome.runtime.sendMessage({type:'selection',data});
    if(result?.error) alert('Hyper-Design-QA: '+result.error);
    else note(result?.id, el.getBoundingClientRect());
  }
  // Inline note box beside the selection, so typing can start the moment the capture lands.
  async function note(id, rect) {
    // Fall back to the stored draft so an older background worker still opens the box.
    if (!id) { try { id = (await chrome.storage.local.get('draft')).draft?.id; } catch {} }
    if (!id) return;
    const mac = /Mac/.test(navigator.platform), alt = mac ? '⌥' : 'Alt+';
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;z-index:2147483647;inset:auto';
    const root = host.attachShadow({mode:'closed'});
    root.innerHTML = '<div class="mark"></div><div class="box" role="dialog" aria-label="Hyper-Design-QA note"><p class="title">What needs fixing?</p><textarea placeholder="Start typing… - lists, **bold**, #tags and links work"></textarea><p class="tip" hidden>Tip: say what it should look like instead. ↵ again saves as is.</p><div class="prio" role="radiogroup" aria-label="Priority"><button data-p="High">High <kbd>'+alt+'1</kbd></button><button data-p="Medium" aria-checked="true">Medium <kbd>'+alt+'2</kbd></button><button data-p="Low">Low <kbd>'+alt+'3</kbd></button></div><div class="foot"><span><kbd>↵</kbd>Save <kbd>'+(mac?'⌘':'Ctrl')+'↵</kbd>Save &amp; next <kbd>⇧↵</kbd>Line</span><span><kbd>Esc</kbd>Discard</span></div></div>';
    const sheet = new CSSStyleSheet(); sheet.replaceSync(':host{all:initial}.mark{position:fixed;pointer-events:none;border:2px solid #e34b30;box-sizing:border-box;border-radius:2px}.box{position:fixed;width:320px;background:#19191c;color:#ededf0;border:1px solid #36363e;border-radius:10px;box-shadow:0 16px 48px #0007;font:13px/1.5 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:10px}textarea{box-sizing:border-box;width:100%;min-height:64px;resize:vertical;background:#101012;color:inherit;border:1px solid #36363e;border-radius:6px;padding:8px 9px;font:inherit;outline:none}textarea:focus{border-color:#d8d4c9}.foot{display:flex;justify-content:space-between;gap:8px;margin-top:8px;color:#a0a0ab;font-size:10px}kbd{font:inherit;border:1px solid #36363e;border-radius:4px;padding:0 4px;margin-right:3px}.title{font-size:11px;color:#a0a0ab;margin:0 0 6px}.tip{font-size:11px;color:#e5c07b;margin:6px 0 0}.prio{display:flex;gap:6px;margin-top:8px}.prio button{font:500 11px/1.4 inherit;font-family:inherit;color:#a0a0ab;background:none;border:1px solid #36363e;border-radius:12px;padding:3px 8px;cursor:pointer}.prio button kbd{border:0;padding:0;margin:0 0 0 2px;opacity:.7}.prio button[aria-checked="true"]{background:#e5e2da;color:#24231f;border-color:#e5e2da}'); root.adoptedStyleSheets = [sheet];
    const box = root.querySelector('.box'), field = root.querySelector('textarea'), tip = root.querySelector('.tip'), mark = root.querySelector('.mark');
    const r = rect || {x: innerWidth/2 - 160, y: 60, width: 0, height: 0, right: innerWidth/2 + 160, bottom: 60};
    Object.assign(mark.style, {left:r.x-3+'px',top:r.y-3+'px',width:r.width+6+'px',height:r.height+6+'px'});
    // Prefer beside the element so the outline stays visible; fall back below, above, then a corner.
    const W = 320, H = 190, gap = 12, right = (r.right ?? r.x + r.width), bottom = (r.bottom ?? r.y + r.height);
    const clampY = y => Math.max(10, Math.min(y, innerHeight - H - 10)), clampX = x => Math.max(10, Math.min(x, innerWidth - W - 10));
    let pos;
    if (right + gap + W < innerWidth) pos = [right + gap, clampY(r.y)];
    else if (r.x - gap - W > 0) pos = [r.x - gap - W, clampY(r.y)];
    else if (bottom + gap + H < innerHeight) pos = [clampX(r.x), bottom + gap];
    else if (r.y - gap - H > 0) pos = [clampX(r.x), r.y - gap - H];
    else pos = [innerWidth - W - 16, innerHeight - H - 16];
    box.style.left = pos[0] + 'px'; box.style.top = pos[1] + 'px';
    document.documentElement.append(host);
    let timer, severity = 'Medium';
    const update = async patch => { try { const {draft} = await chrome.storage.local.get('draft'); if (draft?.id === id) await chrome.storage.local.set({draft: {...draft, ...patch}}); } catch {} };
    const sync = () => { clearTimeout(timer); timer = setTimeout(() => update({comment: field.value}), 150); };
    const setPriority = p => { severity = p; for (const b of root.querySelectorAll('.prio button')) b.setAttribute('aria-checked', String(b.dataset.p === p)); update({severity: p}); };
    for (const b of root.querySelectorAll('.prio button')) b.addEventListener('click', () => { setPriority(b.dataset.p); field.focus(); });
    const close = () => { clearTimeout(timer); host.remove(); window.removeEventListener('pointerdown', outside, true); delete window.__hyperQAToast; };
    const outside = e => { if (!e.composedPath().includes(host)) { if (field.value) update({comment: field.value}); close(); } };
    let warned = false;
    field.addEventListener('input', () => { sync(); tip.hidden = true; });
    field.addEventListener('keydown', e => {
      e.stopPropagation();
      if (window.hyperFormat?.key(field, e)) { e.preventDefault(); return; }
      if (e.altKey && /^Digit[1-3]$/.test(e.code)) { e.preventDefault(); setPriority(['High','Medium','Low'][+e.code.slice(5)-1]); return; }
      if (e.key === 'Escape') { e.preventDefault(); chrome.runtime.sendMessage({type:'discard-draft'}).catch(()=>{}); close(); }
      else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault(); const comment = field.value.trim(); if (!comment) return;
        // A one-word note rarely tells the fixer enough; nudge once, never block.
        if (!warned && comment.replace(/#\w+|https?:\/\/\S+/g,'').trim().split(/\s+/).length < 3) { warned = true; tip.hidden = false; return; }
        chrome.runtime.sendMessage({type:'save-draft', id, comment, severity, next: e.metaKey || e.ctrlKey}).catch(()=>{}); close();
      }
    });
    // Keep page shortcuts from reacting while the reviewer types.
    for (const type of ['keyup','keypress']) field.addEventListener(type, e => e.stopPropagation());
    window.addEventListener('pointerdown', outside, true);
    window.__hyperQAToast = close;
    // Pull focus back if the panel grabs it in the first moments after capture.
    let touched = false;
    host.addEventListener('pointerdown', () => { touched = true; });
    const keep = () => { if (!touched && host.isConnected) setTimeout(() => { if (!touched && host.isConnected && !field.value) field.focus(); }, 0); };
    field.addEventListener('blur', keep);
    setTimeout(() => field.removeEventListener('blur', keep), 1500);
    window.focus(); field.focus();
  }
  window.__hyperQA={cancel};
  window.addEventListener('pointermove',move,true);
  window.addEventListener('click',select,true);
  window.addEventListener('keydown',key,true);
  chrome.runtime.onMessage?.addListener(relay);
})();
