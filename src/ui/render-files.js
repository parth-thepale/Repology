/**
 * INDUSTRIAL MODERNIST FILE EXPLORER
 * High-density monospace table, sharp [+] / [-] folder toggles,
 * hairline borders, and lazy child directory expansion.
 */

import { formatFileSize, getFileIconInfo } from '../core/formatters.js';
import { getRepoContents } from '../services/repository-service.js';

/**
 * Creates a technical file or directory row.
 * @param {import('../core/detect-project.js').RootFileEntry} entry
 * @param {string} owner
 * @param {string} repo
 * @param {string} defaultBranch
 * @param {number} [level=0]
 * @returns {HTMLElement}
 */
function createFileRow(entry, owner, repo, defaultBranch, level = 0) {
  const row = document.createElement('div');
  row.className = 'file-row-item';
  row.style.paddingLeft = `${level * 1.25 + 1}rem`;
  row.dataset.name = entry.name.toLowerCase();

  const iconInfo = getFileIconInfo(entry);

  const leftGroup = document.createElement('div');
  leftGroup.className = 'file-item-left';

  let expandToggle = null;
  if (entry.type === 'dir') {
    expandToggle = document.createElement('button');
    expandToggle.type = 'button';
    expandToggle.className = 'folder-tree-toggle';
    expandToggle.setAttribute('aria-expanded', 'false');
    expandToggle.setAttribute('aria-label', `Expand folder ${entry.name}`);
    expandToggle.textContent = '+';
    leftGroup.appendChild(expandToggle);
  } else {
    const spacer = document.createElement('span');
    spacer.className = 'file-spacer';
    leftGroup.appendChild(spacer);
  }

  const link = document.createElement('a');
  link.className = 'file-item-name';
  link.textContent = entry.type === 'dir' ? `${entry.name}/` : entry.name;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const basePath = entry.path || entry.name;
  const githubType = entry.type === 'dir' ? 'tree' : 'blob';
  link.href = `https://github.com/${owner}/${repo}/${githubType}/${defaultBranch}/${basePath}`;

  leftGroup.appendChild(link);
  row.appendChild(leftGroup);

  const rightGroup = document.createElement('div');
  rightGroup.className = 'file-item-right';

  const badge = document.createElement('span');
  badge.className = 'badge-tag';
  badge.textContent = `[${iconInfo.label.toUpperCase().replace(/\s+/g, '_')}]`;
  rightGroup.appendChild(badge);

  const sizeEl = document.createElement('span');
  sizeEl.className = 'file-size-val';
  sizeEl.textContent = entry.type === 'dir' ? '—' : formatFileSize(entry.size);
  rightGroup.appendChild(sizeEl);

  row.appendChild(rightGroup);

  // Lazy directory expansion container
  if (entry.type === 'dir') {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'folder-children-stack';
    childrenContainer.style.display = 'none';

    let isLoaded = false;
    let isExpanded = false;

    expandToggle.addEventListener('click', async (e) => {
      e.stopPropagation();
      isExpanded = !isExpanded;
      expandToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      expandToggle.textContent = isExpanded ? '-' : '+';

      if (isExpanded) {
        childrenContainer.style.display = 'block';

        if (!isLoaded) {
          const loadingRow = document.createElement('div');
          loadingRow.className = 'file-row-item';
          loadingRow.style.paddingLeft = `${(level + 1) * 1.25 + 1}rem`;
          loadingRow.innerHTML = '<span class="text-muted" style="color: #666; font-size: 11px;">[FETCHING_CHILD_NODES...]</span>';
          childrenContainer.appendChild(loadingRow);

          const res = await getRepoContents(owner, repo, defaultBranch, basePath);
          childrenContainer.innerHTML = '';
          isLoaded = true;

          if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
            const sortedChildren = [...res.data].sort((a, b) => {
              if (a.type === 'dir' && b.type !== 'dir') return -1;
              if (a.type !== 'dir' && b.type === 'dir') return 1;
              return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            });

            sortedChildren.forEach((child) => {
              childrenContainer.appendChild(
                createFileRow(child, owner, repo, defaultBranch, level + 1)
              );
            });
          } else if (res.ok && Array.isArray(res.data) && res.data.length === 0) {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'file-row-item';
            emptyRow.style.paddingLeft = `${(level + 1) * 1.25 + 1}rem`;
            emptyRow.innerHTML = '<span class="text-muted" style="color: #666; font-size: 11px;">[DIRECTORY_EMPTY]</span>';
            childrenContainer.appendChild(emptyRow);
          } else {
            const errRow = document.createElement('div');
            errRow.className = 'file-row-item';
            errRow.style.paddingLeft = `${(level + 1) * 1.25 + 1}rem`;
            errRow.innerHTML = '<span class="text-muted" style="color: #EF4444; font-size: 11px;">[ERR_FETCHING_CHILDREN]</span>';
            childrenContainer.appendChild(errRow);
          }
        }
      } else {
        childrenContainer.style.display = 'none';
      }
    });

    const wrapper = document.createElement('div');
    wrapper.appendChild(row);
    wrapper.appendChild(childrenContainer);
    return wrapper;
  }

  return row;
}

