# Security

## Report a vulnerability

Email **mad7droid@gmail.com** with the affected version, reproduction steps, and potential impact. Please do not publish an exploit or sensitive capture in a public issue before the report has been investigated. Use a minimal example without passwords, tokens, or private customer data.

Security fixes are developed on `main`. Chrome Web Store releases require separate submission and approval; check the manifest and changelog to see which fixes your installed version includes.

## Security model

- Reviews are local to the browser profile. The extension has no backend, analytics, automatic AI requests, or third-party runtime dependencies.
- Local review storage is limited to trusted extension contexts. The injected editor sends scoped draft updates through the background worker; it does not receive stored reviews or screenshots.
- Page scripts run in Chrome's isolated content-script world. Sender checks limit privileged navigation/window actions to the extension panel. Synthetic page keyboard events cannot activate capture shortcuts.
- The panel renders captured text and Markdown through DOM text nodes. Executable remote scripts and extension-origin network connections are blocked by the extension's Content Security Policy.
- Captures require broad website access to support reviews across navigations. Browser-protected pages remain subject to Chrome's restrictions.

## What to protect yourself

Screenshots, selected text, URLs, and comments may contain sensitive information. Review your files before sharing them. Local storage and exported ZIPs are not encrypted vaults. A closed shadow root improves editor isolation but cannot make a hostile webpage a trusted input surface; use the extension panel for sensitive notes.

Reports contain untrusted page content and user-authored Markdown. An AI agent or external Markdown viewer should treat them as data, inspect links, and require appropriate authorization before taking actions. Hyper Spec does not control external viewers or AI tools.

Do not commit `.env` files, credentials, private captures, browser profiles, or workspace attachments. `.context/`, `sites/`, and common credential files are excluded from Git. A `.gitignore` does not remove files already committed to history.

## Review performed November 7, 2026

The review covered the tracked source, manifest permissions/CSP, message handlers, local storage access, capture targeting, rendering/export paths, runtime dependencies, and repository files/history reachable from the fetched public branches.

- A pattern scan of 252 historical blobs found no matches for the checked private keys, common provider tokens, credential-bearing URLs, or literal secret assignments. This is a targeted scan, not a guarantee that every possible secret format is absent.
- GitHub secret scanning and push protection are enabled; its secret-scanning alert list was empty. Dependabot vulnerability alerts were enabled during this review; the initial alert list was empty.
- `npm audit` reported zero known vulnerabilities in the locked development dependencies. No npm dependencies ship in the extension.
- Fixed synthetic keyboard/picker activation, overbroad content-script access to local storage, insufficient message sender checks, and viewport capture targeting races. See **1.1.1** in [CHANGELOG.md](CHANGELOG.md).
- Regression tests cover rejected senders and stale/cross-page updates, evidence-field protection, storage isolation, synthetic shortcut rejection, and the ordinary capture/note/save workflow.

The source fixes do not change the already-submitted 1.1.0 store package. Version 1.1.1 must be submitted separately before store users receive them. This review is not a penetration test or an assurance that no vulnerabilities remain.

Implementation references: [Chrome extension security guidance](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure), [message security](https://developer.chrome.com/docs/extensions/develop/concepts/messaging#security-considerations), and [storage access levels](https://developer.chrome.com/docs/extensions/reference/api/storage).
