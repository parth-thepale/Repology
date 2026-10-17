/**
 * File explorer component:
 * - Renders sorted root directories and files with icons and sizes
 * - Safe external links directly to GitHub tree/blob paths
 * - Real-time client filter search
 * - P1-01 On-demand lazy folder expansion
 */

import { formatFileSize, getFileIconInfo } from '../core/formatters.js';
import { getRepoContents } from '../services/repository-service.js';

/**
 * Creates a file or directory row element.
 * @param {import('../core/detect-project.js').RootFileEntry} entry
 * @param {string} owner
 * @param {string} repo
 * @param {string} defaultBranch
 * @param {number} [level=0]
 * @returns {HTMLElement}
 */
function createFileRow(entry, owner, repo, defaultBranch, level = 0) {
  const row = document.createElement('div');
  row.className = `file-row ${entry.type === 'dir' ? 'file-row-dir' : 'file-row-file'}`;
  row.style.paddingLeft = `${level * 1.25 + 0.75}rem`;
  row.dataset.name = entry.name.toLowerCase();

  const iconInfo = getFileIconInfo(entry);

  const leftGroup = document.createElement('div');
  leftGroup.className = 'file-row-left';

  // If directory, add expander toggle
  let expandToggle = null;
  if (entry.type === 'dir') {
    expandToggle = document.createElement('button');
    expandToggle.type = 'button';
    expandToggle.className = 'folder-toggle-btn';
    expandToggle.setAttribute('aria-expanded', 'false');
    expandToggle.setAttribute('aria-label', `Expand folder ${entry.name}`);
    expandToggle.textContent = '▶';
    leftGroup.appendChild(expandToggle);
  } else {
    const spacer = document.createElement('span');
    spacer.className = 'folder-toggle-spacer';
    leftGroup.appendChild(spacer);
  }

  const iconEl = document.createElement('span');
  iconEl.className = 'file-icon';
  iconEl.textContent = iconInfo.icon;
  iconEl.setAttribute('aria-hidden', 'true');
  leftGroup.appendChild(iconEl);

  const link = document.createElement('a');
  link.className = 'file-name-link';
  link.textContent = entry.name;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const basePath = entry.path || entry.name;
  const githubType = entry.type === 'dir' ? 'tree' : 'blob';
  link.href = `https://github.com/${owner}/${repo}/${githubType}/${defaultBranch}/${basePath}`;

  leftGroup.appendChild(link);
  row.appendChild(leftGroup);

  const rightGroup = document.createElement('div');
  rightGroup.className = 'file-row-right';

  const badge = document.createElement('span');
  badge.className = 'file-category-badge';
  badge.textContent = iconInfo.label;
  rightGroup.appendChild(badge);

  const sizeEl = document.createElement('span');
  sizeEl.className = 'file-size';
  sizeEl.textContent = entry.type === 'dir' ? '' : formatFileSize(entry.size);
  rightGroup.appendChild(sizeEl);

  row.appendChild(rightGroup);

  // Lazy child container for directory expansion
  if (entry.type === 'dir') {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'folder-children-container';
    childrenContainer.style.display = 'none';

    let isLoaded = false;
    let isExpanded = false;

    expandToggle.addEventListener('click', async (e) => {
      e.stopPropagation();
      isExpanded = !isExpanded;
      expandToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      expandToggle.textContent = isExpanded ? '▼' : '▶';

      if (isExpanded) {
        childrenContainer.style.display = 'block';

        if (!isLoaded) {
          const loadingNotice = document.createElement('div');
          loadingNotice.className = 'file-loading-notice';
          loadingNotice.style.paddingLeft = `${(level + 1) * 1.25 + 0.75}rem`;
          loadingNotice.textContent = 'Loading directory contents...';
          childrenContainer.appendChild(loadingNotice);

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
            const emptyNotice = document.createElement('div');
            emptyNotice.className = 'file-empty-notice';
            emptyNotice.style.paddingLeft = `${(level + 1) * 1.25 + 0.75}rem`;
            emptyNotice.textContent = 'Directory is empty.';
            childrenContainer.appendChild(emptyNotice);
          } else {
            const errNotice = document.createElement('div');
            errNotice.className = 'file-error-notice';
            errNotice.style.paddingLeft = `${(level + 1) * 1.25 + 0.75}rem`;
            errNotice.textContent = 'Could not load directory contents from GitHub.';
            childrenContainer.appendChild(errNotice);
          }
        }
      } else {
        childrenContainer.style.display = 'none';
      }
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'folder-group-wrapper';
    wrapper.appendChild(row);
    wrapper.appendChild(childrenContainer);
    return wrapper;
  }

  return row;
}

/**
 * Renders the file explorer panel.
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
  panel.className = 'panel-card files-panel-card';

  // Header
  const header = document.createElement('div');
  header.className = 'panel-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'panel-title-group';

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Root Directory Structure';

  const dirCount = entries.filter((e) => e.type === 'dir').length;
  const fileCount = entries.filter((e) => e.type !== 'dir').length;

  const countBadge = document.createElement('span');
  countBadge.className = 'pill pill-neutral';
  countBadge.textContent = `${dirCount} folders, ${fileCount} files`;

  titleGroup.appendChild(title);
  titleGroup.appendChild(countBadge);
  header.appendChild(titleGroup);

  // Search filter and external GitHub link
  const actions = document.createElement('div');
  actions.className = 'files-actions';

  if (entries.length > 0) {
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'form-input file-filter-input';
    searchInput.placeholder = 'Filter root files...';
    searchInput.setAttribute('aria-label', 'Filter root files by name');

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      const rows = listWrapper.querySelectorAll('.file-row');
      rows.forEach((r) => {
        const name = r.dataset.name || '';
        if (!term || name.includes(term)) {
          r.style.display = 'flex';
        } else {
          r.style.display = 'none';
        }
      });
    });

    actions.appendChild(searchInput);
  }

  const browseBtn = document.createElement('a');
  browseBtn.className = 'btn btn-secondary btn-sm';
  browseBtn.href = `https://github.com/${owner}/${repo}/tree/${defaultBranch}`;
  browseBtn.target = '_blank';
  browseBtn.rel = 'noopener noreferrer';
  browseBtn.textContent = 'Browse on GitHub ↗';
  actions.appendChild(browseBtn);

  header.appendChild(actions);
  panel.appendChild(header);

  // Contents
  const listWrapper = document.createElement('div');
  listWrapper.className = 'files-list-wrapper';

  if (error) {
    const errorBox = document.createElement('div');
    errorBox.className = 'empty-state-box';
    errorBox.innerHTML = `
      <div class="empty-state-icon">⚠️</div>
      <h4 class="empty-state-title">Directory listing unavailable</h4>
      <p class="empty-state-text">${error.message || 'Could not load root directory entries from GitHub.'}</p>
    `;
    panel.appendChild(errorBox);
  } else if (entries.length === 0) {
    const emptyBox = document.createElement('div');
    emptyBox.className = 'empty-state-box';
    emptyBox.innerHTML = `
      <div class="empty-state-icon">📂</div>
      <h4 class="empty-state-title">No top-level files returned</h4>
      <p class="empty-state-text">The repository root has no files or the repository is empty.</p>
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
      listWrapper.appendChild(createFileRow(entry, owner, repo, defaultBranch, 0));
    });

    panel.appendChild(listWrapper);
  }

  container.appendChild(panel);
}
