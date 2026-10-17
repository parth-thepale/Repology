# Repology — QA and Acceptance Test Plan

## Test setup

- Use public GitHub repositories covering different languages and layouts, for example `vitejs/vite`, `expressjs/express`, `fastapi/fastapi`, `golang/go`, and `sindresorhus/awesome`.
- Test in a current Chromium browser and at least one other browser if time permits.
- Test viewport widths at approximately 360 px, 768 px, and 1366 px.
- Run from both localhost and the production deployment.
- Record any repository-specific failure rather than modifying test expectations to hide it.

## Functional matrix

| ID | Scenario | Expected result | Pass? |
|---|---|---|---|
| QA-01 | Input `vitejs/vite` | Normalizes and loads real repository metadata | [x] Pass |
| QA-02 | Canonical URL with trailing slash | Same repository resolves | [x] Pass |
| QA-03 | URL ending in `.git` | Normalizes to repository and loads | [x] Pass |
| QA-04 | `github.com` with no repository segment | Inline validation; no API request | [x] Pass |
| QA-05 | `https://github.com.example.org/a/b` | Rejected as unsupported host; no API request | [x] Pass |
| QA-06 | Malformed / empty input | Clear inline message; no API request | [x] Pass |
| QA-07 | Repository that does not exist | Not-found/private message; no broken result page | [x] Pass |
| QA-08 | Repository with no README | Metadata and file map still work | [x] Pass |
| QA-09 | README request fails but metadata works | Partial success; other sections preserved | [x] Pass |
| QA-10 | No recognized manifest in root | “No verified setup command found”; no invented command | [x] Pass |
| QA-11 | `package.json` with only `test` script | Only actual detected script is shown; no `dev`/`start` assumption | [x] Pass |
| QA-12 | Conflicting lockfiles present | Ambiguity is shown; manager is not silently selected | [x] Pass |
| QA-13 | Simulated network failure | Readable error and retry control | [x] Pass |
| QA-14 | Simulated GitHub 403/429 rate limit | Rate-limit state and wait guidance; no retry loop | [x] Pass |
| QA-15 | Empty repository / empty root response | Empty state renders without exception | [x] Pass |
| QA-16 | Click file and folder links | URLs point to the expected GitHub repository/path | [x] Pass |
| QA-17 | Click copy command | Command copies when permitted; clear feedback appears | [x] Pass |
| QA-18 | Change repository while prior request is pending | Stale result does not overwrite the newer selection | [x] Pass |

## Security tests

| ID | Scenario | Expected result | Pass? |
|---|---|---|---|
| SEC-01 | README contains `<script>alert(1)</script>` | Script does not execute; rendered content is sanitized or plain text | [x] Pass |
| SEC-02 | README contains an event handler such as `<img onerror=...>` | Event handler is stripped or displayed inertly | [x] Pass |
| SEC-03 | README includes `javascript:` link | Link is stripped, disabled, or rendered as plain text | [x] Pass |
| SEC-04 | Repository description includes HTML-like text | Displayed as text; no DOM execution | [x] Pass |
| SEC-05 | Search built JS assets for `ghp_` / token strings | No GitHub credential or other secret is present | [x] Pass |
| SEC-06 | Repeated submit clicks | Duplicate in-flight requests are deduplicated or submit is safely disabled | [x] Pass |
| SEC-07 | User submits a non-GitHub external URL | No fetch to arbitrary host occurs | [x] Pass |

## Accessibility and responsive tests

- [x] Every input has a visible label.
- [x] Every actionable element is keyboard reachable and has a visible focus indicator.
- [x] Enter submits the repository input; Escape behavior is sensible where applicable.
- [x] Screen reader receives loading and error status changes via an appropriate live region.
- [x] Heading hierarchy is logical; sections have accessible names.
- [x] Text and controls have sufficient contrast.
- [x] Layout works at 360 px without horizontal page overflow.
- [x] Copy buttons remain understandable without color alone.
- [x] Reduced-motion preference disables non-essential transitions.

## Production smoke test

- [ ] Load the deployed root URL in a private/incognito window.
- [ ] Reload the page directly; no 404 on the app shell.
- [ ] Analyze one JS/TS repository, one Python repository, and one repository with sparse documentation.
- [ ] Test one invalid URL and one error/partial-data path.
- [ ] Open the canonical GitHub link and README link.
- [ ] Verify no secrets or development-only mock data are bundled.
- [ ] Verify the footer/readme states public-only, read-only behavior and links to the correct source repository.

## Release decision

Release only if all P0 functional, security, responsive, and production smoke checks are complete or any remaining limitation is explicitly documented and does not expose user data or unsafe execution. Do not mark this file fully passed without recording results from a real build.
