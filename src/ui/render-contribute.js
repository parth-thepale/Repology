/**
 * Contribution panel component:
 * - Direct links to GitHub issues, pull requests, and discussions
 * - Direct link to CONTRIBUTING.md or LICENSE when detected
 * - Friendly beginner tips for safe first-time contributions
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
  panel.className = 'panel-card contribute-panel-card';

  // Header
  const header = document.createElement('div');
  header.className = 'panel-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'panel-title-group';

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Contribution & Community Entry Points';

  titleGroup.appendChild(title);
  header.appendChild(titleGroup);
  panel.appendChild(header);

  // Cards grid
  const grid = document.createElement('div');
  grid.className = 'contribute-grid';

  const ghBase = `https://github.com/${owner}/${repo}`;
  const openIssuesCount = typeof metadata.open_issues_count === 'number' ? metadata.open_issues_count : null;

  // 1. Issues Card
  const issuesCard = document.createElement('div');
  issuesCard.className = 'contribute-card';
  issuesCard.innerHTML = `
    <div class="contribute-card-header">
      <span class="contribute-icon">🐛</span>
      <h4 class="contribute-card-title">Issues</h4>
      ${openIssuesCount !== null ? `<span class="pill pill-neutral">${openIssuesCount} open</span>` : ''}
    </div>
    <p class="contribute-card-desc">
      Inspect existing bug reports, feature requests, or search for tasks tagged with beginner-friendly labels.
    </p>
    <div class="contribute-card-actions">
      <a href="${ghBase}/issues" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">
        Open Issues ↗
      </a>
      <a href="${ghBase}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
        "good first issue" ↗
      </a>
    </div>
  `;
  grid.appendChild(issuesCard);

  // 2. Pull Requests Card
  const prCard = document.createElement('div');
  prCard.className = 'contribute-card';
  prCard.innerHTML = `
    <div class="contribute-card-header">
      <span class="contribute-icon">🔀</span>
      <h4 class="contribute-card-title">Pull Requests</h4>
    </div>
    <p class="contribute-card-desc">
      See ongoing code contributions, review discussions, and recent collaborator activity.
    </p>
    <div class="contribute-card-actions">
      <a href="${ghBase}/pulls" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
        Open Pull Requests ↗
      </a>
    </div>
  `;
  grid.appendChild(prCard);

  // 3. Contributing Guidelines Card
  const contribCard = document.createElement('div');
  contribCard.className = 'contribute-card';
  const contribFile = detection.contributingFile;

  if (contribFile) {
    contribCard.innerHTML = `
      <div class="contribute-card-header">
        <span class="contribute-icon">📋</span>
        <h4 class="contribute-card-title">Contribution Guide</h4>
        <span class="pill pill-success">Detected in root</span>
      </div>
      <p class="contribute-card-desc">
        The repository provides a dedicated <code>${contribFile}</code> with guidelines on code style, branch naming, and PR checklists.
      </p>
      <div class="contribute-card-actions">
        <a href="${ghBase}/blob/${defaultBranch}/${contribFile}" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">
          Read ${contribFile} ↗
        </a>
      </div>
    `;
  } else {
    contribCard.innerHTML = `
      <div class="contribute-card-header">
        <span class="contribute-icon">📋</span>
        <h4 class="contribute-card-title">Contribution Guide</h4>
        <span class="pill pill-neutral">Not detected in root</span>
      </div>
      <p class="contribute-card-desc">
        No dedicated CONTRIBUTING file was found in the root directory. Check the README or docs directory for contribution steps.
      </p>
      <div class="contribute-card-actions">
        <a href="${ghBase}#readme" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
          Check README ↗
        </a>
      </div>
    `;
  }
  grid.appendChild(contribCard);

  // 4. License Card
  const licenseCard = document.createElement('div');
  licenseCard.className = 'contribute-card';
  const licenseName = metadata.license && metadata.license.spdx_id ? metadata.license.spdx_id : metadata.license?.name;
  const licenseFile = detection.licenseFile;

  licenseCard.innerHTML = `
    <div class="contribute-card-header">
      <span class="contribute-icon">⚖️</span>
      <h4 class="contribute-card-title">License</h4>
      <span class="pill ${licenseName ? 'pill-accent' : 'pill-neutral'}">${licenseName || 'No SPDX license detected'}</span>
    </div>
    <p class="contribute-card-desc">
      ${licenseName ? `Licensed under ${licenseName}. Check permissions and restrictions before copying or distributing code.` : 'No standard license declared in metadata. Inspect repository root directly.'}
    </p>
    <div class="contribute-card-actions">
      ${licenseFile ? `
        <a href="${ghBase}/blob/${defaultBranch}/${licenseFile}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
          View ${licenseFile} ↗
        </a>
      ` : `
        <a href="${ghBase}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
          View Repository ↗
        </a>
      `}
    </div>
  `;
  grid.appendChild(licenseCard);

  panel.appendChild(grid);
  container.appendChild(panel);
}
