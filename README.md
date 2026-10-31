# Hyper-Design-QA

Source: https://github.com/Mad7droid/design-qa

Privacy policy: https://hyper-design-qa-privacy.mad7droid.chatgpt.site/privacy/

A Chrome extension for reviewing a website without opening developer tools. Select an element, describe what needs fixing, and collect findings across pages in one saved session. Export a report for a person or Claude.

## Install locally

1. Open `chrome://extensions` in Google Chrome (116 or later).
2. Turn on **Developer mode**, then choose **Load unpacked**.
3. Select this repository’s **extension** folder.
4. Pin **Hyper-Design-QA** from Chrome’s extensions menu. Open a website and click the extension to open its side panel.

No build, account, API key, or server is required. This is an unpacked development extension, not a Chrome Web Store release. It targets Chrome’s side panel API; Firefox and Safari are not supported.

## Review a website

1. Give your session a name.
2. Click **Select an element**, then click the element on the website. Press **Esc** to stop selecting. **Capture visible page** records the current viewport instead.
3. Describe the problem, optionally rename the element, choose a priority, and click **Save finding**.
4. Use the **Pop out** icon beside the appearance switch for a separate draggable, resizable review window. It follows the last browser window you focused. Use **Return to side panel** to dock it again. This is a regular Chrome window, not an always-on-top overlay.
5. Navigate to another page or tab and repeat. The current session and unfinished notes stay on this device, including after reopening Chrome.
6. Click **Export report**. Unzip the download, then attach `report.md` and relevant screenshots to Claude. The Markdown links to the included images. **Download Markdown only** exports the text separately; it does not include image files.

Findings can be edited or deleted. Delete has an Undo action. Use **Rename** to change a session name, then **Save name** or **Cancel**. Starting a new session offers export first and keeps one previous review, including its unfinished note. **Restore previous review** switches between the current and previous review. Starting another new session replaces the older saved review.

## Report contents

- `report.md`: consistent headings, finding IDs, priority, comments, page URL and title, component label and its source, selector, marked screenshot link, and JSON specifications.
- `session.json`: schema version 1 with structured findings and relative screenshot paths.
- `screenshots/<finding-id>.png`: visible-page evidence with the selected element outlined.

Captured specs include dimensions, viewport size, scroll position, pixel ratio, typography, spacing, colors, borders, layout, opacity, and shadows. React/Vue names are read from exposed runtime metadata when possible. Otherwise `data-component`, `data-testid`, or the HTML tag provides a label. These are hints, not guaranteed source-file mappings. You can rename a finding without losing its selector.

## Current boundaries

- Screenshots capture the **visible viewport**, not a stitched full page. A partly visible element is only partly shown.
- Selection works in the top document and open shadow DOM. Cross-origin frames, closed shadow DOM, canvas internals, and browser-protected pages cannot be inspected individually.
- Computed styles describe the captured state, not every responsive, hover, or interaction state. Framework names may be absent or minified in production.
- This version maintains one current session and one previous review for recovery. It does not send reports automatically to Claude or sync between devices.
- Screenshots can contain private page content. Review the exported files before sharing them.

## Permissions and data

Website access is needed to activate the picker on sites you navigate to and capture their visible viewport. Scripts only run when you press a capture button. `scripting` reads the selected element, `sidePanel` hosts the review UI, and `storage` / `unlimitedStorage` preserve findings and PNG evidence locally. The extension uses `<all_urls>` for cross-page capture; it does not also request the redundant `activeTab` permission. There are no analytics, external requests, or remote scripts in the extension. One current and one previous review are kept in extension storage. Starting another new session replaces the older saved review.

## Development and checks

The extension is plain HTML, CSS, and JavaScript using Manifest V3. After editing, reload it in `chrome://extensions` and reopen the side panel.

```sh
npm install
npm test
npm run check
npm run test:browser
```

The browser suite uses an installed Chrome executable on macOS. Set `CHROME_PATH` on other systems. It tests the rendered panel with mocked Chrome APIs and tests the real element picker against a fixture. It covers capture, required comments, saving, reload persistence, editing, delete/undo, ZIP downloads, narrow layouts, selection metadata, and Escape cancellation. The report tests cover Markdown formatting and ZIP structure. Browser permission prompts, side-panel integration, and real `captureVisibleTab` still require a manual loaded-extension smoke test.

## UX references

The interface uses near-black surfaces, fine dividers, compact typography, and a warm ivory primary action in the requested Linear dark-mode direction. Research and implementation decisions are recorded in [DESIGN.md](DESIGN.md).

## Chrome Web Store release

Run `npm run package` to build the upload ZIP under `.context/release/`. Listing copy, privacy disclosures, and reviewer instructions live in `release/`. The package includes only runtime extension files. Store assets and release status are prepared separately. Public availability requires submission and approval through the Chrome Web Store developer dashboard.

The public privacy-page source is in `privacy-site/`. The original `maddymanifest/design-qa` repository is not modified by this migration.
