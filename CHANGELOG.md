# What's new

All notable changes to Hyper-Design-QA. Versions match `extension/manifest.json`.

## 1.1.0 — 1 Nov 2026

### Faster reviewing
- **Save & next:** `⌘↵` / `Ctrl+↵` in the on-page note box saves and starts selecting the next element right away.
- **Quick tags:** Spacing, Alignment, Typography, Colour, Copy, Accessibility, Responsive, Interaction. Click a chip, press `⌥1`–`⌥8`, or type `#spacing` in your note. Tags appear on cards and in the export.
- **Copy Markdown:** `⌘⇧C` / `Ctrl+Shift+C` copies the whole report to paste into Claude, Linear, or Slack.

### Type as soon as you capture
- After you select an element, a note box opens beside it on the page with the cursor ready. `↵` saves, `⇧↵` adds a line, `Esc` discards. Clicking away keeps the draft for the panel.
- Clicking anywhere in the panel after a capture puts the cursor in the note field.

### Links
- New optional **Links** field on each finding for Figma frames, tickets, or references. Figma links show as "Figma ↗" on the card.
- New **Session links** section for links that apply to the whole review.
- Exports include them under **Reference links** (session) and **Links** (per finding).

### Keyboard shortcuts
- `S` select and `P` capture page also work on the web page itself while the panel is open (never while typing in a field).
- Panel: `S` select, `P` capture page, `⌘↵` save, `Esc`/`Delete` discard, `C` focus note, `⌘Z` undo, `E` export, `?` shortcut list.
- Findings are focusable: `↵` edits, `Delete` removes.
- Global: `⌥⇧Q` open, `⌥⇧S` select, `⌥⇧P` capture page, from any web page.
- Buttons show their shortcut keys.

### Improvements
- Element name is auto-detected and now tucked under **Element details**; the editor shows only what you need to write.
- The on-page note box keeps focus after capture, works on sites with strict security policies, and opens even if the background worker hasn't reloaded yet.
- Discarding a capture no longer asks for confirmation. It can be undone instead.
- Undo now covers deleted findings, discarded captures, and new sessions, in order.
- Fixed Save and Undo being ignored while the screenshot preview was still loading.

## 1.0.0 — 31 Oct 2026

First public release, submitted to the Chrome Web Store.

- Select elements or capture the visible page, with marked screenshots and captured specs.
- Notes, priorities, and editable element names. Works across pages and tabs.
- Autosaved drafts, edit, delete with undo, rename, new session with restore.
- Export as ZIP (`report.md`, `session.json`, screenshots) or Markdown only.
- Linear-inspired dark and light themes, side panel or floating window.
