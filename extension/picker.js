(() => {
  if (window.__hyperQA) { window.__hyperQA.cancel(); }
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
  }
  window.__hyperQA={cancel};
  window.addEventListener('pointermove',move,true);
  window.addEventListener('click',select,true);
  window.addEventListener('keydown',key,true);
})();
