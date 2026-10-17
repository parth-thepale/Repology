# Repology — Launch Checklist

## Before implementation freeze

- [ ] Confirm the exact product name is still a working name until a brand/domain/trademark check is complete.
- [ ] Create a public GitHub repository under the intended maintainer account.
- [ ] Confirm the repository description and README explain the project in one sentence.
- [ ] Keep P0 scope fixed; move enhancements to issues.

## Code quality

- [ ] Fresh install succeeds with `npm install`.
- [ ] `npm run build` succeeds.
- [ ] URL parser and detection logic have tests or documented manual coverage.
- [ ] No mock data appears in production results.
- [ ] All P0 error states work.
- [ ] No setup command is auto-executed.
- [ ] README Markdown is sanitized or shown as escaped text.
- [ ] No token, secret, database, or unnecessary analytics is included.

## UX and accessibility

- [ ] 360 px mobile, tablet, and desktop views checked.
- [ ] No horizontal overflow or overlapping elements.
- [ ] Visible labels and focus states are present.
- [ ] Loading, no-README, no-manifest, not-found, rate-limit, and network states are clear.
- [ ] Copy buttons confirm success/failure.
- [ ] Motion respects reduced-motion preferences.

## Open-source readiness

- [ ] Choose and add the final license. MIT is the suggested default, not a substitute for confirming ownership/intent.
- [ ] README has install/use/limitations and accurate screenshots.
- [ ] Add CONTRIBUTING guide, bug/feature issue templates, and pull request template.
- [ ] Add a short Code of Conduct only if the maintainer is ready to enforce it; link to the selected standard.
- [ ] Confirm source links, maintainer links, and deployment URL are real.
- [ ] Add initial `0.1.0` release notes and known limitations.

## Deployment

- [ ] Vercel project points to the correct repository/branch.
- [ ] Build command and output directory are correct for Vite.
- [ ] No environment secret is required for v1.
- [ ] Open deployed site in a private session.
- [ ] Test a valid JS/TS repo and another language.
- [ ] Test invalid input and a repository error path.
- [ ] Verify refresh/deep links do not produce an unexpected 404.
- [ ] Save the deployment URL and a rollback reference.

## Launch post content checklist

The launch announcement should say:

- The user problem in one sentence.
- What Repology does today (only features actually shipped).
- A link to the live tool and repository.
- That v0.1 supports public GitHub repositories only.
- That commands are guidance and the tool does not run source code.
- One clear ask: try a repository and open an issue for a reproducible bug or helpful feature idea.

Avoid claiming “supports every repo”, “fully accurate setup”, or guaranteed speed. Be direct that this is an early MVP.

## Final go/no-go

**GO** if the deployed core workflow works, important error states are safe and clear, no critical security issue is known, and repository documentation matches reality.

**NO-GO** if raw README HTML can execute, the app can fetch arbitrary submitted hosts, secrets are shipped, the primary flow is broken, or deployment status has not been verified.
