/**
 * INDUSTRIAL MODERNIST RESULTS CONTROL CONSOLE
 * Flight deck telemetry, language composition bar, maintenance pulse,
 * report exports ([COPY_MARKDOWN], [EXPORT_JSON]), and hardware switchboard tabs.
 */

import { formatCompactNumber, formatNullable, formatDate } from '../core/formatters.js';
import { generateMarkdownReport, generateJsonReport } from '../services/repository-service.js';
import { explainRepository } from '../core/repo-explainer.js';
import { renderFiles } from './render-files.js';
import { renderReadme } from './render-readme.js';
import { renderSetup } from './render-setup.js';
import { renderContribute } from './render-contribute.js';
import { renderEnv } from './render-env.js';
import { renderDependencies } from './render-dependencies.js';
import { renderPartialAlert } from './render-states.js';

/**
 * Calculates language percentage shares.
 * @param {Record<string, number>} languages
 * @returns {{ name: string, percent: number, color: string }[]}
 */
function getLanguageShares(languages = {}) {
  const entries = Object.entries(languages);
  const total = entries.reduce((acc, [, val]) => acc + val, 0);
  if (total === 0) return [];

  const langColors = {
    TypeScript: '#3178C6',
    JavaScript: '#F7DF1E',
    Python: '#3572A5',
    Go: '#00ADD8',
    Rust: '#DEA584',
    HTML: '#E34C26',
    CSS: '#563D7C',
    C: '#555555',
    'C++': '#F34B7D',
    Ruby: '#701516',
    Java: '#B07219',
  };

  return entries.slice(0, 5).map(([name, bytes]) => ({
    name,
    percent: Math.round((bytes / total) * 100),
    color: langColors[name] || '#888888',
  }));
}

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
    languages = {},
    pulse,
    explainer = data.explainer ||
      explainRepository({
        metadata,
        readmeText,
        contents,
        packageJsonContent: null,
        owner,
        repo,
        defaultBranch,
      }),
    isPartial,
    isCacheHit,
    isDemo,
    envData = data.envData || { hasEnvFile: false, entries: [] },
    depData = data.depData || { hasManifest: false, totalCount: 0 },
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
    ${isCacheHit ? '<span class="badge-tag badge-tag-info">[CACHE_HIT // 0_API_COST]</span>' : ''}
    ${isDemo ? '<span class="badge-tag badge-tag-warning">[DEMO_SNAPSHOT // 0_API_COST]</span>' : ''}
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

  // Deck Action Buttons & Export Triggers
  const actionsGroup = document.createElement('div');
  actionsGroup.className = 'deck-actions';

  // Copy Markdown Report Button
  const copyMdBtn = document.createElement('button');
  copyMdBtn.type = 'button';
  copyMdBtn.className = 'btn btn-secondary btn-sm';
  copyMdBtn.textContent = '[COPY_MD_REPORT]';
  copyMdBtn.title = 'Copy executive markdown summary for PRs or documentation';
  copyMdBtn.addEventListener('click', async () => {
    try {
      const md = generateMarkdownReport(data);
      await navigator.clipboard.writeText(md);
      copyMdBtn.textContent = '[REPORT_COPIED ✓]';
      setTimeout(() => {
        copyMdBtn.textContent = '[COPY_MD_REPORT]';
      }, 2000);
    } catch {
      copyMdBtn.textContent = '[COPY_FAILED]';
    }
  });

  // Export JSON Button
  const exportJsonBtn = document.createElement('button');
  exportJsonBtn.type = 'button';
  exportJsonBtn.className = 'btn btn-secondary btn-sm';
  exportJsonBtn.textContent = '[EXPORT_JSON]';
  exportJsonBtn.title = 'Download structured JSON telemetry file';
  exportJsonBtn.addEventListener('click', () => {
    const jsonStr = generateJsonReport(data);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repology-${owner}-${repo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Share link trigger
  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'btn btn-secondary btn-sm';
  shareBtn.textContent = '[SHARE_URL]';
  shareBtn.title = 'Copy direct shareable URL';
  shareBtn.addEventListener('click', async () => {
    try {
      const shareUrl = `${window.location.origin}/?target=${owner}/${repo}`;
      await navigator.clipboard.writeText(shareUrl);
      shareBtn.textContent = '[URL_COPIED ✓]';
      setTimeout(() => {
        shareBtn.textContent = '[SHARE_URL]';
      }, 2000);
    } catch {
      shareBtn.textContent = '[COPY_FAILED]';
    }
  });

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

  actionsGroup.appendChild(shareBtn);
  actionsGroup.appendChild(copyMdBtn);
  actionsGroup.appendChild(exportJsonBtn);
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
    <div class="tele-node"><span class="tele-key">CADENCE:</span><span class="tele-val" style="color: ${pulse?.color || '#10B981'};">${pulse?.label?.split(' ')[0] || 'ACTIVE'}</span></div>
    <div class="tele-node"><span class="tele-key">LAST_PUSH:</span><span class="tele-val">${lastUpdated}</span></div>
  `;
  flightDeck.appendChild(teleStrip);

  // 3b. Instant Cloud Launchpad & Quick Clone Strip
  const launchpadStrip = document.createElement('div');
  launchpadStrip.className = 'deck-launchpad-strip';

  const launchGroup = document.createElement('div');
  launchGroup.className = 'launchpad-actions';
  launchGroup.innerHTML = `
    <span class="launchpad-label">QUICK_LAUNCH:</span>
    <a href="https://codespaces.new/${owner}/${repo}" target="_blank" rel="noopener noreferrer" class="launch-chip" title="Launch instant cloud environment in GitHub Codespaces">CODESPACES ↗</a>
    <a href="https://gitpod.io/#https://github.com/${owner}/${repo}" target="_blank" rel="noopener noreferrer" class="launch-chip" title="Launch instant container in Gitpod">GITPOD ↗</a>
    <a href="https://stackblitz.com/github/${owner}/${repo}" target="_blank" rel="noopener noreferrer" class="launch-chip" title="Launch web sandbox in StackBlitz">STACKBLITZ ↗</a>
    <a href="https://github.dev/${owner}/${repo}" target="_blank" rel="noopener noreferrer" class="launch-chip" title="Open in GitHub.dev Web Editor">GITHUB.DEV ↗</a>
    <a href="vscode://vscode.git/clone?url=https://github.com/${owner}/${repo}.git" class="launch-chip" title="Clone directly into local VS Code">VS_CODE ↗</a>
  `;

  const cloneGroup = document.createElement('div');
  cloneGroup.className = 'clone-actions';

  const cloneCommands = {
    https: `git clone https://github.com/${owner}/${repo}.git`,
    ssh: `git clone git@github.com:${owner}/${repo}.git`,
    cli: `gh repo clone ${owner}/${repo}`,
  };

  cloneGroup.innerHTML = `
    <div class="clone-protocol-toggles" role="group" aria-label="Clone protocol selection">
      <button type="button" class="clone-proto-btn active" data-proto="https">HTTPS</button>
      <button type="button" class="clone-proto-btn" data-proto="ssh">SSH</button>
      <button type="button" class="clone-proto-btn" data-proto="cli">GH_CLI</button>
    </div>
    <div class="clone-input-wrap">
      <code class="clone-cmd-text" id="clone-cmd-display">${cloneCommands.https}</code>
      <button type="button" class="btn-copy-clone" id="btn-copy-clone-cmd" title="Copy git clone command to clipboard">[COPY]</button>
    </div>
  `;

  let activeProto = 'https';
  const protoButtons = cloneGroup.querySelectorAll('.clone-proto-btn');
  const cmdDisplay = cloneGroup.querySelector('#clone-cmd-display');
  const copyCloneBtn = cloneGroup.querySelector('#btn-copy-clone-cmd');

  protoButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      protoButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeProto = btn.getAttribute('data-proto');
      if (cmdDisplay) cmdDisplay.textContent = cloneCommands[activeProto];
    });
  });

  copyCloneBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(cloneCommands[activeProto]);
      copyCloneBtn.textContent = '[COPIED ✓]';
      setTimeout(() => {
        copyCloneBtn.textContent = '[COPY]';
      }, 2000);
    } catch {
      copyCloneBtn.textContent = '[FAIL]';
    }
  });

  launchpadStrip.appendChild(launchGroup);
  launchpadStrip.appendChild(cloneGroup);
  flightDeck.appendChild(launchpadStrip);
  resultsConsole.appendChild(flightDeck);

  // 4. Hardware Switchboard Tab Navigation
  const switchboard = document.createElement('nav');
  switchboard.className = 'switchboard-nav';
  switchboard.setAttribute('role', 'tablist');

  const envCount = envData.totalCount || 0;
  const depCount = depData.totalCount || 0;

  const tabs = [
    { id: 'overview', label: '01 // OVERVIEW_&_EXPLAINER', badge: '[EXPLAINED]' },
    { id: 'files', label: '02 // ROOT_TREE', badge: `[${contents.length}]` },
    { id: 'setup', label: '03 // SETUP_SIGNALS', badge: `[${setupGuides.length}]` },
    { id: 'readme', label: '04 // README_TERMINAL', badge: readmeText ? '[OK]' : '[NONE]' },
    { id: 'contribute', label: '05 // CONTRIBUTE_VECTORS', badge: '' },
    { id: 'env', label: '06 // ENV_&_CONFIG', badge: `[${envCount}]` },
    { id: 'deps', label: '07 // DEPENDENCIES', badge: `[${depCount}]` },
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

  // --- Panel 1: Overview Matrix with Functionality Explainer & Architecture ---
  const overviewPanel = document.createElement('div');
  overviewPanel.id = 'panel-overview';
  overviewPanel.role = 'tabpanel';
  overviewPanel.setAttribute('aria-labelledby', 'tab-overview');
  overviewPanel.style.display = 'block';

  const ovHeader = document.createElement('div');
  ovHeader.className = 'panel-header-bar';
  ovHeader.innerHTML = `
    <div class="panel-header-left">
      <span class="panel-id-label">MODULE // 01_OVERVIEW_&_EXPLAINER</span>
      <span class="badge-tag" style="color: ${pulse?.color || '#10B981'};">[CADENCE: ${pulse?.label || 'ACTIVE'}]</span>
      <span class="badge-tag">${explainer.projectType?.badge || '[TYPE: GENERAL_REPOSITORY]'}</span>
    </div>
    <div class="panel-header-right">
      <span class="badge-tag">[KEYBINDS_ACTIVE: 1-5]</span>
    </div>
  `;
  overviewPanel.appendChild(ovHeader);

  // 1. Executive Functionality Explainer Hero Card
  const explainerCard = document.createElement('div');
  explainerCard.className = 'explainer-hero-card';

  const headlineRow = document.createElement('div');
  headlineRow.className = 'explainer-headline-row';
  headlineRow.innerHTML = `
    <div class="explainer-title-group">
      <span class="explainer-section-label">SYSTEM_MISSION // PLAIN_ENGLISH_EXPLANATION</span>
      <span class="badge-tag badge-tag-nominal"><span class="badge-led"></span>SOURCE_GROUNDED</span>
    </div>
    <span class="badge-tag badge-tag-info">${explainer.projectType?.label || 'Software Repository'}</span>
  `;
  explainerCard.appendChild(headlineRow);

  const pitchPara = document.createElement('p');
  pitchPara.className = 'explainer-pitch';
  pitchPara.textContent =
    explainer.overviewExplanation ||
    explainer.elevatorPitch ||
    metadata.description ||
    'Open-source software repository.';
  explainerCard.appendChild(pitchPara);

  // Feature Capabilities Grid (if features extracted)
  if (explainer.features && explainer.features.length > 0) {
    const featHeader = document.createElement('div');
    featHeader.className = 'explainer-capabilities-heading';
    featHeader.innerHTML = `<span>CORE_CAPABILITIES & HIGHLIGHTS</span> <span class="badge-tag">[${explainer.features.length}_EXTRACTED]</span>`;
    explainerCard.appendChild(featHeader);

    const featGrid = document.createElement('div');
    featGrid.className = 'explainer-features-grid';
    explainer.features.forEach((feat) => {
      const chip = document.createElement('div');
      chip.className = 'feature-chip';
      chip.innerHTML = `
        <span class="feature-bullet">▸</span>
        <span class="feature-text">${feat}</span>
      `;
      featGrid.appendChild(chip);
    });
    explainerCard.appendChild(featGrid);
  }
  overviewPanel.appendChild(explainerCard);

  // 2. Codebase Anatomy & Navigation Blueprint
  const anatomyBento = document.createElement('div');
  anatomyBento.className = 'anatomy-bento-grid';

  // Left Cell: Where to start reading code
  const entryBlock = document.createElement('div');
  entryBlock.className = 'anatomy-block';
  entryBlock.innerHTML = `
    <div class="anatomy-block-title">
      <span>WHERE_TO_START_READING</span>
      <span class="badge-tag badge-tag-nominal">START_HERE</span>
    </div>
    <div class="entry-point-card">
      <div class="entry-target-row">
        <code class="entry-target-code">${explainer.entryPoint?.path || 'README.md'}</code>
        <a href="${explainer.entryPoint?.url || metadata.html_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
          OPEN_IN_GITHUB ↗
        </a>
      </div>
      <p class="entry-reason-text">${explainer.entryPoint?.reason || 'Primary repository entry point.'}</p>
    </div>
  `;
  anatomyBento.appendChild(entryBlock);

  // Right Cell: Directory Map Table
  const dirBlock = document.createElement('div');
  dirBlock.className = 'anatomy-block';
  let dirRowsHtml = '';
  if (explainer.directoryAnatomy && explainer.directoryAnatomy.length > 0) {
    dirRowsHtml = `
      <table class="directory-anatomy-table">
        <tbody>
          ${explainer.directoryAnatomy
            .map(
              (d) => `
            <tr>
              <td class="dir-cell-name">
                <a href="${d.url}" target="_blank" rel="noopener noreferrer">📁 ${d.name}/</a>
              </td>
              <td class="dir-cell-badge">
                <span class="badge-tag">${d.badge}</span>
              </td>
              <td class="dir-cell-purpose">${d.purpose}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } else {
    dirRowsHtml = '<p style="color: var(--text-muted); font-size: 11px;">Flat root structure. No top-level directories detected.</p>';
  }

  dirBlock.innerHTML = `
    <div class="anatomy-block-title">
      <span>ROOT_DIRECTORY_ANATOMY</span>
      <span class="badge-tag">[${explainer.directoryAnatomy?.length || 0}_DIRS]</span>
    </div>
    ${dirRowsHtml}
  `;
  anatomyBento.appendChild(dirBlock);
  overviewPanel.appendChild(anatomyBento);

  // 3. Dependencies & Toolchain (if present)
  if (
    (explainer.runtimeDeps && explainer.runtimeDeps.length > 0) ||
    (explainer.devToolchain && explainer.devToolchain.length > 0)
  ) {
    const depsBlock = document.createElement('div');
    depsBlock.className = 'deps-strip-block';
    let depsHtml = '';
    if (explainer.runtimeDeps && explainer.runtimeDeps.length > 0) {
      depsHtml += `
        <div class="deps-group">
          <span class="deps-label">RUNTIME_DEPENDENCIES:</span>
          <div class="deps-tags-list">
            ${explainer.runtimeDeps.map((d) => `<span class="dep-tag dep-tag-runtime">${d}</span>`).join('')}
          </div>
        </div>
      `;
    }
    if (explainer.devToolchain && explainer.devToolchain.length > 0) {
      depsHtml += `
        <div class="deps-group">
          <span class="deps-label">DEVELOPER_TOOLCHAIN:</span>
          <div class="deps-tags-list">
            ${explainer.devToolchain.map((d) => `<span class="dep-tag">${d}</span>`).join('')}
          </div>
        </div>
      `;
    }
    depsBlock.innerHTML = depsHtml;
    overviewPanel.appendChild(depsBlock);
  }

  // Bento Split Grid
  const overviewGrid = document.createElement('div');
  overviewGrid.className = 'overview-matrix-grid';

  // Left Cell: Structured Facts & Velocity Pulse
  const factsBlock = document.createElement('div');
  factsBlock.className = 'matrix-block';

  // Language Breakdown Progress Bar
  const langShares = getLanguageShares(languages);
  let langBarHtml = '';
  if (langShares.length > 0) {
    langBarHtml = `
      <div style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 11px; margin-bottom: 0.35rem; color: var(--text-muted);">
          <span>COMPOSITION_SPECTRUM:</span>
          <span>${langShares.map((s) => `${s.name} ${s.percent}%`).join(' • ')}</span>
        </div>
        <div style="display: flex; height: 6px; background-color: #111; overflow: hidden; border: 1px solid var(--border-subtle);">
          ${langShares
            .map(
              (s) =>
                `<div style="width: ${s.percent}%; background-color: ${s.color};" title="${s.name}: ${s.percent}%"></div>`
            )
            .join('')}
        </div>
      </div>
    `;
  }

  factsBlock.innerHTML = `
    ${langBarHtml}
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
          <td class="td-label">MAINTENANCE_CADENCE:</td>
          <td class="td-val" style="color: ${pulse?.color || '#10B981'};">${pulse?.label || 'ACTIVE'} (Pushed: ${pulse?.relativePush || 'Recent'})</td>
        </tr>
        <tr>
          <td class="td-label">LICENSE_COMPLIANCE:</td>
          <td class="td-val">${pulse?.licenseType || formatNullable(licenseName)}</td>
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
          <span class="trigger-title">03 // SETUP_SIGNALS <span class="keycap">3</span></span>
          <span class="trigger-desc">${setupGuides.length} verified manifest commands & confidence tiers</span>
        </div>
        <span class="trigger-arrow">→</span>
      </button>

      <button type="button" class="inspection-trigger-btn" id="shortcut-files">
        <div class="trigger-left">
          <span class="trigger-title">02 // ROOT_DIRECTORY_TREE <span class="keycap">2</span></span>
          <span class="trigger-desc">${contents.length} top-level entries with on-demand folder expansion</span>
        </div>
        <span class="trigger-arrow">→</span>
      </button>

      <button type="button" class="inspection-trigger-btn" id="shortcut-readme">
        <div class="trigger-left">
          <span class="trigger-title">04 // README_TERMINAL <span class="keycap">4</span></span>
          <span class="trigger-desc">Sanitized markdown preview with table of contents & raw toggle</span>
        </div>
        <span class="trigger-arrow">→</span>
      </button>

      <button type="button" class="inspection-trigger-btn" id="shortcut-contribute">
        <div class="trigger-left">
          <span class="trigger-title">05 // CONTRIBUTE_VECTORS <span class="keycap">5</span></span>
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

  // --- Panel 6: Environment & Configuration Radar ---
  const envPanel = document.createElement('div');
  envPanel.id = 'panel-env';
  envPanel.role = 'tabpanel';
  envPanel.setAttribute('aria-labelledby', 'tab-env');
  envPanel.style.display = 'none';
  renderEnv(envPanel, {
    envData,
    owner,
    repo,
  });
  panelsContainer.appendChild(envPanel);
  panels['env'] = envPanel;

  // --- Panel 7: Dependency & Supply Chain Audit ---
  const depsPanel = document.createElement('div');
  depsPanel.id = 'panel-deps';
  depsPanel.role = 'tabpanel';
  depsPanel.setAttribute('aria-labelledby', 'tab-deps');
  depsPanel.style.display = 'none';
  renderDependencies(depsPanel, {
    depData,
    owner,
    repo,
  });
  panelsContainer.appendChild(depsPanel);
  panels['deps'] = depsPanel;

  resultsConsole.appendChild(panelsContainer);
  container.appendChild(resultsConsole);
}
