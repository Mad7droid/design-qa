> Submitted on November 1, 2026. Google confirmed **Pending Review**. Automatic publication after approval is enabled. Item ID: `oolffllmbjflkicfkfiagiabmjbojilp`. See `release-status.json` for the saved status.

# Publish Hyper Design QA 1.0.0

Publisher: Madhav Nair
Support email: mad7droid@gmail.com
Public privacy policy: https://hyper-design-qa-privacy.mad7droid.chatgpt.site/privacy/

## Files to use

- Upload package: `.context/release/hyper-design-qa-1.0.0.zip`
- Listing text: `release/store-listing.md`
- Privacy explanations: `release/privacy-disclosures.md`
- Reviewer notes: `release/reviewer-instructions.md`
- Store icon: `.context/release/assets/store-icon-128.png`
- Store screenshots: `.context/release/assets/01-review-dark.png`, `02-capture-notes.png`, `03-review-light.png` (all 1280×800)
- Optional small promo: `.context/release/assets/promo-440x280.png`
- Release state and package checksum: `release/release-status.json`

## Dashboard steps

1. Open https://chrome.google.com/webstore/devconsole and use the Google account that should own the extension. The current browser is at Google's account verification step for mad7droid@gmail.com; finish verification yourself.
2. If this account is not registered, complete developer registration, the required agreement, and Google's registration fee. Those are account-owner actions. Verify any required publisher/contact information.
3. Add a new item and upload the ZIP. Its root contains manifest.json, not an enclosing directory.
4. Fill Store listing using the supplied copy. Upload the icon, screenshots, and optional promo. Set public support contact to mad7droid@gmail.com.
5. Fill Privacy practices with the extension's single purpose, permission justifications, no remote code, and the public policy URL. Review the actual dashboard's data-category definitions against the supplied explanations. Do not claim “no data” solely because captured data is local.
6. Set the item as free, Public, in all supported regions. Use the supplied reviewer instructions; no reviewer credentials are needed.
7. Resolve the dashboard's validation warnings. Review the final listing and privacy declarations before submitting for review. Google review is required; uploading a ZIP does not make the extension public.
8. Record the created item ID, listing URL, and submission status in release-status.json. Use automatic publication after approval if the publisher wants it available as soon as Google approves it.

The project source is published at https://github.com/Mad7droid/design-qa using the Mad7droid account. The original maddymanifest repository remains unchanged. The public gist contains only the privacy policy and the support details provided for publication.

## Rebuild

```sh
npm run store:assets
npm run package
npm test
npm run check
npm run test:browser
```

The package script creates a reproducible ZIP from runtime files only, with a SHA256 sidecar. It excludes tests, screenshots, developer dependencies, workspace attachments, and credentials. Store assets use the real extension interface with a demonstration website and fixture data, not private user screenshots.

## References

- https://developer.chrome.com/docs/webstore/prepare
- https://developer.chrome.com/docs/webstore/publish
- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/images
- https://developer.chrome.com/docs/webstore/register
