# What's new

All notable changes to Hyper-Design-QA. Versions match `extension/manifest.json`.

## 1.1.0 — 1 Nov 2026

### Clearer names and controls
- **Readable element names** when a site doesn't expose component names: `Button · “Reply”`, `Text · “Please confirm…”`, `Image · “Google logo”` instead of `div`. Generated names like `styled__C` are skipped.
- **Close button (×)** on the on-page note box discards the capture, same as `Esc`.
- Simpler note box: no title, plain priority chips, one "↵ Save" hint.

### Rich notes
- **Live formatting while you type:** bold, italic, `code`, links, list markers, and #tags are styled right in the note field (the Markdown markers stay visible but faded). The note box grows with your text.
- Notes support Markdown: `- lists` and `1. lists` continue on `↵` (press `↵` on an empty item to end the list), `Tab` / `⇧Tab` indent, `⌘B` bold, `⌘I` italic, `⌘E` code, `⌘K` link, and `- [ ]` checklists.
- Works in both the on-page note box and the panel. Finding cards show the formatting; the report keeps the Markdown as written.

### UX review fixes
- **Picker:** live label with element name and size; `↑`/`↓` moves to parent/child; `↵` selects. These keys work whether focus is on the page or the panel.
- **Note box:** opens beside the element so the outline stays visible; set priority with `⌥1`–`⌥3`; links typed in the note are added to Links; one-word notes get a gentle nudge (press `↵` again to save anyway).
- **Feedback** now appears as a toast at the bottom of the panel, with Undo; the required-note error shows under the field.
- **Focused editor:** while describing an issue, the session, list, and export controls step aside.
- **Findings** are grouped by page, show a thumbnail, and show **Figma link** / **Design link** buttons when links are attached. Clicking the thumbnail reopens the page and re-highlights the element. Priority filter appears from 4 findings.
- **Close-up screenshots** of the element are added to the export and report.
- **Auto-named sessions** from the first page reviewed and the date.
- Removed the "On-device storage" header line (now in the Privacy link); export hint explains Copy vs Export; light-mode placeholder contrast raised to AA.

### Faster reviewing
- **Save & next:** `⌘↵` / `Ctrl+↵` in the on-page note box saves and starts selecting the next element right away.
- **Quick tags:** Spacing, Alignment, Typography, Colour, Copy, Accessibility, Responsive, Interaction. Click a chip, press `⌥1`–`⌥8`, or type `#spacing` in your note. Tags appear on cards and in the export.
- **Copy Markdown:** `⌘⇧C` / `Ctrl+Shift+C` copies the whole report to paste into Claude, Linear, or Slack. The button confirms with "✓ Copied".

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

### Cleaner reports
- New **Summary** table at the top (ID, priority, element, page, issue) and priority counts.
- Finding headings use the same `QA-01` IDs as the panel.
- Readable timestamps, rounded bounds, and `css` / `json` code fences.
- Captured styles drop default values (`normal`, `none`, `0px`, transparent), and long element text is trimmed to a short excerpt.
- Copied Markdown says where to find screenshots instead of linking to images that aren't there.

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
