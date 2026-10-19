/**
 * INDUSTRIAL MODERNIST DEPENDENCY & SUPPLY CHAIN AUDIT
 * Renders module 07 // DEPENDENCIES
 * Technology signature bento, categorized ecosystem breakdown, and searchable dependency registry.
 */

/**
 * Render the Dependency & Supply Chain module into the provided panel container.
 * @param {HTMLElement} container
 * @param {object} params
 * @param {object} params.depData - Output from dependency-scanner.js
 * @param {string} params.owner
 * @param {string} params.repo
 */
export function renderDependencies(container, { depData, owner, repo }) {
  container.innerHTML = '';

  const {
    hasManifest = false,
    totalCount = 0,
    prodCount = 0,
    devCount = 0,
    peerCount = 0,
    signatures = {},
    categories = {},
    allDependencies = [],
  } = depData || {};

  const depConsole = document.createElement('div');
  depConsole.className = 'dep-console';

  // 1. Panel Header Bar
  const headerBar = document.createElement('div');
  headerBar.className = 'panel-header-bar';
  headerBar.innerHTML = `
    <div class="panel-header-left">
      <span class="panel-id-label">MODULE // 07_DEPENDENCY_&_SUPPLY_CHAIN_AUDIT</span>
      <span class="badge-tag">${hasManifest ? '[MANIFEST: package.json]' : '[NO_MANIFEST_DETECTED]'}</span>
      <span class="badge-tag badge-tag-nominal">[TOTAL_DEPS: ${totalCount}]</span>
      <span class="badge-tag">[PROD: ${prodCount}]</span>
      <span class="badge-tag">[DEV: ${devCount}]</span>
      ${peerCount > 0 ? `<span class="badge-tag">[PEER: ${peerCount}]</span>` : ''}
    </div>
    <div class="panel-header-right">
      <span class="badge-tag">[KEYBINDS_ACTIVE: 1-7]</span>
    </div>
  `;
  depConsole.appendChild(headerBar);

  if (!hasManifest || totalCount === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'dep-empty-state';
    emptyState.innerHTML = `
      <div class="dep-empty-icon">⚲</div>
      <div class="dep-empty-title">NO_PACKAGE_DEPENDENCIES_DISCOVERED</div>
      <p class="dep-empty-desc">
        No standard <code>package.json</code> manifest was found or no external dependencies are declared.
        The repository may be an ecosystem-agnostic library, binary utility, or uses standard language libraries.
      </p>
    `;
    depConsole.appendChild(emptyState);
    container.appendChild(depConsole);
    return;
  }

  // 2. Technology Signatures Bento Grid
  const signaturesGrid = document.createElement('div');
  signaturesGrid.className = 'dep-signatures-grid';
  signaturesGrid.innerHTML = `
    <div class="dep-sig-card">
      <div class="dep-sig-label">FRAMEWORK_SIGNATURE</div>
      <div class="dep-sig-val ${signatures.framework ? 'text-primary' : 'text-muted'}">
        ${signatures.framework || 'Vanilla / Library'}
      </div>
    </div>
    <div class="dep-sig-card">
      <div class="dep-sig-label">BUILD_&_BUNDLER</div>
      <div class="dep-sig-val ${signatures.bundler ? 'text-primary' : 'text-muted'}">
        ${signatures.bundler || 'Standard / Unbundled'}
      </div>
    </div>
    <div class="dep-sig-card">
      <div class="dep-sig-label">TEST_HARNESS</div>
      <div class="dep-sig-val ${signatures.testRunner ? 'text-primary' : 'text-muted'}">
        ${signatures.testRunner || 'None declared'}
      </div>
    </div>
    <div class="dep-sig-card">
      <div class="dep-sig-label">STYLING_ENGINE</div>
      <div class="dep-sig-val ${signatures.styling ? 'text-primary' : 'text-muted'}">
        ${signatures.styling || 'Standard CSS / None'}
      </div>
    </div>
  `;
  depConsole.appendChild(signaturesGrid);

  // 3. Categorized Clusters
  const clustersWrapper = document.createElement('div');
  clustersWrapper.className = 'dep-clusters-grid';

  const clusterKeys = ['frameworks', 'build', 'testing', 'data', 'styling'];
  clusterKeys.forEach((catKey) => {
    const cat = categories[catKey];
    if (!cat || cat.packages.length === 0) return;

    const clusterCard = document.createElement('div');
    clusterCard.className = 'dep-cluster-card';
    clusterCard.innerHTML = `
      <div class="dep-cluster-header">
        <span class="dep-cluster-title">${cat.label}</span>
        <span class="badge-tag ${cat.badge}">[${cat.packages.length}]</span>
      </div>
      <div class="dep-cluster-tags">
        ${cat.packages
          .map(
            (p) => `
          <a href="https://www.npmjs.com/package/${encodeURIComponent(p.name)}" target="_blank" rel="noopener noreferrer" class="dep-pkg-chip" title="${p.name}@${p.version}">
            <span class="pkg-name">${p.name}</span>
            <span class="pkg-ver">${p.version}</span>
            ${p.isDev ? '<span class="pkg-scope-tag">DEV</span>' : ''}
          </a>
        `
          )
          .join('')}
      </div>
    `;
    clustersWrapper.appendChild(clusterCard);
  });

  if (clustersWrapper.children.length > 0) {
    depConsole.appendChild(clustersWrapper);
  }

  // 4. Interactive Search & All Dependencies Table
  const tableSection = document.createElement('div');
  tableSection.className = 'dep-table-section';

  const tableHeader = document.createElement('div');
  tableHeader.className = 'dep-table-header-row';
  tableHeader.innerHTML = `
    <div class="dep-table-title-group">
      <span class="dep-table-title">MANIFEST_REGISTRY_EXPLORER</span>
      <span class="badge-tag">[${allDependencies.length}_PACKAGES]</span>
    </div>
    <div class="dep-search-box">
      <input
        type="search"
        id="dep-search-input"
        class="dep-search-input"
        placeholder="FILTER_PACKAGES: e.g. react, vite, test..."
        aria-label="Filter dependencies by package name"
      />
    </div>
  `;
  tableSection.appendChild(tableHeader);

  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'dep-table-wrapper';

  const table = document.createElement('table');
  table.className = 'dep-matrix-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>PACKAGE_NAME</th>
        <th>VERSION</th>
        <th>SCOPE</th>
        <th style="text-align: right;">REGISTRY_SOURCE</th>
      </tr>
    </thead>
    <tbody id="dep-table-body">
      ${allDependencies
        .map(
          (dep) => `
        <tr data-name="${dep.name.toLowerCase()}">
          <td class="dep-name-cell">
            <a href="${dep.npmUrl}" target="_blank" rel="noopener noreferrer" class="dep-registry-link">
              <code>${dep.name}</code> ↗
            </a>
          </td>
          <td class="dep-version-cell">
            <code>${dep.version}</code>
          </td>
          <td>
            <span class="badge-tag ${dep.type === 'prod' ? 'badge-tag-nominal' : 'badge-tag'}">
              ${dep.type.toUpperCase()}_DEP
            </span>
          </td>
          <td style="text-align: right;">
            <span class="text-muted">npmjs.com</span>
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  `;
  tableWrapper.appendChild(table);
  tableSection.appendChild(tableWrapper);
  depConsole.appendChild(tableSection);

  // Live client-side search filter
  const searchInput = tableSection.querySelector('#dep-search-input');
  const tbody = tableSection.querySelector('#dep-table-body');
  if (searchInput && tbody) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const rows = tbody.querySelectorAll('tr');
      rows.forEach((row) => {
        const name = row.getAttribute('data-name') || '';
        row.style.display = !q || name.includes(q) ? '' : 'none';
      });
    });
  }

  container.appendChild(depConsole);
}
