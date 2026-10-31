# Dashboard privacy fields

Publisher: Madhav Nair
Support: mad7droid@gmail.com

## Single purpose

Let users collect and annotate design QA findings from the webpages they choose, with element identifiers, visual specifications, and screenshots, then export those findings as a locally downloaded report.

## Permission justifications

- scripting: On an explicit capture action, inject the packaged picker into the chosen webpage, read selected-element computed styles and DOM identifiers, and optionally inspect exposed framework metadata to provide a component-name hint. No code is downloaded or executed from a remote server.
- storage: Retain the current review, one previous review, unfinished notes, and appearance preferences locally. Temporary review-window identifiers use storage.session.
- unlimitedStorage: Locally stored PNG screenshots from a review can exceed Chrome's normal extension storage quota. The permission prevents losing review evidence; no remote storage is used.
- sidePanel: Display the design review controls beside the webpage being reviewed and return there from the optional floating window.
- <all_urls>: Users can review arbitrary websites and navigate across domains. Host access allows user-triggered element inspection and captureVisibleTab screenshots, including when the separate review window is focused. captureVisibleTab requires <all_urls> or an activeTab grant, and an activeTab grant alone does not cover new cross-origin pages captured from the persistent review window. There are no persistent content scripts and no background page-content collection.

No remote code: Yes, confirm that the extension does NOT use remote code. All JavaScript and styles are packaged. Reading page metadata through a packaged MAIN-world function does not download or evaluate remote source code.

## Data usage

Disclose the data the extension handles rather than claiming it never handles user data merely because it is local:
- Website content: selected text, page identifiers, computed styles, and screenshots, collected only for the user's explicit review.
- Web history: URLs and page titles of the specific pages the user captures. No background browsing-history collection.
- User activity: explicit capture/review actions represented by finding timestamps and notes. No general click, mouse, or keyboard tracking across websites beyond the active element picker.

Screenshots and comments may incidentally contain other categories of personal data. Explain this local, user-selected handling in the privacy policy. Reconcile the dashboard's current definitions with these actual practices at submission; do not select “no data collected” if its wording includes local processing.

Certifications to review against the implementation:
- No sale or transfer of user data, apart from user-initiated downloads and sharing performed outside the extension.
- No use or transfer of user data unrelated to the single purpose.
- No use or transfer of user data to determine creditworthiness or for lending purposes.

Privacy-policy URL: https://hyper-design-qa-privacy.mad7droid.chatgpt.site/privacy/. The source policy is privacy-policy.md.
