# Contributing to Repology

Thanks for helping make open-source projects easier to enter. Repology values small, evidence-backed improvements over large speculative features.

## Before opening an issue

- Search existing issues for the same problem.
- For bugs, include the repository URL used, browser, steps to reproduce, expected result, and actual result.
- Redact tokens, private URLs, personal data, and browser console data that may contain sensitive information.
- Do not paste exploit details in a public issue; use the maintainer's documented private reporting path when available.

## Development setup

```bash
npm install
npm run dev
npm run build
```

Run the available test command if one is present. If a test harness is not yet configured, note the manual steps used to validate your change.

## Contribution guidelines

- Keep v1 read-only and public-repository-only unless a proposal includes a separate security review.
- Never add a feature that runs repository code or automatically executes setup commands.
- Make source-backed claims. Distinguish detected facts from suggestions.
- Handle absent GitHub fields and API failures gracefully.
- Keep URL parsing and project detection logic testable.
- Sanitize rendered README Markdown; never insert raw repository content as HTML.
- Keep dependencies small and explain why a new dependency is needed.
- Prefer focused pull requests that solve one problem.
- Update docs when behavior, commands, dependencies, or limitations change.

## Pull request checklist

- [ ] Change solves a clearly described problem.
- [ ] No secret or token added.
- [ ] `npm run build` succeeds.
- [ ] Tests or manual checks are described.
- [ ] README / relevant docs are updated.
- [ ] Error and empty states remain usable.
- [ ] No unsafe execution or unsanitized HTML path introduced.

## Design principles

1. Evidence over guesses.
2. Privacy by default.
3. Read-only by design.
4. Small, accessible, resilient UI.
5. No feature is worth making the first-run experience less trustworthy.
