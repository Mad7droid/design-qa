# Reviewer instructions

No login, payment, credentials, backend, or AI service is required to use the extension.

1. Open a regular HTTPS website, such as https://example.com. Open Hyper Design QA from its toolbar action.
2. Click Select an element, then click a visible element on the webpage. Hover selection outlines the target; Escape cancels. A screenshot and technical details are captured only after selecting.
3. Add a note under What needs fixing?, optionally rename the element and choose a priority, then Save finding.
4. Navigate to another regular website and repeat. Both findings remain in the same local session.
5. Edit a finding. Delete it and use Undo to restore it.
6. Use Rename to change the review name. Use New session to inspect the export-first dialog; Keep reviewing cancels. Starting a new session retains the previous review for restoration.
7. Use the sun/moon buttons to switch themes. Reopen the panel to check persistence.
8. Click the Pop out icon beside the appearance controls. Move the native review window by its title bar. Use its capture controls to review the last focused normal browser window. Return to side panel docks it again. Chrome versions without sidePanel.close may leave the original panel open; it can be closed manually.
9. Export report. Unzip the downloaded archive: report.md links to the PNG files in screenshots/, and session.json contains structured findings. Markdown-only export intentionally excludes image files.

Screenshots are visible-viewport captures. Component names are best effort. Browser-protected pages and iframe/canvas internals are outside scope. The extension does not automatically send data to Claude or other services.

Permissions are explained in privacy-disclosures.md. There are no static content scripts, analytics, remote code, or extension-origin network requests. One current and one previous review are stored locally; uninstalling the extension removes its stored review data. User-downloaded exports remain in the user's Downloads folder.
