/**
 * INDUSTRIAL MODERNIST CONTRIBUTE MATRIX
 * High-density vector nodes for issues, pull requests, contributing guidelines, and licensing.
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
    </div>
    <div class="panel-header-right">
      <span class="badge-tag">[EXTERNAL_GATEWAY]</span>
    </div>
  `;
  panel.appendChild(header);

  // Hairline Matrix Grid
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
  const contribFile = detection.contributingFile;

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
  const licenseName = metadata.license?.spdx_id || metadata.license?.name || null;
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

  panel.appendChild(grid);
  container.appendChild(panel);
}
