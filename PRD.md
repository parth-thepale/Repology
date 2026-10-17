# Repology — Product Requirements Document

**Version:** 1.0  
**Date:** 17 October 2026  
**Status:** Build-ready MVP draft  
**Working tagline:** Understand the code. Find your way in.  
**Selected project name:** Repology  
**Brand status:** Naming conflict identified; public launch under this name is not cleared.

## 1. Executive summary

> **Brand/name blocker — read before public launch:** “Repology” is already used by an established open-source service that tracks and compares software package versions across package repositories. Its official website is [repology.org](https://repology.org/) and its GitHub organization is [github.com/repology](https://github.com/repology). This project is a different product (GitHub repository orientation), but the exact name creates discoverability, user-confusion, and potential legal/brand risk. The name is retained here because it is the user's selected working name; do not publish a public launch, domain, social handle, or trademark claim under it until the maintainer resolves this conflict. Consider selecting a distinct name before launch.

Repology is a lightweight, open-source web tool that helps people orient themselves inside a public GitHub repository. The user pastes a repository URL and receives a structured first look at the project's metadata, root-level structure, README, setup signals, and contribution entry points.

The product is intentionally not an AI code reviewer, package installer, repository scanner, or project-rating system. It is a trustworthy first map that separates **observed facts** from **suggestions**. The overnight MVP should be small enough to build, test, and deploy in one focused session and useful enough that a stranger can use it the following morning.

## 2. Problem statement

A newcomer can discover a promising open-source repository but still struggle to answer basic questions: What is this project? Which language or framework does it use? Where should I start reading? What files control setup? Which commands are actually supported by the repository? Where are the contributing rules and issues?

Information is often split across repository metadata, README sections, manifest files, root directories, and community links. Repology reduces this initial orientation cost without requiring users to install anything or trust an opaque AI summary.

## 3. Product goals

### Primary goals

- Turn a public GitHub repository URL into a useful, structured overview.
- Help a beginner find repository facts, files, setup evidence, and contribution links quickly.
- Make setup guidance source-backed and honest about uncertainty.
- Ship a public, responsive, accessible MVP with no user accounts or paid API dependency.
- Make the codebase and issue process approachable for open-source contributions.

### Success measures for the first release

These are release criteria to verify, not promises about live performance:

- At least 9 of 10 selected test repositories load their metadata and root listing successfully when GitHub is available and not rate-limiting requests.
- Invalid URL, missing repository, unavailable README, API outage, and rate-limit states each show a specific understandable message.
- First useful repository summary is visible within 10 seconds on a normal connection when API responses are healthy; record slower cases during validation rather than claiming a universal SLA.
- Essential flows work at 360 px, 768 px, and desktop widths.
- A keyboard-only user can enter a URL, submit it, navigate result sections, and reach external links.
- No repository content is executed; untrusted README content is sanitized or shown as text.
- A clean production build succeeds and the deployed URL passes the launch checklist.

## 4. Non-goals for v1

- Private repository access, GitHub login, OAuth, or personal access tokens.
- AI-generated architecture explanations, chatbot, semantic code search, or embeddings.
- Building or running cloned source code in the browser or on a server.
- Security scoring, vulnerability scanning, dependency audit, or trustworthiness ranking.
- Full source-code browsing, cross-file symbol indexing, commit analytics, or a full nested IDE-like explorer.
- User profiles, saved workspaces, teams, a database, payments, advertisements, or telemetry by default.
- Support for GitLab, Bitbucket, self-hosted GitHub Enterprise, or arbitrary URL hosts.

## 5. Target users and jobs-to-be-done

### Persona A — Open-source beginner

**Context:** Knows basic Git/GitHub, finds a project, but does not know the codebase yet.  
**Job:** “When I open an unfamiliar repository, help me understand the project and find a safe first step without reading every file first.”

### Persona B — Student / portfolio builder

**Context:** Evaluates sample projects, tools, or learning repositories.  
**Job:** “Help me identify the language, project shape, and documented setup path before I spend time cloning it.”

### Persona C — Working developer

**Context:** Quickly checks an unfamiliar dependency or community project.  
**Job:** “Give me the repository facts and relevant links in one place so I can decide where to inspect further.”

## 6. Product positioning

Repology is a **repository orientation guide**, not a substitute for reading the source. Its differentiator is a compact experience that connects metadata, file evidence, setup signals, and contribution paths. It should never label guesses as verified instructions.

### Core promise

“Paste a public GitHub repository. Get a clear first map, with evidence and next steps.”

## 7. Main user journey

1. The user lands on a simple page with a GitHub repository URL field, one primary action, a concise privacy note, and a sample repository link.
2. The user submits either `https://github.com/owner/repo`, a `.git`-suffixed URL, or `owner/repo` shorthand.
3. Repology validates and normalizes the input before making a request.
4. A progress indicator explains which parts are being loaded; the UI remains responsive.
5. The result page shows metadata, a file map, a README preview, setup signals, and contribution links.
6. The user copies a verified command or opens a relevant file on GitHub.
7. If some data is unavailable, Repology preserves other useful sections and explains the limitation.

## 8. Information architecture and UX

### Page A — Landing

- Brand: Repology wordmark / simple SVG or text mark.
- Headline: “Get oriented in any open-source repo.”
- Supporting line: “A clear first map of the code, setup signals, and contribution links.”
- URL input with a visible label; do not rely on placeholder text alone.
- Primary button: “Explore repository”.
- Example link, e.g. `vitejs/vite`, plus a note that only public GitHub repos work in v1.
- Privacy note: “Read-only. No sign-in. No code execution.”

### Page B — Results

**Header:** repository owner/name, description, GitHub link, back/change-repository action.  
**Metadata strip:** primary language, stars, default branch, license if available, open issue count.  
**Main sections:**

- **Overview:** evidence-based summary built from repository metadata, README excerpt, and detected root files. No generated claims.
- **Files:** root-level files/folders, icons by type, direct GitHub links; nested folder expansion is an enhancement only if the initial schedule allows.
- **Setup:** detected manifests and package manager signals; copy buttons for commands; each command is labelled **Detected**, **Suggested**, or **Not verified**.
- **Contribute:** links to issues, pull requests, `CONTRIBUTING.md`, and issue templates only when available or linkable.

On small screens use stacked sections or accessible tabs with clear labels; do not force a wide dashboard grid.

### Visual direction

Premium, calm developer-tool aesthetic. Use a restrained light/dark-neutral base, one distinct accent, generous spacing, crisp typography, clear hierarchy, and compact metadata pills. Avoid a generic AI-dashboard look, unnecessary gradients, oversized hero cards, and animations that slow down the main task. Respect `prefers-reduced-motion`.

Suggested starting tokens (adjust during implementation): deep ink `#101522`, warm paper `#F7F8FA`, accent indigo `#635BFF`, signal green `#B9F36B`, muted text `#697386`, border `#E3E7EF`. These are design suggestions, not mandated brand colors.

## 9. Functional requirements

Priority definitions: **P0** = required for launch; **P1** = include only if time allows without risking launch; **P2** = defer.

**FR-01 · P0 — Accept GitHub repository input**  
**Acceptance criteria:** Supports `owner/repo`, canonical repository URL, trailing slash, and `.git`; rejects unsupported hosts, missing owner/repo, and paths that do not identify a repository.

**FR-02 · P0 — Validate before requesting**  
**Acceptance criteria:** Invalid inputs cause no API request; normalized input is shown or used consistently.

**FR-03 · P0 — Fetch repository metadata**  
**Acceptance criteria:** Show name, owner, description when present, primary language when present, stars, default branch, license when present, and open-issue count. Hide absent fields rather than inventing values.

**FR-04 · P0 — Fetch top-level contents**  
**Acceptance criteria:** List root entries with safe names, type indicators, and links to their GitHub page. Empty/error states are clear.

**FR-05 · P0 — Fetch/preview README**  
**Acceptance criteria:** Show content safely; handle no README, empty README, unsupported encoding, and fetch failure without breaking other sections.

**FR-06 · P0 — Detect setup evidence**  
**Acceptance criteria:** Recognize common manifest/lockfile names and report what was detected. Commands must be derived from files or manifest scripts and labelled by confidence.

**FR-07 · P0 — Contribution entry points**  
**Acceptance criteria:** Link to repository issues and pull requests; link `CONTRIBUTING.md` if present in root. Avoid a separate issues API call unless required by an agreed design.

**FR-08 · P0 — Loading and error states**  
**Acceptance criteria:** Differentiate invalid input, missing/private repository, network error, rate limit, API failure, and partial data. Provide a retry action where appropriate.

**FR-09 · P0 — Copy actionable commands**  
**Acceptance criteria:** Copy controls provide keyboard access and visible success/failure feedback. Commands are displayed as text and never auto-executed.

**FR-10 · P0 — Responsive and accessible UI**  
**Acceptance criteria:** Semantic headings, labels, visible focus, adequate contrast, keyboard operation, accessible status announcements, usable at 360 px.

**FR-11 · P0 — Protect untrusted content**  
**Acceptance criteria:** README Markdown is sanitized before HTML rendering, or displayed as escaped text. All external links use safe link attributes.

**FR-12 · P0 — Handle API limits efficiently**  
**Acceptance criteria:** Avoid duplicate calls, use in-memory caching/deduplication, do not poll, and display rate-limit guidance from response status/headers.

**FR-13 · P1 — Expand a root folder**  
**Acceptance criteria:** On user click, fetch and show that folder's direct children; request only when opened.

**FR-14 · P1 — Manifest-aware npm scripts**  
**Acceptance criteria:** If `package.json` exists, parse it safely and show scripts that actually exist.

**FR-15 · P1 — README section navigation**  
**Acceptance criteria:** Provide quick links to common sections when reliably detected.

**FR-16 · P2 — Recent repositories**  
**Acceptance criteria:** Optional local-only history with an explicit clear control and privacy note.

**FR-17 · P2 — More Git hosts / private repos**  
**Acceptance criteria:** Requires a separate auth/security review and is out of MVP scope.
## 10. Setup-guidance rules

The product must communicate **evidence level**:

- **Detected:** the exact manifest/file/script was inspected and found.
- **Suggested:** a conventional command follows from a detected file, but has not been run or verified.
- **Not verified:** evidence is insufficient; direct the user to repository documentation instead.

Examples:

- `package.json` present: fetch and parse it on demand; show `npm run <script>` only for scripts found in its `scripts` object. Do not assume a `dev` or `start` script exists.
- `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, or `bun.lock*`: identify the matching package manager signal, but warn if more than one conflicting lockfile exists.
- `requirements.txt` present: show `python -m pip install -r requirements.txt` as suggested, with an explicit note that a virtual environment is recommended.
- `pyproject.toml` without a clear tool signal: show the manifest and tell the user to follow the repository README; do not invent package manager commands.
- `go.mod` present: offer Go-specific guidance as a suggestion and link to the README; never imply tests were executed.
- Unrecognized project: show “No verified setup command found” with detected files and README link.

Never execute, evaluate, or `eval()` repository content. Never infer that a repository is safe merely because it has a README or license.

## 11. Data and API requirements

- Use GitHub REST endpoints for public repository metadata, README content, and root contents.
- Fetch only the minimum required data. Load optional manifest details only when the Setup section is opened.
- Use in-memory cache for successful responses during the current page session and deduplicate concurrent requests.
- Do not persist repository contents to a database or send them to a third-party AI service.
- Treat all missing fields as nullable. Render an em dash or omit the field; never fabricate a value.
- Respect GitHub response and rate-limit headers. Unauthenticated requests have a documented primary rate limit of 60 requests per hour per originating IP; shared networks can hit that limit sooner.

## 12. Non-functional requirements

- **Performance:** keep the initial JavaScript bundle small; use lazy requests for optional sections; avoid repeated API calls.
- **Reliability:** a README failure must not prevent metadata or file listing from rendering.
- **Security:** no shell execution; no secrets in client code; sanitize Markdown; validate all URLs; handle API data as untrusted.
- **Accessibility:** WCAG-informed semantic structure, keyboard focus, contrast, reduced motion, and screen-reader status messages.
- **Maintainability:** clear modules for parsing, API calls, detection rules, and UI rendering; add tests for pure functions.
- **Privacy:** no sign-in, backend database, analytics, or tracking cookies in v1.
- **Portability:** static build deployable to Vercel or another static host.

## 13. Error-state copy

- Invalid URL: “Enter a GitHub repository URL or `owner/repo`, such as `vitejs/vite`.”
- Not found / private: “We couldn’t access this repository. Check the URL and make sure it is public.”
- Rate limit: “GitHub is limiting requests from this network right now. Wait for the limit to reset, or try again later.”
- README missing: “No README was found. The metadata and file map are still available.”
- Partial API failure: “Some repository details could not be loaded. The sections below show the data that was available.”
- Network issue: “Couldn’t reach GitHub. Check your connection and retry.”
- Empty contents: “No top-level files were returned.”

Avoid exposing raw stack traces or internal details to end users. A developer-only console message may include the request path and status but must not contain secrets.

## 14. MVP acceptance / Definition of Done

The MVP is launch-ready only when all are true:

1. A fresh checkout installs and builds with documented commands.
2. Landing, input validation, result view, metadata, root contents, README fallback, setup evidence, and contribution links work for supported public repos.
3. Known error cases are handled without a blank screen or unhandled promise rejection.
4. README and repository-provided strings cannot inject executable HTML or script.
5. No access token, API key, or other secret is included in built assets.
6. Mobile and keyboard checks pass.
7. At least 10 test scenarios in `QA_TEST_PLAN.md` are executed and outcomes documented.
8. The production deployment has been tested from a clean browser session.
9. The repository includes a clear README, license decision/file, contributing instructions, issue templates, and a launch note.
10. The public page clearly states it supports public GitHub repositories and does not run code.

## 15. Risks and mitigations

**GitHub unauthenticated rate limit**  
**Impact:** New users cannot analyze repos temporarily  
**Mitigation:** Minimize requests, cache/dedupe, lazy-load optional data, show helpful rate-limit state.

**README contains unsafe HTML or links**  
**Impact:** Cross-site scripting / phishing surface  
**Mitigation:** Sanitize rendered Markdown; otherwise render as text; treat links as untrusted.

**Setup command is wrong**  
**Impact:** User wastes time or runs unsafe code  
**Mitigation:** Derive from exact manifest evidence; distinguish detected vs suggested; never auto-run.

**Scope creep prevents launch**  
**Impact:** No usable public product by morning  
**Mitigation:** Lock P0 scope; cut nested explorer, history, analytics, AI, extra Git hosts first.

**API data shape varies**  
**Impact:** UI crashes on missing fields  
**Mitigation:** Validate response shape and guard every optional field.

**Exact name already used by another established project**  
**Impact:** High discoverability, confusion, and potential legal/brand risk  
**Mitigation:** Keep Repology as a working label only; resolve naming before public launch. Existing project references: https://repology.org/ and https://github.com/repology.

**One-night testing is shallow**  
**Impact:** Public users hit obvious bugs  
**Mitigation:** Use a varied smoke-test matrix; disclose MVP status and collect issues.
## 16. Release plan

**Brand gate:** The software MVP may be built under this working label, but public launch branding is blocked until the exact-name conflict described above is resolved.

- **Release 0.1:** static, read-only public GitHub repository orientation tool.
- **Post-launch v0.1.x:** bug fixes, clearer stack/setup detection, contributor feedback.
- **v0.2 candidates:** optional nested folder expansion, more manifest support, GitHub login only if the user need and security model justify it.
- **Do not commit to AI summaries or private repo support before validating demand.**

## 17. Open decisions before public announcement

- **Resolve the name conflict before public launch.** Repology is already used by a package-version tracker ([official site](https://repology.org/), [GitHub organization](https://github.com/repology)). Choose a distinct name or obtain qualified advice before public use.
- Confirm final maintainer identity and repository URL.
- Add the final chosen license file and copyright holder.
- Choose whether README previews use sanitized Markdown or escaped plain text; security and timeline take precedence over visual polish.
- Decide final deployment domain only after the deployment exists.

## 18. Reference links

- GitHub REST API — repository contents and README: https://docs.github.com/en/rest/repos/contents
- GitHub REST API — rate limits: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- Vercel — Vite deployment: https://vercel.com/docs/frameworks/frontend/vite
- GitHub repository basics: https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories
