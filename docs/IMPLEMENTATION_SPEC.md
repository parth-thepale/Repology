# Repology — Implementation Spec for a Coding Agent

Use this as the source-of-truth build brief for an IDE coding agent. Implement the product in the current workspace rather than returning only mockups or a plan.

## Product objective

Build a polished, responsive, open-source web app that helps people orient themselves in a **public GitHub repository**. The app accepts a URL, fetches real GitHub REST API data, and displays repository metadata, root-level files, a safe README preview, setup evidence, and contribution links.

## Hard constraints

- Stack: Vite + vanilla JavaScript ES modules + CSS. Do not use React, Next.js, TypeScript, a backend, or a database in v1.
- No paid APIs and no AI-generated output. No GitHub tokens or secrets in browser code.
- Public repositories only; read-only; never clone, install, build, evaluate, or execute repository code.
- Do not fill results with fake/mock data. A sample repository may be prefilled in the input, but results must come from GitHub.
- Build and test incrementally. Run `npm run build` after major slices and fix issues before continuing.
- Keep P0 scope from `PRD.md`. If time runs short, cut nested folder expansion and visual extras before core reliability/security.
- The working product name is Repology, but keep name references centralized/easy to change.

## Product feel

Make the experience feel like a small premium developer utility, not a generic admin dashboard. Use a restrained neutral base, one strong accent, clear typography, confident spacing, compact repository metadata, and excellent empty/loading/error states. One obvious primary action. Responsive from 360 px up. Avoid gratuitous animation; respect reduced-motion.

## Required screens and behavior

### Landing
- Show product name, tagline “Understand the code. Find your way in.”, concise value proposition, labelled input and “Explore repository” button.
- Accept `owner/repo`, canonical `https://github.com/owner/repo`, trailing slash, and `.git` suffix.
- Show the public-only and read-only constraints clearly.
- Enter submits; button has disabled/loading states; input errors are inline and accessible.

### Results
- Repository name/owner, description, primary language, stars, default branch, license if present, and open issue count.
- Link back to GitHub canonical repository.
- Root-level directory/file map with safe links.
- README preview, sanitized with DOMPurify if rendered Markdown is used; otherwise show escaped plain text. Never insert raw README HTML.
- Setup panel that shows detected manifests/lockfiles and labels command guidance as Detected, Suggested, or Not verified. If `package.json` exists, inspect its scripts before showing `npm run ...` commands; do not assume script names.
- Contribution links: issues, pull requests, and `CONTRIBUTING.md` where present.
- Copy buttons use `navigator.clipboard` when available and show a visible success/failure message.

### Error and partial-data states
- Invalid URL, not found/private repository, network error, GitHub rate limit (403/429), missing README, missing manifest, and partial API failure.
- Never render a blank screen for optional API failure.
- Rate-limit state should inspect response headers when available and tell users not to keep hammering retry.

## API strategy

Use only documented public REST endpoints:

- `GET https://api.github.com/repos/{owner}/{repo}`
- `GET https://api.github.com/repos/{owner}/{repo}/readme`
- `GET https://api.github.com/repos/{owner}/{repo}/contents?ref={default_branch}`
- Optional on-demand `GET .../contents/{manifest-path}?ref={default_branch}`

Validate repository path segments first. Build API URLs from trusted endpoint templates, not an arbitrary user-supplied URL. Avoid GitHub search endpoints. Make requests only as needed; use session-memory cache and in-flight request deduplication.

## Suggested modules

- `src/core/parse-repo-url.js`
- `src/core/detect-project.js`
- `src/core/setup-guides.js`
- `src/services/github-api.js`
- `src/services/repository-service.js`
- `src/ui/*` for rendering sections/states
- `src/main.js` for app wiring

A simpler file structure is acceptable, but pure parsing/detection logic must not be entangled with large DOM event handlers.

## Technical implementation requirements

- Validate every response shape and handle nullable fields.
- Render untrusted strings through `textContent`/safe DOM APIs. If using `marked`, always sanitize with DOMPurify before insertion.
- External links use HTTPS and `rel="noopener noreferrer"` if opened in a new tab.
- Use semantic HTML, label form fields, visible focus rings, live-region status messages, keyboard navigation, and reduced-motion media query.
- Do not commit a token or add `.env` to the project unless a later, explicitly approved server-side feature requires it.
- No analytics or tracking cookies for the MVP.

## Required scripts

At minimum, ensure `package.json` supports:

```bash
npm run dev
npm run build
npm run preview
```

Add tests for the URL parser, manifest detector, setup command confidence labels, and API error normalization when feasible. If automated tests are omitted to protect the launch deadline, document the manual test results and add a test backlog issue.

## Required documentation

Keep `README.md`, `CONTRIBUTING.md`, `LICENSE`, and the files in `docs/` synchronized with implemented behavior. Do not state features are supported before they work. Before launch, replace placeholder repo/live links with the actual URLs and verify the chosen license.

## Execution instructions

1. Inspect the existing workspace and preserve unrelated files.
2. Initialize the Vite app only if one does not already exist.
3. Implement a thin end-to-end path: valid URL → real metadata → visible result.
4. Implement root contents, README, setup evidence, and contribution links.
5. Implement rate-limit/partial failure states and security handling.
6. Make the UI visually cohesive and responsive.
7. Run build and tests; fix errors instead of merely reporting them.
8. Provide a concise completion report listing files, tests run, build status, deployment status, and known limitations. Do not claim deployment if it did not happen.
