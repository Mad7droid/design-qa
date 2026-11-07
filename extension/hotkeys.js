// Page-level S / P shortcuts. Active only while a Hyper Spec panel is open, so sites keep their own keys otherwise.
(() => {
  if (window.__hyperQAHotkeys) return; window.__hyperQAHotkeys = true;
  let active = false;
  chrome.storage.session.get('panelOpen').then(d => { active = !!d.panelOpen; }).catch(() => {});
  chrome.storage.session.onChanged.addListener(changes => { if (changes.panelOpen) active = !!changes.panelOpen.newValue; });
  window.addEventListener('keydown', e => {
    if (!e.isTrusted || !active || e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.isComposing || window.__hyperQA) return;
    const el = e.composedPath()[0];
    // The inline editor's closed shadow root retargets keyboard events to its host.
    if (el?.closest?.('[data-hyperqa-note]')) return;
    if (el?.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"]') || el?.isContentEditable) return;
    const command = {s: 'select-element', p: 'capture-page'}[e.key.toLowerCase()];
    if (!command) return;
    e.preventDefault(); e.stopImmediatePropagation();
    chrome.runtime.sendMessage({type: 'hotkey', command}).catch(() => {});
  }, true);
})();
