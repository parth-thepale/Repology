# Repology — Overnight Execution Plan

**Goal:** Produce a public, usable, read-only MVP by the next morning. The timeline is a target, not a guarantee; a successful deployed P0 slice matters more than checking every optional feature.

## 1. Non-negotiable rules

1. Lock P0 scope before coding. No AI, login, database, private repos, or extra Git hosts.
2. Keep `main` buildable. After each vertical slice, run `npm run build`.
3. Deploy once the smallest end-to-end flow works, then improve it. Do not leave deployment until the last 10 minutes.
4. If behind schedule, drop polish and P1 features—not input validation, error handling, README safety, or production smoke tests.
5. Never claim a setup command has been verified unless the implementation actually verifies it; it must not run repository code to test it.

## 2. Time-boxed plan (India time)

This schedule assumes work begins around 9:45 PM and aims for an early-morning release. Adjust times to the actual start; preserve durations and priority order.

| Window | Work | Deliverable / exit test |
|---|---|---|
| 9:45–10:00 PM | Create GitHub repo, Vite app, install dependencies, add docs/license decision | `npm run dev` works; clean repo structure exists |
| 10:00–10:30 PM | Design tokens, typography, landing, URL field, responsive shell | A stranger can understand the product and submit a sample repo |
| 10:30–11:00 PM | Pure URL parser + tests; GitHub API wrapper and normalized errors | Valid URL parses; invalid host/shape rejected before fetch |
| 11:00–11:35 PM | Metadata fetch and result header/cards | A valid public repository produces metadata; missing fields do not crash UI |
| 11:35 PM–12:05 AM | Root contents, file type cues, direct GitHub links | File map renders; folders/files open the correct GitHub paths |
| 12:05–12:35 AM | README preview + fallback; safe rendering decision | README and no-README states work; content cannot execute HTML/script |
| 12:35–1:05 AM | Setup evidence and command cards | Manifest signals detected; actual `package.json` scripts inspected when needed |
| 1:05–1:25 AM | Contribution links, loading/empty/error states, retry | Rate-limit/network/not-found states are understandable and recoverable |
| 1:25–1:45 AM | Responsive + accessibility pass; varied repository smoke tests | 360 px and desktop checked; keyboard and focus states work |
| 1:45–2:00 AM | Production build and Vercel deployment | Deployed URL opens from a clean session |
| 2:00–2:20 AM | Production smoke tests, README, screenshots, release notes | Launch checklist passes; failures are documented, not hidden |

## 3. Task board

### P0 — Must ship

- [ ] P0-01 Initialize Vite + vanilla JS + CSS and create the repository.
- [ ] P0-02 Build accessible landing form and responsive base styles.
- [ ] P0-03 Implement and test URL normalization/validation.
- [ ] P0-04 Add API wrapper with clear error categories, caching, and dedupe.
- [ ] P0-05 Fetch repository metadata and render nullable fields safely.
- [ ] P0-06 Fetch root contents and link to canonical GitHub paths.
- [ ] P0-07 Show README safely and support missing/failed README.
- [ ] P0-08 Detect common manifests; show evidence-labelled setup guidance.
- [ ] P0-09 Add contribution/issues/pulls links.
- [ ] P0-10 Handle rate limit, network failure, not-found/private, partial success.
- [ ] P0-11 Mobile and keyboard QA, production build, deploy, smoke test.
- [ ] P0-12 README, contributing instructions, issue templates, release checklist.

### P1 — Only if P0 is safe

- [ ] P1-01 Lazy-expand a folder by fetching its children when selected.
- [ ] P1-02 Parse `package.json` scripts into verified script links/commands.
- [ ] P1-03 Small README section navigation.
- [ ] P1-04 Loading skeletons and mild motion respecting reduced-motion.

### Explicitly cut for tonight

- AI-generated summaries or chat.
- GitHub OAuth, personal access tokens, private repositories.
- User history, login, backend, database, or analytics.
- Repository cloning, build/test execution, or file uploads.
- Multi-provider search and “security score”.
- Elaborate animation, complex charts, deep code analysis, custom auth.

## 4. Suggested implementation order

Build one working vertical slice first:

1. User submits valid public repo.
2. App shows repository name and description from the API.
3. App shows a useful error when the repo cannot be accessed.
4. App adds file map and README.
5. App adds setup guidance and contribution links.
6. App polishes layout, responsive states, and deployment.

Do not implement every UI panel with mock data and then attempt API integration at the end. The real request path must work early.

## 5. Risk-triggered cutline

At **12:30 AM**, check whether metadata, root contents, and safe README rendering work end to end. If not, freeze optional features and prioritize those three plus error handling and deployment.

At **1:30 AM**, stop adding features. Fix high-severity issues only: app crashes, unsafe rendering, broken production routing, non-responsive layout, or invalid commands presented as verified.

If a feature is still unstable at release time, remove or label it as unavailable rather than shipping a broken control.

## 6. Release gates

- **Gate A — Local:** valid repo works; invalid input makes no request; no unhandled promise rejection.
- **Gate B — Security:** README uses text or sanitized Markdown; no secrets or code execution.
- **Gate C — Resilience:** not-found, rate-limit, network, missing README, missing manifest all have states.
- **Gate D — UX:** mobile, keyboard, loading feedback, copy confirmation, no horizontal overflow.
- **Gate E — Production:** deployed URL tested in a clean session; README's live link matches reality.

## 7. Definition of a good overnight launch

A small product that completes its core workflow reliably is better than a broad dashboard full of fake, fragile, or unfinished features. It is acceptable to label the first release `0.1.0 — MVP` and ask early users to report errors through GitHub Issues.
