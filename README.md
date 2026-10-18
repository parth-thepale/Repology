# Repology

**Understand the code. Find your way in.**

Repology is a free, open-source orientation tool for public GitHub repositories. Paste a repository URL and get a practical first map: what the project appears to use, which files matter, how to find trustworthy setup instructions, and where a first contribution might begin.

> **Status:** Implemented MVP (v0.1.0). The static Vite application is fully implemented, verified with unit and security tests, and ready for deployment.

## Why Repology?

Great open-source projects can be difficult to enter. A newcomer may have to piece together a README, root files, manifests, contribution rules, and issue links before knowing where to start. Repology brings those first steps into one guided view without pretending to understand code it has not inspected.

## MVP promise

For a **public GitHub repository**, Repology will:

- Validate and normalize a repository URL.
- Show repository metadata: description, primary language, default branch, license (when provided), stars, and open-issue count.
- Present the root-level files and directories as a navigable starting map.
- Safely preview the README and link back to the original file.
- Detect common project manifests and suggest setup steps only when backed by detected files or manifest data.
- Link to the repository's issues and contribution guide when available.
- Explain errors clearly, including private/missing repositories and GitHub API rate limits.

No account, database, paid AI API, backend token, or code execution is required for v1.

## Recommended stack

- Vite + vanilla JavaScript modules + CSS
- GitHub REST API for public repository metadata and contents
- `marked` + `DOMPurify` only if a rendered Markdown README preview is implemented; sanitize before inserting HTML
- Vercel for deployment (static build)
- Vitest for focused logic tests, if test setup fits the overnight window

Keep the first version static. Do not introduce a backend, authentication, an AI provider, a database, or a code-execution service in the MVP.

## Run locally (after implementation)

```bash
npm install
npm run dev
npm run build
npm run preview
```

The implementation should not require environment secrets. If a future authenticated GitHub integration is added, it must use a server-side token flow and be separately reviewed; never put a private token in `VITE_*` variables or browser code.

## Product documentation

- [Product Requirements Document](docs/PRD.md)
- [Architecture and API plan](docs/ARCHITECTURE.md)
- [Overnight execution plan](docs/EXECUTION_PLAN.md)
- [Implementation spec for a coding agent](docs/IMPLEMENTATION_SPEC.md)
- [QA and acceptance tests](docs/QA_TEST_PLAN.md)
- [Security and privacy](docs/SECURITY.md)
- [Launch checklist](docs/LAUNCH_CHECKLIST.md)
- [Decision log](docs/DECISIONS.md)
- [Brand/name review](docs/BRAND_NAME_REVIEW.md)
- [Contributing guide](CONTRIBUTING.md)

## Project principles

1. **Evidence over guesses.** Make a clear distinction between detected facts and suggestions.
2. **One useful result, quickly.** The first screen should help without forcing sign-up.
3. **Read-only by design.** Repology must never write to a user's repository or run repository code.
4. **Privacy by default.** No account, database, or analytics in the initial release.
5. **Graceful degradation.** A README may be missing; a manifest may be unusual; API calls may be rate-limited. Show what is available and explain what is not.
6. **Open source is a product feature.** Publish how the tool works, invite issues, and make contributions easy.

## Current limitations to disclose

- Only public GitHub repositories are supported in v1.
- A detected file is a signal, not proof that a project runs with a particular command.
- The free unauthenticated GitHub REST API has a per-IP rate limit. Repology must cache results in memory for the current session, avoid unnecessary requests, and show rate-limit guidance.
- Repository names and documentation may contain hostile or misleading content. All external content is untrusted input.

## License

The documentation pack proposes the MIT License for the project. Confirm the repository owner and final license before publishing; include the actual `LICENSE` file in the application repository.

## Name and brand status

**Repology is the user-selected working name in this documentation, not a cleared public brand.** An established open-source software package-version tracking service already operates at [repology.org](https://repology.vercel.app/) and under [github.com/repology](https://github.com/repology). This project has a different purpose, but the exact-name collision may confuse users and create discoverability or legal risk. Before public launch, choose a distinct name or obtain appropriate advice. Do not imply affiliation with the existing Repology service or GitHub.