/**
 * @param {HTMLElement} container
 * @param {Object} params
 * @param {import('../core/detect-project.js').RootFileEntry[]} params.entries
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {string} [params.defaultBranch='main']
 * @param {import('../services/github-api.js').ApiError | null} [params.error]
 */
export function renderFiles(container, { entries = [], owner, repo, defaultBranch = 'main', error = null }) {
  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'file-matrix-container';

  const dirCount = entries.filter((e) => e.type === 'dir').length;
  const fileCount = entries.filter((e) => e.type !== 'dir').length;

  // Header Bar
  const header = document.createElement('div');
  header.className = 'panel-header-bar';
  header.innerHTML = `
    <div class="panel-header-left">
      <span class="panel-id-label">MODULE // 02_ROOT_DIRECTORY_TREE</span>
      <span class="badge-tag">[DIRS: ${dirCount}]</span>
      <span class="badge-tag">[FILES: ${fileCount}]</span>
    </div>
    <div class="panel-header-right">
      <a href="https://github.com/${owner}/${repo}/tree/${defaultBranch}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
        RAW_TREE ↗
      </a>
    </div>
  `;
  panel.appendChild(header);

  // Search filter bar
  const filterBar = document.createElement('div');
  filterBar.className = 'file-filter-bar';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'matrix-search-input';
  searchInput.placeholder = 'FILTER_FILENAME...';
  searchInput.setAttribute('aria-label', 'Filter root files by name');

  const rowsContainer = document.createElement('div');
  rowsContainer.className = 'file-rows-stack';

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const rows = rowsContainer.querySelectorAll('.file-row-item');
    rows.forEach((r) => {
      const name = r.dataset.name || '';
      if (!term || name.includes(term)) {
        r.style.display = 'flex';
      } else {
        r.style.display = 'none';
      }
    });
  });

  filterBar.appendChild(searchInput);
  filterBar.innerHTML += '<span class="text-dim" style="font-family: var(--font-mono); font-size: 11px;">SORT: DIRS_FIRST // ALPHA</span>';
  filterBar.prepend(searchInput);
  panel.appendChild(filterBar);

  if (error) {
    const errorBox = document.createElement('div');
    errorBox.className = 'radar-telemetry-error';
    errorBox.innerHTML = `
      <div class="error-headline">[ERR_FETCH_TREE]</div>
      <div class="error-log-stream">${error.message || 'Could not load root directory entries from GitHub.'}</div>
    `;
    panel.appendChild(errorBox);
  } else if (entries.length === 0) {
    const emptyBox = document.createElement('div');
    emptyBox.className = 'radar-telemetry-error';
    emptyBox.innerHTML = `
      <div class="error-headline">[ROOT_DIRECTORY_EMPTY]</div>
      <p style="color: #737373; font-size: 13px;">No files returned from GitHub API for this repository root.</p>
    `;
    panel.appendChild(emptyBox);
  } else {
    // Sort directories first, then alphabetical
    const sorted = [...entries].sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    sorted.forEach((entry) => {
      rowsContainer.appendChild(createFileRow(entry, owner, repo, defaultBranch, 0));
    });

    panel.appendChild(rowsContainer);
  }

  container.appendChild(panel);
}
