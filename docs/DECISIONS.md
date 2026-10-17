# Repology — Decision Log

## D-001: Static browser app for v1

**Decision:** Use Vite + vanilla JavaScript + CSS and call the public GitHub REST API from the browser.  
**Reason:** Fast to build and deploy, no server or database to maintain, minimal operational cost.  
**Trade-off:** Unauthenticated API rate limits are shared by originating IP and cannot be bypassed safely without a separate server-side design.

## D-002: No AI-generated summary in v1

**Decision:** Build overview from actual repository metadata, README content, file names, and manifests.  
**Reason:** Faster release, no paid API or secret, clear evidence trail, fewer hallucination/security concerns.  
**Trade-off:** The first version will not explain arbitrary source code semantically.

## D-003: Public repositories only

**Decision:** Do not support private repositories or GitHub login in the MVP.  
**Reason:** Avoid OAuth/token management and the larger security surface for an overnight release.  
**Trade-off:** Some users' repositories are unsupported; state this prominently.

## D-004: Evidence-labelled setup guidance

**Decision:** Distinguish detected files/scripts from suggested commands and unverified steps.  
**Reason:** Setup commands differ by repository; false confidence harms user trust.  
**Trade-off:** Some repositories will receive no command other than a README link.

## D-005: Do not execute repository code

**Decision:** Never install dependencies, run scripts, build, clone to a backend, or claim a command has been tested.  
**Reason:** Execution introduces significant security and infrastructure scope.  
**Trade-off:** Repology cannot prove the suggested command works.

## D-006: README safety is a release gate

**Decision:** Use sanitized Markdown rendering or escaped text.  
**Reason:** Repository README content is untrusted external input.  
**Trade-off:** Plain-text fallback is less visually rich but acceptable for v0.1.

## D-007: Repology is the selected working label, but naming conflict blocks public branding

**Decision:** Use “Repology” only as the working label requested for this documentation and development planning. Do not treat it as a cleared public brand.  
**Evidence:** An established package-version tracking service uses the same name and operates at https://repology.org/ with its source organization at https://github.com/repology.  
**Reason:** Keeping docs consistent is useful, but the exact name can cause user confusion, search/discovery problems, and potential legal/brand risk.  
**Required action before public launch:** Select a distinct name or obtain qualified brand/legal advice. Check GitHub namespace availability, relevant trademark registers, domain availability, and social/package namespaces. This note is not legal advice.
