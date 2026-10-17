/**
 * INDUSTRIAL MODERNIST RESULTS CONTROL CONSOLE
 * Flight deck telemetry, monospace metrics strip, hardware switchboard tabs, and inspectable modules.
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

  const resultsConsole = document.createElement('div');
  resultsConsole.className = 'results-console';

  // 1. Partial Telemetry Alert Banner
  if (isPartial) {
    const errorDetails = [];
    if (readmeError) errorDetails.push('README_BUFFER');
    if (contentsError) errorDetails.push('ROOT_DIRECTORY_TREE');
    renderPartialAlert(
      resultsConsole,
      `[PARTIAL_TELEMETRY] ${errorDetails.join(' & ')} could not be loaded. Showing available data.`
    );
  }

  // 2. Flight-Deck Header
  const flightDeck = document.createElement('section');
  flightDeck.className = 'telemetry-deck';

  const deckTop = document.createElement('div');
  deckTop.className = 'deck-top-row';

  const coordsGroup = document.createElement('div');
  coordsGroup.className = 'deck-repo-coords';

  const breadcrumbs = document.createElement('div');
  breadcrumbs.className = 'coords-breadcrumbs';
  breadcrumbs.innerHTML = `
    <span class="badge-tag badge-tag-nominal"><span class="badge-led"></span>ACTIVE</span>
    <span class="coords-owner">${metadata.owner?.login || owner}</span>
    <span class="coords-sep">/</span>
    <h2 class="coords-repo">${metadata.name || repo}</h2>
    ${metadata.archived ? '<span class="badge-tag badge-tag-warning">[ARCHIVED]</span>' : ''}
    ${metadata.fork ? '<span class="badge-tag">[FORK]</span>' : ''}
  `;
  coordsGroup.appendChild(breadcrumbs);

  if (metadata.description) {
    const desc = document.createElement('p');
    desc.className = 'deck-desc';
    desc.textContent = metadata.description;
    coordsGroup.appendChild(desc);
  }

  deckTop.appendChild(coordsGroup);

  const actionsGroup = document.createElement('div');
  actionsGroup.className = 'deck-actions';

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'btn btn-primary btn-sm';
  changeBtn.innerHTML = '← CHANGE_TARGET <span class="keycap">ESC</span>';
  changeBtn.addEventListener('click', onChangeRepo);

  const ghLink = document.createElement('a');
  ghLink.className = 'btn btn-secondary btn-sm';
  ghLink.href = metadata.html_url || `https://github.com/${owner}/${repo}`;
  ghLink.target = '_blank';
  ghLink.rel = 'noopener noreferrer';
  ghLink.textContent = 'GH_SOURCE ↗';

  actionsGroup.appendChild(changeBtn);
  actionsGroup.appendChild(ghLink);
  deckTop.appendChild(actionsGroup);
  flightDeck.appendChild(deckTop);

  // 3. Tabular Telemetry Matrix Strip
  const teleStrip = document.createElement('div');
  teleStrip.className = 'telemetry-strip';

  const lang = metadata.language;
  const stars = formatCompactNumber(metadata.stargazers_count);
  const forks = formatCompactNumber(metadata.forks_count);
  const issues = formatCompactNumber(metadata.open_issues_count);
  const licenseName = metadata.license?.spdx_id || metadata.license?.name || null;
  const lastUpdated = formatDate(metadata.pushed_at || metadata.updated_at);

  teleStrip.innerHTML = `
    ${lang ? `<div class="tele-node"><span class="tele-key">LANG:</span><span class="tele-val">${lang}</span></div>` : ''}
    <div class="tele-node"><span class="tele-key">STARS:</span><span class="tele-val">${stars}</span></div>
    <div class="tele-node"><span class="tele-key">FORKS:</span><span class="tele-val">${forks}</span></div>
    <div class="tele-node"><span class="tele-key">ISSUES:</span><span class="tele-val">${issues}</span></div>
    <div class="tele-node"><span class="tele-key">BRANCH:</span><span class="tele-val"><code>${defaultBranch}</code></span></div>
    <div class="tele-node"><span class="tele-key">LICENSE:</span><span class="tele-val">${formatNullable(licenseName)}</span></div>
    <div class="tele-node"><span class="tele-key">LAST_PUSH:</span><span class="tele-val">${lastUpdated}</span></div>
  `;
  flightDeck.appendChild(teleStrip);
  resultsConsole.appendChild(flightDeck);

  // 4. Hardware Switchboard Tab Navigation
  const switchboard = document.createElement('nav');
  switchboard.className = 'switchboard-nav';
  switchboard.setAttribute('role', 'tablist');

  const tabs = [
    { id: 'overview', label: '01 // OVERVIEW_MATRIX', badge: '' },
    { id: 'files', label: '02 // ROOT_TREE', badge: `[${contents.length}]` },
    { id: 'setup', label: '03 // SETUP_SIGNALS', badge: `[${setupGuides.length}]` },
    { id: 'readme', label: '04 // README_TERMINAL', badge: readmeText ? '[OK]' : '[NONE]' },
    { id: 'contribute', label: '05 // CONTRIBUTE_VECTORS', badge: '' },
  ];

  const panels = {};

  tabs.forEach((tab, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'tab';
    btn.id = `tab-${tab.id}`;
    btn.className = `switch-tab ${index === 0 ? 'active' : ''}`;
    btn.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    btn.setAttribute('aria-controls', `panel-${tab.id}`);
    btn.innerHTML = `<span>${tab.label}</span> <span class="tab-badge">${tab.badge}</span>`;

    btn.addEventListener('click', () => {
      switchboard.querySelectorAll('.switch-tab').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      Object.keys(panels).forEach((pId) => {
        panels[pId].style.display = pId === tab.id ? 'block' : 'none';
      });
    });

    switchboard.appendChild(btn);
  });

  resultsConsole.appendChild(switchboard);

  // 5. Panels Container
  const panelsContainer = document.createElement('div');
  panelsContainer.className = 'panels-container';

  // --- Panel 1: Overview Matrix ---
  const overviewPanel = document.createElement('div');
  overviewPanel.id = 'panel-overview';
  overviewPanel.role = 'tabpanel';
  overviewPanel.setAttribute('aria-labelledby', 'tab-overview');
  overviewPanel.style.display = 'block';

  // Panel Header Bar
  const ovHeader = document.createElement('div');
  ovHeader.className = 'panel-header-bar';
  ovHeader.innerHTML = `
    <div class="panel-header-left">
      <span class="panel-id-label">MODULE // 01_OVERVIEW_MATRIX</span>
    </div>
    <div class="panel-header-right">
      <span class="badge-tag">[TELEMETRY_SYNCED]</span>
    </div>
  `;
  overviewPanel.appendChild(ovHeader);

  // Hairline Split Grid
  const overviewGrid = document.createElement('div');
  overviewGrid.className = 'overview-matrix-grid';

  // Left Cell: Structured Facts
  const factsBlock = document.createElement('div');
  factsBlock.className = 'matrix-block';
  factsBlock.innerHTML = `
    <table class="telemetry-table">
      <tbody>
        <tr>
          <td class="td-label">PRIMARY_LANGUAGE:</td>
          <td class="td-val">${formatNullable(metadata.language)}</td>
        </tr>
        <tr>
          <td class="td-label">DETECTED_ECOSYSTEMS:</td>
          <td class="td-val">${detection.ecosystems.length > 0 ? detection.ecosystems.join(', ') : 'NONE_RECOGNIZED'}</td>
        </tr>
        <tr>
          <td class="td-label">DETECTED_MANIFESTS:</td>
          <td class="td-val">${detection.manifests.length > 0 ? detection.manifests.join(', ') : 'NONE_RECOGNIZED'}</td>
        </tr>
        <tr>
          <td class="td-label">PACKAGE_MANAGER:</td>
          <td class="td-val">${detection.packageManager || (detection.hasConflictingLockfiles ? 'CONFLICTING_LOCKFILES' : 'NONE_DETECTED')}</td>
        </tr>
        <tr>
          <td class="td-label">DEFAULT_BRANCH:</td>
          <td class="td-val"><code>${defaultBranch}</code></td>
        </tr>
        <tr>
          <td class="td-label">SPDX_LICENSE:</td>
          <td class="td-val">${formatNullable(licenseName)}</td>
        </tr>
        <tr>
          <td class="td-label">CI_PIPELINES:</td>
          <td class="td-val">${detection.hasCi ? 'YES (.github/workflows)' : 'NONE'}</td>
        </tr>
        <tr>
          <td class="td-label">CONTAINERIZATION:</td>
          <td class="td-val">${detection.hasDocker ? 'YES (Dockerfile/Compose)' : 'NONE'}</td>
        </tr>
      </tbody>
    </table>
  `;
  overviewGrid.appendChild(factsBlock);

  // Right Cell: Quick Module Inspection Triggers
  const triggersBlock = document.createElement('div');
  triggersBlock.className = 'matrix-block';
  triggersBlock.innerHTML = `
    <div class="inspection-trigger-list">
      <button type="button" class="inspection-trigger-btn" id="shortcut-setup">
        <div class="trigger-left">
          <span class="trigger-title">03 // SETUP_SIGNALS</span>
          <span class="trigger-desc">${setupGuides.length} verified manifest commands & confidence tiers</span>
        </div>
        <span class="trigger-arrow">→</span>
      </button>

      <button type="button" class="inspection-trigger-btn" id="shortcut-files">
        <div class="trigger-left">
          <span class="trigger-title">02 // ROOT_DIRECTORY_TREE</span>
          <span class="trigger-desc">${contents.length} top-level entries with on-demand folder expansion</span>
        </div>
        <span class="trigger-arrow">→</span>
      </button>

      <button type="button" class="inspection-trigger-btn" id="shortcut-readme">
        <div class="trigger-left">
          <span class="trigger-title">04 // README_TERMINAL</span>
          <span class="trigger-desc">Sanitized markdown preview with table of contents & raw toggle</span>
        </div>
        <span class="trigger-arrow">→</span>
      </button>

      <button type="button" class="inspection-trigger-btn" id="shortcut-contribute">
        <div class="trigger-left">
          <span class="trigger-title">05 // CONTRIBUTE_VECTORS</span>
          <span class="trigger-desc">Issues, PRs, and detected contributing guidelines</span>
        </div>
        <span class="trigger-arrow">→</span>
      </button>
    </div>
  `;
  overviewGrid.appendChild(triggersBlock);

  overviewPanel.appendChild(overviewGrid);
  panelsContainer.appendChild(overviewPanel);
  panels['overview'] = overviewPanel;

  // Shortcut navigation
  setTimeout(() => {
    triggersBlock.querySelector('#shortcut-setup')?.addEventListener('click', () => {
      document.getElementById('tab-setup')?.click();
    });
    triggersBlock.querySelector('#shortcut-files')?.addEventListener('click', () => {
      document.getElementById('tab-files')?.click();
    });
    triggersBlock.querySelector('#shortcut-readme')?.addEventListener('click', () => {
      document.getElementById('tab-readme')?.click();
    });
    triggersBlock.querySelector('#shortcut-contribute')?.addEventListener('click', () => {
      document.getElementById('tab-contribute')?.click();
    });
  }, 0);

  // --- Panel 2: Files Matrix ---
  const filesPanel = document.createElement('div');
  filesPanel.id = 'panel-files';
  filesPanel.role = 'tabpanel';
  filesPanel.setAttribute('aria-labelledby', 'tab-files');
  filesPanel.style.display = 'none';
  renderFiles(filesPanel, {
    entries: contents,
    owner,
    repo,
    defaultBranch,
    error: contentsError,
  });
  panelsContainer.appendChild(filesPanel);
  panels['files'] = filesPanel;

  // --- Panel 3: Setup Signals ---
  const setupPanel = document.createElement('div');
  setupPanel.id = 'panel-setup';
  setupPanel.role = 'tabpanel';
  setupPanel.setAttribute('aria-labelledby', 'tab-setup');
  setupPanel.style.display = 'none';
  renderSetup(setupPanel, {
    guides: setupGuides,
    owner,
    repo,
  });
  panelsContainer.appendChild(setupPanel);
  panels['setup'] = setupPanel;

  // --- Panel 4: README Terminal ---
  const readmePanel = document.createElement('div');
  readmePanel.id = 'panel-readme';
  readmePanel.role = 'tabpanel';
  readmePanel.setAttribute('aria-labelledby', 'tab-readme');
  readmePanel.style.display = 'none';
  renderReadme(readmePanel, {
    readmeText,
    owner,
    repo,
    defaultBranch,
    error: readmeError,
  });
  panelsContainer.appendChild(readmePanel);
  panels['readme'] = readmePanel;

  // --- Panel 5: Contribute Matrix ---
  const contributePanel = document.createElement('div');
  contributePanel.id = 'panel-contribute';
  contributePanel.role = 'tabpanel';
  contributePanel.setAttribute('aria-labelledby', 'tab-contribute');
  contributePanel.style.display = 'none';
  renderContribute(contributePanel, {
    owner,
    repo,
    metadata,
    detection,
    defaultBranch,
  });
  panelsContainer.appendChild(contributePanel);
  panels['contribute'] = contributePanel;

  resultsConsole.appendChild(panelsContainer);
  container.appendChild(resultsConsole);
}
