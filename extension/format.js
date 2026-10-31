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
  return {key, render};
})();
