# Repology — Security and Privacy Notes

## Security position

Repology is a **read-only viewer for public GitHub data**. It must not run repository code, clone repositories to a server, install packages, execute setup commands, request private credentials, or write to a repository.

## Threat model

| Threat | Example | Control |
|---|---|---|
| Untrusted content injection | README contains hostile HTML, script, or event handlers | Sanitize Markdown output with DOMPurify or display as escaped text; do not insert raw HTML |
| Malicious URL input | Look-alike host or arbitrary URL targets an unrelated site | Accept only a validated GitHub URL or `owner/repo`; build API paths internally |
| Phishing / unsafe external link | README link points to misleading external site | Show that links are repository-provided; use safe link attributes; reject dangerous URL schemes |
| Command confusion | Tool implies it has verified a start command | Evidence labels; commands are never executed; only show scripts that exist in inspected manifest |
| Secret leakage | Personal token accidentally embedded in client bundle | No token in v1; inspect built assets before release; never use a `VITE_*` variable for a secret |
| API exhaustion | Many rapid requests trigger rate limits | In-memory cache, in-flight dedupe, lazy optional requests, no tight retry loops |
| Stale UI race | Earlier request overwrites a newer repository's results | Track request identity or cancel stale requests |
| Privacy surprise | Tool saves repositories or sends content to analytics/AI | No persistent storage, no account, no analytics, no AI API in v1 |

## Required implementation controls

1. **No execution:** repository files are data only. Do not use `eval`, `Function`, shell execution, dynamic imports from repository-provided URLs, or any installation/build step.
2. **Safe rendering:** prefer `textContent` and explicit DOM node construction. If rendering Markdown, sanitize the parser output with DOMPurify immediately before insertion. A parser alone is not a sanitizer.
3. **URL allowlist:** parse and validate `github.com` hostnames; reject hostname suffix tricks. Build API URLs from validated path segments. Allow only expected GitHub HTTPS links for repository resources.
4. **Safe external links:** where links open a new tab, use `rel="noopener noreferrer"`. Do not treat repository README links as trusted recommendations.
5. **API errors:** never show raw stack traces to public users. Do not send private data to logging services.
6. **No secrets:** the MVP has no API token. Confirm generated JS assets contain no credential-like values before deployment.
7. **No unnecessary persistence:** do not use localStorage for repo contents in v1. If optional history is added later, make it explicit and give users a clear option to delete it.
8. **Dependency hygiene:** keep dependencies minimal, review added packages, and avoid adding a backend merely to bypass rate limits without a security and cost plan.

## Privacy notice to show in app

Suggested copy:

> Repology reads public GitHub repository information to build this view. It does not sign you in, run repository code, or save an account or history in the MVP. Requests to GitHub are made from your browser and are subject to GitHub's rate limits. Repository-provided documentation and links are third-party content.

Only use this exact copy if implementation behavior matches it.

## Vulnerability reporting

Before publishing, add a real maintainer contact or GitHub Security Advisories link. Until one exists, direct users to a private reporting path supported by the repository host; do not invent a security email address. Do not ask reporters to post unpatched exploitable details in public issues.

## Pre-release review

- [ ] README HTML is safe.
- [ ] User input never becomes an arbitrary fetch target.
- [ ] No tokens or secrets in code, `.env`, build output, deployment settings, or screenshots.
- [ ] No arbitrary HTML injected from metadata or manifest fields.
- [ ] Copy-to-clipboard and external link behavior is safe.
- [ ] API failures do not cause an automatic retry loop.
- [ ] Privacy copy is accurate.
- [ ] A maintainer security-reporting path is documented.
