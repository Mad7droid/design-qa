# Interface decisions

## Scope

A person without developer-tool experience reviews a live page, records what needs fixing, and exports usable evidence for Claude. The target is the extension side panel and capture interaction. The requested visual direction is Linear. Existing capture, persistence, page navigation, and structured export remain part of the product.

## Research and decisions

| Decision | Evidence | Applied behavior |
| --- | --- | --- |
| Description is the main task; metadata is secondary | [Linear issue creation](https://mobbin.com/screens/ffa2e456-85c7-4005-b361-de79dc6b6dc7) places title and description above compact properties | Screenshot and “What needs fixing?” appear before name and priority. Technical details are collapsed. |
| Empty state explains the next action | [Attio task list](https://mobbin.com/screens/314e2a2a-3588-4858-bdb1-47fa2b2652ca) shows a first-task action with the empty state | The empty state points to selection and shows the Select → Add a note → Export sequence. Exact wording and step presentation are implementation judgments. |
| Restraint in the shell | [Linear issue detail](https://mobbin.com/screens/d0f8ebba-34b7-469c-a708-1069e55a3e02) uses a white canvas, light separators, and compact properties | White surfaces, small headings, fine dividers, and one purple capture action replace the initial green palette and oversized introduction. This theme change follows the user’s explicit request. |
| Visible guidance rather than remembered instructions | [NN/g: recognition and recall](https://www.nngroup.com/articles/recognition-and-recall/) recommends visible or easily retrievable task information | Capture labels state their scope; the editor includes an example comment; export help stays available next to export. |
| Errors identify how to proceed | [NN/g: usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) describes actionable errors and error prevention | Empty comments focus the note field and show a correction; session replacement requires confirmation; deletion offers Undo. |
| Keyboard focus and usable controls | [WCAG 2.2](https://www.w3.org/TR/WCAG22/) covers visible focus and target size | Focus outlines, explicit labels, live status text, minimum control dimensions, reduced-motion handling, and no horizontal overflow at 280px. This is not a claim of a full accessibility audit. |

Mobbin references are examples from individual products, not evidence of improved completion rates. No user usability study has been performed. The interface still needs a manual extension smoke test and testing with nontechnical participants.

## Validation

Automated checks cover the real rendered panel with mocked extension APIs, actual picker extraction on a fixture page, report serialization, and ZIP integrity. Live Chrome permission and side-panel behavior are listed separately in the README so these checks are not mistaken for installed-extension verification.

## Dark-mode visual update

The user confirmed that the UX works as expected and requested Linear’s dark-mode design language. This pass preserves layout, labels, capture behavior, session storage, and export behavior.

[Linear’s dark issue list](https://mobbin.com/screens/e142df2a-3527-499c-8f81-1b715947ac0c) shows near-black backgrounds, restrained surface changes, muted metadata, and subtle dividers. [Linear’s dark preferences](https://mobbin.com/screens/c968b3b2-82a5-4044-8e4a-0bec5683dec5) shows raised control surfaces. These are examples from one product, selected for the user’s explicit visual reference.

Applied a dark color scheme with shared tokens for backgrounds, raised surfaces, borders, text, disabled controls, status, error feedback, and focus. Purple remains limited to the existing primary action and focus treatment. Screenshots retain their original page colors. This is a visual styling change, not a change to the review flow.

## Neutral accent update

The user rejected the purple accent. Primary buttons and the brand mark now use warm ivory with dark text. Focus rings use the same neutral family, and informational status messages use charcoal surfaces. Layout and interactions are unchanged. This palette choice is an implementation judgment in response to the user’s preference.

## Session controls and identity

The supplied screenshot shows a session title styled as a heading, with no explicit edit action, and a text-only New session control. Session renaming now uses an explicit Rename button, a labeled field, Save name and Cancel, and Escape to cancel. New session opens a dialog showing the number of findings with export-first, start-without-export, and keep-reviewing choices. One previous session and its unfinished note stay available through Restore previous review, including after reopening the panel. Starting a new session opens the name field.

The logo is an original vector selection frame around a central square, reflecting element capture without a letter or sparkle. The same asset is used in the panel and rendered to PNG at Chrome’s icon sizes. These session and logo decisions are implementation judgments responding to the user’s screenshot and request.

## Appearance switch

A sun/moon segmented control beside the product name switches between warm neutral light and dark themes. The choice is stored locally, restored before styles load to avoid a theme flash, and synchronized across open extension panels. Both controls have accessible names, pressed states, keyboard focus, and native title hints. Browser checks cover switching, reload persistence, and the narrow header layout.

## Floating review window

The header includes Pop out beside appearance controls. It opens or focuses one native Chrome popup window, which can be dragged by its title bar and resized. Return to side panel reopens the panel and closes the popup. Captures target the most recently focused normal browser window, while stored findings, notes, and theme are shared. The side panel closes automatically where Chrome supports its close API; earlier supported Chrome versions can leave it open and receive storage updates. This is a regular OS window, not an always-on-top webpage overlay.

Verification includes automated popup reuse, source-window targeting, docking calls, and draft persistence, plus installed Chrome pop-out and docking checks.
