/**
 * Results view orchestrator:
 * - Repository header with canonical link, change repository action
 * - Compact metadata strip (stars, forks, issues, language, license, branch, updated)
 * - Accessible tab navigation across Overview, Files, Setup, README, and Contribute
 * - Responsive stacked fallback for mobile
 */

import { formatCompactNumber, formatNullable, formatDate } from '../core/formatters.js';
import { renderFiles } from './render-files.js';
import { renderReadme } from './render-readme.js';
import { renderSetup } from './render-setup.js';
import { renderContribute } from './render-contribute.js';
import { renderPartialAlert } from './render-states.js';

/**
 * @param {HTMLElement} container
 * @param {Object} params
 * @param {Object} params.data - Output from analyzeRepository
 * @param {() => void} params.onChangeRepo
 */
export function renderResults(container, { data, onChangeRepo }) {
  container.innerHTML = '';

  const {
    owner,
    repo,
    metadata,
    defaultBranch,
    contents,
    contentsError,
    readmeText,
    readmeError,
    detection,
    setupGuides,
    isPartial,
  } = data;

  const resultsWrapper = document.createElement('div');
  resultsWrapper.className = 'results-wrapper';

  // 1. Partial Failure Alert Banner (if non-critical part failed)
  if (isPartial) {
    const errorDetails = [];
    if (readmeError) errorDetails.push('README preview');
    if (contentsError) errorDetails.push('File directory listing');
    renderPartialAlert(
      resultsWrapper,
      `Some repository details could not be loaded (${errorDetails.join(
        ', '
      )}). The sections below show the data that was available.`
    );
  }

  // 2. Repository Header
  const headerCard = document.createElement('div');
  headerCard.className = 'repo-header-card';

  const topRow = document.createElement('div');
  topRow.className = 'repo-header-top-row';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'repo-title-group';

  const breadcrumbs = document.createElement('div');
  breadcrumbs.className = 'repo-breadcrumbs';
  breadcrumbs.innerHTML = `
    <span class="repo-owner">${metadata.owner?.login || owner}</span>
    <span class="repo-divider">/</span>
    <h2 class="repo-name">${metadata.name || repo}</h2>
    <span class="pill pill-neutral pill-sm">Public</span>
    ${metadata.archived ? '<span class="pill pill-warning pill-sm">Archived</span>' : ''}
    ${metadata.fork ? '<span class="pill pill-neutral pill-sm">Fork</span>' : ''}
  `;
  titleGroup.appendChild(breadcrumbs);

  if (metadata.description) {
    const desc = document.createElement('p');
    desc.className = 'repo-description';
    desc.textContent = metadata.description;
    titleGroup.appendChild(desc);
  }

  topRow.appendChild(titleGroup);

  const headerActions = document.createElement('div');
  headerActions.className = 'repo-header-actions';

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'btn btn-secondary btn-sm';
  changeBtn.textContent = '← Change Repository';
  changeBtn.addEventListener('click', onChangeRepo);

  const ghLink = document.createElement('a');
  ghLink.className = 'btn btn-primary btn-sm';
  ghLink.href = metadata.html_url || `https://github.com/${owner}/${repo}`;
  ghLink.target = '_blank';
  ghLink.rel = 'noopener noreferrer';
  ghLink.textContent = 'View on GitHub ↗';

  headerActions.appendChild(changeBtn);
  headerActions.appendChild(ghLink);
  topRow.appendChild(headerActions);
  headerCard.appendChild(topRow);

  // 3. Compact Metadata Strip
  const metaStrip = document.createElement('div');
  metaStrip.className = 'meta-strip';

  const lang = metadata.language;
  const stars = formatCompactNumber(metadata.stargazers_count);
  const forks = formatCompactNumber(metadata.forks_count);
  const issues = formatCompactNumber(metadata.open_issues_count);
  const licenseName = metadata.license?.spdx_id || metadata.license?.name || null;
  const lastUpdated = formatDate(metadata.pushed_at || metadata.updated_at);

  metaStrip.innerHTML = `
    ${lang ? `<div class="meta-item"><span class="meta-icon">💻</span> <span class="meta-value font-medium">${lang}</span></div>` : ''}
    <div class="meta-item"><span class="meta-icon">⭐</span> <span class="meta-value">${stars}</span> <span class="meta-label">stars</span></div>
    <div class="meta-item"><span class="meta-icon">🍴</span> <span class="meta-value">${forks}</span> <span class="meta-label">forks</span></div>
    <div class="meta-item"><span class="meta-icon">🐛</span> <span class="meta-value">${issues}</span> <span class="meta-label">issues</span></div>
    <div class="meta-item"><span class="meta-icon">🌿</span> <span class="meta-value"><code>${defaultBranch}</code></span></div>
    <div class="meta-item"><span class="meta-icon">⚖️</span> <span class="meta-value">${formatNullable(licenseName)}</span></div>
    <div class="meta-item"><span class="meta-icon">🕒</span> <span class="meta-label">Updated:</span> <span class="meta-value">${lastUpdated}</span></div>
  `;
  headerCard.appendChild(metaStrip);
  resultsWrapper.appendChild(headerCard);

  // 4. Tab Navigation and Content Panels
  const tabsNav = document.createElement('div');
  tabsNav.className = 'results-tabs-nav';
  tabsNav.setAttribute('role', 'tablist');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'files', label: `Files (${contents.length})`, icon: '📁' },
    { id: 'setup', label: `Setup (${setupGuides.length})`, icon: '⚡' },
    { id: 'readme', label: 'README', icon: '📖' },
    { id: 'contribute', label: 'Contribute', icon: '🤝' },
  ];

  const panels = {};

  tabs.forEach((tab, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'tab';
    btn.id = `tab-${tab.id}`;
    btn.className = `tab-btn ${index === 0 ? 'tab-btn-active' : ''}`;
    btn.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    btn.setAttribute('aria-controls', `panel-${tab.id}`);
    btn.innerHTML = `<span class="tab-icon" aria-hidden="true">${tab.icon}</span> ${tab.label}`;

    btn.addEventListener('click', () => {
      // Activate this tab
      tabsNav.querySelectorAll('.tab-btn').forEach((b) => {
        b.classList.remove('tab-btn-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('tab-btn-active');
      btn.setAttribute('aria-selected', 'true');

      // Toggle panels
      Object.keys(panels).forEach((pId) => {
        panels[pId].style.display = pId === tab.id ? 'block' : 'none';
      });
    });

    tabsNav.appendChild(btn);
  });

  resultsWrapper.appendChild(tabsNav);

  // 5. Container for tab panels
  const tabContentContainer = document.createElement('div');
  tabContentContainer.className = 'results-tab-content';

  // --- Panel 1: Overview Panel ---
  const overviewPanel = document.createElement('div');
  overviewPanel.id = 'panel-overview';
  overviewPanel.role = 'tabpanel';
  overviewPanel.setAttribute('aria-labelledby', 'tab-overview');
  overviewPanel.className = 'tab-panel';
  overviewPanel.style.display = 'block';

  // Build Overview content: Evidence summary, detected ecosystems, quick highlights
  const overviewGrid = document.createElement('div');
  overviewGrid.className = 'overview-grid';

  // Card A: Evidence summary
  const summaryCard = document.createElement('div');
  summaryCard.className = 'panel-card overview-card';
  summaryCard.innerHTML = `
    <div class="panel-header">
      <h3 class="section-title">Repository Facts</h3>
    </div>
    <div class="facts-list">
      <div class="fact-row">
        <span class="fact-label">Primary Language:</span>
        <span class="fact-value">${formatNullable(metadata.language)} (reported by GitHub)</span>
      </div>
      <div class="fact-row">
        <span class="fact-label">Detected Ecosystems:</span>
        <span class="fact-value">${detection.ecosystems.length > 0 ? detection.ecosystems.join(', ') : 'None recognized'}</span>
      </div>
      <div class="fact-row">
        <span class="fact-label">Detected Manifests:</span>
        <span class="fact-value">${detection.manifests.length > 0 ? detection.manifests.map((m) => `<code>${m}</code>`).join(' ') : 'None recognized'}</span>
      </div>
      <div class="fact-row">
        <span class="fact-label">Package Manager Signal:</span>
        <span class="fact-value">${detection.packageManager || (detection.hasConflictingLockfiles ? 'Conflicting lockfiles' : 'None detected')}</span>
      </div>
      <div class="fact-row">
        <span class="fact-label">Default Branch:</span>
        <span class="fact-value"><code>${defaultBranch}</code></span>
      </div>
      <div class="fact-row">
        <span class="fact-label">License:</span>
        <span class="fact-value">${formatNullable(licenseName)}</span>
      </div>
      <div class="fact-row">
        <span class="fact-label">Has CI / Actions:</span>
        <span class="fact-value">${detection.hasCi ? 'Yes (.github/workflows detected)' : 'No'}</span>
      </div>
      <div class="fact-row">
        <span class="fact-label">Has Docker:</span>
        <span class="fact-value">${detection.hasDocker ? 'Yes (Dockerfile/Compose present)' : 'No'}</span>
      </div>
    </div>
  `;
  overviewGrid.appendChild(summaryCard);

  // Card B: Quick Orientation Shortcuts
  const shortcutsCard = document.createElement('div');
  shortcutsCard.className = 'panel-card overview-card';
  shortcutsCard.innerHTML = `
    <div class="panel-header">
      <h3 class="section-title">Orientation Roadmap</h3>
    </div>
    <p class="overview-desc">
      Jump directly to the area of the repository you want to inspect:
    </p>
    <div class="shortcuts-list">
      <button type="button" class="shortcut-item" id="shortcut-to-setup">
        <span class="shortcut-icon">⚡</span>
        <div class="shortcut-text">
          <strong>Setup Guidance (${setupGuides.length} signals)</strong>
          <span>Inspect commands derived from package manifests.</span>
        </div>
        <span class="shortcut-arrow">→</span>
      </button>
      <button type="button" class="shortcut-item" id="shortcut-to-files">
        <span class="shortcut-icon">📁</span>
        <div class="shortcut-text">
          <strong>Explore Root Files (${contents.length} entries)</strong>
          <span>Examine project layout and browse nested folders.</span>
        </div>
        <span class="shortcut-arrow">→</span>
      </button>
      <button type="button" class="shortcut-item" id="shortcut-to-readme">
        <span class="shortcut-icon">📖</span>
        <div class="shortcut-text">
          <strong>Read Sanitized README</strong>
          <span>View documentation safely in rendered or raw view.</span>
        </div>
        <span class="shortcut-arrow">→</span>
      </button>
      <button type="button" class="shortcut-item" id="shortcut-to-contribute">
        <span class="shortcut-icon">🤝</span>
        <div class="shortcut-text">
          <strong>Contribution Entry Points</strong>
          <span>Find open issues, beginner tasks, and guidelines.</span>
        </div>
        <span class="shortcut-arrow">→</span>
      </button>
    </div>
  `;
  overviewGrid.appendChild(shortcutsCard);

  overviewPanel.appendChild(overviewGrid);
  tabContentContainer.appendChild(overviewPanel);
  panels['overview'] = overviewPanel;

  // Shortcuts event wiring
  setTimeout(() => {
    shortcutsCard.querySelector('#shortcut-to-setup')?.addEventListener('click', () => {
      document.getElementById('tab-setup')?.click();
    });
    shortcutsCard.querySelector('#shortcut-to-files')?.addEventListener('click', () => {
      document.getElementById('tab-files')?.click();
    });
    shortcutsCard.querySelector('#shortcut-to-readme')?.addEventListener('click', () => {
      document.getElementById('tab-readme')?.click();
    });
    shortcutsCard.querySelector('#shortcut-to-contribute')?.addEventListener('click', () => {
      document.getElementById('tab-contribute')?.click();
    });
  }, 0);

  // --- Panel 2: Files Panel ---
  const filesPanel = document.createElement('div');
  filesPanel.id = 'panel-files';
  filesPanel.role = 'tabpanel';
  filesPanel.setAttribute('aria-labelledby', 'tab-files');
  filesPanel.className = 'tab-panel';
  filesPanel.style.display = 'none';
  renderFiles(filesPanel, {
    entries: contents,
    owner,
    repo,
    defaultBranch,
    error: contentsError,
  });
  tabContentContainer.appendChild(filesPanel);
  panels['files'] = filesPanel;

  // --- Panel 3: Setup Panel ---
  const setupPanel = document.createElement('div');
  setupPanel.id = 'panel-setup';
  setupPanel.role = 'tabpanel';
  setupPanel.setAttribute('aria-labelledby', 'tab-setup');
  setupPanel.className = 'tab-panel';
  setupPanel.style.display = 'none';
  renderSetup(setupPanel, {
    guides: setupGuides,
    owner,
    repo,
  });
  tabContentContainer.appendChild(setupPanel);
  panels['setup'] = setupPanel;

  // --- Panel 4: README Panel ---
  const readmePanel = document.createElement('div');
  readmePanel.id = 'panel-readme';
  readmePanel.role = 'tabpanel';
  readmePanel.setAttribute('aria-labelledby', 'tab-readme');
  readmePanel.className = 'tab-panel';
  readmePanel.style.display = 'none';
  renderReadme(readmePanel, {
    readmeText,
    owner,
    repo,
    defaultBranch,
    error: readmeError,
  });
  tabContentContainer.appendChild(readmePanel);
  panels['readme'] = readmePanel;

  // --- Panel 5: Contribute Panel ---
  const contributePanel = document.createElement('div');
  contributePanel.id = 'panel-contribute';
  contributePanel.role = 'tabpanel';
  contributePanel.setAttribute('aria-labelledby', 'tab-contribute');
  contributePanel.className = 'tab-panel';
  contributePanel.style.display = 'none';
  renderContribute(contributePanel, {
    owner,
    repo,
    metadata,
    detection,
    defaultBranch,
  });
  tabContentContainer.appendChild(contributePanel);
  panels['contribute'] = contributePanel;

  resultsWrapper.appendChild(tabContentContainer);
  container.appendChild(resultsWrapper);
}
