// Lightweight Markdown helpers shared by the panel and the on-page note box.
// Notes stay plain Markdown, so exports need no conversion.
globalThis.hyperFormat = (() => {
  const LIST = /^(\s*)(- \[[ xX]\]|[-*•]|\d+[.)])\s+(.*)$/;
  const changed = field => field.dispatchEvent(new Event('input', {bubbles: true}));
  function wrap(field, mark) {
    const {selectionStart: s, selectionEnd: e, value} = field, picked = value.slice(s, e);
    field.setRangeText(mark + picked + mark, s, e, 'end');
    if (!picked) field.setSelectionRange(s + mark.length, s + mark.length);
    changed(field);
  }
  function link(field) {
    const {selectionStart: s, selectionEnd: e, value} = field, text = value.slice(s, e) || 'link';
    field.setRangeText(`[${text}](url)`, s, e, 'end');
    const at = s + text.length + 3; field.setSelectionRange(at, at + 3); changed(field);
  }
  // Returns true when the key was used for formatting, so callers skip their own handling.
  function key(field, e) {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.shiftKey && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'b') { wrap(field, '**'); return true; }
      if (k === 'i') { wrap(field, '_'); return true; }
      if (k === 'e') { wrap(field, '`'); return true; }
      if (k === 'k') { link(field); return true; }
      return false;
    }
    if (mod || e.altKey || e.isComposing || field.selectionStart !== field.selectionEnd) return false;
    const {value} = field, at = field.selectionStart, start = value.lastIndexOf('\n', at - 1) + 1, line = value.slice(start, at), m = line.match(LIST);
    if (!m) return false;
    if (e.key === 'Tab') {
      if (e.shiftKey) { const cut = Math.min(2, m[1].length); field.setRangeText('', start, start + cut, 'preserve'); field.setSelectionRange(at - cut, at - cut); }
      else { field.setRangeText('  ', start, start, 'preserve'); field.setSelectionRange(at + 2, at + 2); }
      changed(field); return true;
    }
    if (e.key !== 'Enter' || e.shiftKey) return false;
    // Enter on an empty item ends the list; otherwise continue it.
    if (!m[3].trim()) { field.setRangeText('', start, at, 'end'); changed(field); return true; }
    let marker = m[2];
    if (/^\d/.test(marker)) marker = (parseInt(marker, 10) + 1) + marker.slice(-1);
    else if (marker.startsWith('- [')) marker = '- [ ]';
    field.setRangeText('\n' + m[1] + marker + ' ', at, at, 'end'); changed(field); return true;
  }
  // Safe renderer for the subset we support; builds DOM nodes, never HTML strings.
  const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)|(?<![\w*_])[_*][^_*\n]+[_*](?![\w*_])|https?:\/\/[^\s)]+)/g;
  function inline(text, parent) {
    let last = 0;
    for (const match of text.matchAll(INLINE)) {
      parent.append(text.slice(last, match.index)); last = match.index + match[0].length;
      const t = match[0]; let node;
      if (t.startsWith('**')) { node = document.createElement('strong'); node.textContent = t.slice(2, -2); }
      else if (t.startsWith('`')) { node = document.createElement('code'); node.textContent = t.slice(1, -1); }
      else if (t.startsWith('[')) { const [, label, url] = t.match(/^\[([^\]]+)\]\((.+)\)$/); node = document.createElement('a'); node.href = url; node.textContent = label; }
      else if (/^https?:/.test(t)) { node = document.createElement('a'); node.href = t; node.textContent = t; }
      else { node = document.createElement('em'); node.textContent = t.slice(1, -1); }
      if (node.localName === 'a') { node.target = '_blank'; node.rel = 'noopener'; }
      parent.append(node);
    }
    parent.append(text.slice(last));
  }
  function render(text) {
    const out = document.createDocumentFragment(); let list = null;
    for (const raw of String(text || '').split('\n')) {
      const m = raw.match(LIST);
      if (m) {
        const ordered = /^\d/.test(m[2]);
        if (!list || (list.localName === 'ol') !== ordered) { list = document.createElement(ordered ? 'ol' : 'ul'); out.append(list); }
        const li = document.createElement('li'); li.style.marginLeft = Math.floor(m[1].length / 2) * 14 + 'px';
        if (m[2].startsWith('- [')) { li.className = 'task'; li.append(/x/i.test(m[2]) ? '☑ ' : '☐ '); }
        inline(m[3], li); list.append(li); continue;
      }
      list = null;
      if (!raw.trim()) continue;
      const p = document.createElement('p'); inline(raw, p); out.append(p);
    }
    return out;
  }
  // Live styling: a backdrop draws formatted text behind a transparent textarea.
  // Styles never change character widths (bold uses a stroke, not a heavier weight), so the caret stays aligned.
  const css = `.hf-live{position:relative;display:block}
.hf-back{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:var(--hf-bg,transparent);white-space:pre-wrap;overflow-wrap:break-word;border-color:transparent!important;color:var(--hf-text,inherit)}
.hf-field{position:relative;background:transparent!important;color:transparent!important;caret-color:var(--hf-text,#ededf0)}
.hf-field::placeholder{color:var(--hf-placeholder,#8a8a93)}
.hf-field::selection{color:transparent;background:rgba(130,150,255,.35)}
.hf-dim{opacity:.4}
.hf-b{-webkit-text-stroke:.45px currentColor}
.hf-i{color:var(--hf-italic,#c8c3b6)}
.hf-code{background:rgba(127,127,127,.2);border-radius:3px}
.hf-link{text-decoration:underline;text-underline-offset:2px}
.hf-tag,.hf-list{color:var(--hf-accent,#d8c48f)}`;
  const TOKENS = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)|(?<![\w*_])[_*][^_*\n]+[_*](?![\w*_])|https?:\/\/[^\s)]+|(?<![\w#&])#[A-Za-z][\w-]*)/g;
  const span = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; return s; };
  function paint(text) {
    const out = document.createDocumentFragment();
    text.split('\n').forEach((line, n) => {
      if (n) out.append('\n');
      const m = line.match(/^(\s*)(- \[[ xX]\]|[-*•]|\d+[.)])(\s)/);
      if (m) { out.append(m[1], span('hf-list', m[2]), m[3]); line = line.slice(m[0].length); }
      let last = 0;
      for (const t of line.matchAll(TOKENS)) {
        out.append(line.slice(last, t.index)); last = t.index + t[0].length; const v = t[0];
        if (v.startsWith('**')) { const b = span('hf-b', ''); b.append(span('hf-dim', '**'), v.slice(2, -2), span('hf-dim', '**')); out.append(b); }
        else if (v.startsWith('`')) { const c = span('hf-code', ''); c.append(span('hf-dim', '`'), v.slice(1, -1), span('hf-dim', '`')); out.append(c); }
        else if (v.startsWith('[')) { const i = v.indexOf(']('); out.append(span('hf-dim', '['), span('hf-link', v.slice(1, i)), span('hf-dim', v.slice(i))); }
        else if (v.startsWith('#')) out.append(span('hf-tag', v));
        else if (/^https?:/.test(v)) out.append(span('hf-link', v));
        else { const i = span('hf-i', ''); i.append(span('hf-dim', v[0]), v.slice(1, -1), span('hf-dim', v[0])); out.append(i); }
      }
      out.append(line.slice(last));
    });
    return out;
  }
  function live(field, root = document) {
    if (field.__hfLive) return; field.__hfLive = true;
    if (!root.adoptedStyleSheets.some(x => x.__hf)) { const sheet = new CSSStyleSheet(); sheet.replaceSync(css); sheet.__hf = true; root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]; }
    const wrap = document.createElement('div'), back = document.createElement('div');
    wrap.className = 'hf-live'; back.className = 'hf-back'; back.setAttribute('aria-hidden', 'true');
    field.before(wrap); wrap.append(back, field);
    const metrics = () => {
      const cs = getComputedStyle(field);
      for (const p of ['font','letterSpacing','wordSpacing','textIndent','tabSize','lineHeight','paddingTop','paddingLeft','paddingBottom','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderStyle','borderRadius','boxSizing']) back.style[p] = cs[p];
      // Leave room for the textarea's scrollbar so lines wrap at the same place.
      const bar = field.offsetWidth - field.clientWidth - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
      back.style.paddingRight = parseFloat(cs.paddingRight) + Math.max(0, bar) + 'px';
    };
    // Grow with the text up to a cap, then scroll.
    const grow = () => { if (!field.dataset.hfMax) return; field.style.height = 'auto'; field.style.height = Math.min(field.scrollHeight + 2, +field.dataset.hfMax) + 'px'; };
    const sync = () => { back.replaceChildren(paint(field.value + '\n')); grow(); back.scrollTop = field.scrollTop; };
    metrics(); field.classList.add('hf-field'); sync();
    field.addEventListener('input', sync); field.addEventListener('scroll', () => { back.scrollTop = field.scrollTop; });
    new ResizeObserver(() => { metrics(); back.scrollTop = field.scrollTop; }).observe(field);
    // Programmatic value changes (restoring drafts, editing a finding) repaint too.
    const desc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    Object.defineProperty(field, 'value', {configurable: true, get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); sync(); }});
  }
  return {key, render, live};
})();
