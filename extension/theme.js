// Apply before styles load so a saved light preference does not flash dark.
try { document.documentElement.dataset.theme=localStorage.getItem('hyper-theme')==='light'?'light':'dark'; }
catch { document.documentElement.dataset.theme='dark'; }
