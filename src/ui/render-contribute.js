/**
 * INDUSTRIAL MODERNIST CONTRIBUTE MATRIX
 * High-density vector nodes for issues, pull requests, contributing guidelines,
 * repository readiness scorecard, and PR template generation.
 */

/**
 * @param {HTMLElement} container
 * @param {Object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {object} params.metadata
 * @param {import('../core/detect-project.js').DetectionResult} params.detection
 * @param {string} [params.defaultBranch='main']
 */
export function renderContribute(container, { owner, repo, metadata, detection, defaultBranch = 'main' }) {
  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'contribute-module-panel';

  // Panel Header Bar
  const header = document.createElement('div');
  header.className = 'panel-header-bar';
  header.innerHTML = `
    <div class="panel-header-left">
      <span class="panel-id-label">MODULE // 05_CONTRIBUTE_VECTORS</span>
      <span class="badge-tag">[COMMUNITY_INTERFACE]</span>
      <span class="badge-tag badge-tag-nominal">[CONTRIBUTOR_SCORECARD_READY]</span>
    </div>
    <div class="panel-header-right">
      <span class="badge-tag">[KEYBINDS_ACTIVE: 1-7]</span>
    </div>
  `;
  panel.appendChild(header);

  // 1. Contribution Hygiene & Readiness Scorecard
  const scorecard = document.createElement('div');
  scorecard.className = 'contribute-scorecard-grid';
  scorecard.style.display = 'grid';
  scorecard.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 1fr))';
  scorecard.style.gap = '1px';
  scorecard.style.backgroundColor = 'var(--border-default)';
  scorecard.style.borderBottom = '1px solid var(--border-default)';

  const contribFile = detection.contributingFile;
  const hasCi = detection.hasCi;
  const licenseName = metadata.license?.spdx_id || null;

  const checks = [
    { label: 'CONTRIBUTING_GUIDE', val: contribFile ? 'VERIFIED' : 'NOT_FOUND', ok: Boolean(contribFile) },
    { label: 'CI_AUTOMATION', val: hasCi ? 'ACTIVE_WORKFLOWS' : 'NOT_CONFIGURED', ok: Boolean(hasCi) },
    { label: 'SPDX_LICENSE', val: licenseName || 'UNSPECIFIED', ok: Boolean(licenseName) },
    { label: 'OPEN_ISSUES', val: metadata.open_issues_count ? `${metadata.open_issues_count} TICKETS` : '0 TICKETS', ok: true },
  ];

  checks.forEach((chk) => {
    const card = document.createElement('div');
    card.style.backgroundColor = 'var(--bg-surface-1)';
    card.style.padding = '0.75rem 1rem';
    card.style.fontFamily = 'var(--font-mono)';
    card.innerHTML = `
      <span style="font-size: 10px; color: var(--text-muted); display: block; letter-spacing: 0.06em;">${chk.label}</span>
      <span style="font-size: 12px; font-weight: 700; color: ${chk.ok ? '#10B981' : '#F59E0B'}; margin-top: 0.2rem; display: block;">
        ${chk.val}
      </span>
    `;
    scorecard.appendChild(card);
  });
  panel.appendChild(scorecard);

  // 2. Hairline Matrix Grid for Gateway Nodes
  const grid = document.createElement('div');
  grid.className = 'contribute-matrix-grid';

  const ghBase = `https://github.com/${owner}/${repo}`;
  const openIssuesCount = typeof metadata.open_issues_count === 'number' ? metadata.open_issues_count : null;

  // 1. Issues Node
  const issuesNode = document.createElement('div');
  issuesNode.className = 'contribute-node';
  issuesNode.innerHTML = `
    <div>
      <div class="node-header">
        <span class="node-title">01 // ISSUE_TRACKER</span>
        ${openIssuesCount !== null ? `<span class="badge-tag">[OPEN: ${openIssuesCount}]</span>` : ''}
      </div>
      <p class="node-desc">
        Inspect live bug reports, proposed feature requests, or filter by beginner-friendly entry labels.
      </p>
    </div>
    <div class="node-actions">
      <a href="${ghBase}/issues" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">
        ALL_ISSUES ↗
      </a>
      <a href="${ghBase}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
        GOOD_FIRST_ISSUE ↗
      </a>
    </div>
  `;
  grid.appendChild(issuesNode);

  // 2. Pull Requests Node
  const prNode = document.createElement('div');
  prNode.className = 'contribute-node';
  prNode.innerHTML = `
    <div>
      <div class="node-header">
        <span class="node-title">02 // PULL_REQUESTS</span>
        <span class="badge-tag">[ACTIVE_REVIEWS]</span>
      </div>
      <p class="node-desc">
        Examine open contributor pull requests, recent branch merges, and review discussions.
      </p>
    </div>
    <div class="node-actions">
      <a href="${ghBase}/pulls" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
        OPEN_PRS ↗
      </a>
    </div>
  `;
  grid.appendChild(prNode);

  // 3. Contributing Guidelines Node
  const contribNode = document.createElement('div');
  contribNode.className = 'contribute-node';

  contribNode.innerHTML = `
    <div>
      <div class="node-header">
        <span class="node-title">03 // CONTRIBUTING_GUIDE</span>
        <span class="badge-tag ${contribFile ? 'badge-tag-nominal' : ''}">${contribFile ? `[FOUND: ${contribFile}]` : '[NOT_DETECTED]'}</span>
      </div>
      <p class="node-desc">
        ${contribFile
          ? `Repository provides explicit guidelines in ${contribFile} for branch naming, linting, and tests.`
          : 'No standalone CONTRIBUTING file detected in root. Review the README for contribution guidelines.'}
      </p>
    </div>
    <div class="node-actions">
      ${contribFile ? `
        <a href="${ghBase}/blob/${defaultBranch}/${contribFile}" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">
          VIEW_${contribFile.toUpperCase()} ↗
        </a>
      ` : `
        <a href="${ghBase}#readme" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
          CHECK_README ↗
        </a>
      `}
    </div>
  `;
  grid.appendChild(contribNode);

  // 4. License & Compliance Node
  const licenseNode = document.createElement('div');
  licenseNode.className = 'contribute-node';
  const licenseFile = detection.licenseFile;

  licenseNode.innerHTML = `
    <div>
      <div class="node-header">
        <span class="node-title">04 // COMPLIANCE_LICENSE</span>
        <span class="badge-tag ${licenseName ? 'badge-tag-info' : ''}">[${licenseName || 'NO_SPDX'}]</span>
      </div>
      <p class="node-desc">
        ${licenseName ? `Governed under ${licenseName}. Check usage and redistribution terms before cloning.` : 'No standard SPDX license reported in GitHub metadata.'}
      </p>
    </div>
    <div class="node-actions">
      ${licenseFile ? `
        <a href="${ghBase}/blob/${defaultBranch}/${licenseFile}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
          VIEW_${licenseFile.toUpperCase()} ↗
        </a>
      ` : `
        <a href="${ghBase}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
          GH_SOURCE ↗
        </a>
      `}
    </div>
  `;
  grid.appendChild(licenseNode);

  // 5. PR Checklist Generator Card
  const checklistCard = document.createElement('div');
  checklistCard.className = 'contribute-node';
  checklistCard.style.gridColumn = '1 / -1';
  checklistCard.innerHTML = `
    <div>
      <div class="node-header">
        <span class="node-title">05 // PULL_REQUEST_STANDARDS_CHECKLIST</span>
        <span class="badge-tag badge-tag-nominal">CONVENTIONAL_COMMITS</span>
      </div>
      <p class="node-desc">
        Standard boilerplate checklist ready for PR submissions to <code>${owner}/${repo}</code>.
      </p>
    </div>
    <div class="node-actions">
      <button type="button" class="btn btn-primary btn-sm" id="btn-copy-pr-template">
        [COPY_PR_CHECKLIST]
      </button>
    </div>
  `;

  const copyPrBtn = checklistCard.querySelector('#btn-copy-pr-template');
  copyPrBtn?.addEventListener('click', async () => {
    const template = `## Proposed Changes
- [ ] Clear summary of modifications for ${owner}/${repo}

## Verification
- [ ] Ran automated tests and verified all checks pass
- [ ] Confirmed zero breaking changes or noted upgrade path
- [ ] Verified branch follows ${contribFile || 'project'} conventions

## Related Issues
Closes #`;

    try {
      await navigator.clipboard.writeText(template);
      copyPrBtn.textContent = '[CHECKLIST_COPIED ✓]';
      setTimeout(() => {
        copyPrBtn.textContent = '[COPY_PR_CHECKLIST]';
      }, 2000);
    } catch {
      copyPrBtn.textContent = '[COPY_FAILED]';
    }
  });

  grid.appendChild(checklistCard);
  panel.appendChild(grid);
  container.appendChild(panel);
}
