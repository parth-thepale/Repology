/**
 * Safe formatting helpers for repository data, numbers, dates, and nullable fields.
 */

/**
 * Format numbers into compact strings (e.g. 1200 -> '1.2k', 3450000 -> '3.5M').
 * @param {number | null | undefined} num
 * @returns {string}
 */
export function formatCompactNumber(num) {
  if (num === null || num === undefined || typeof num !== 'number' || isNaN(num)) {
    return '0';
  }
  if (num < 1000) return num.toString();
  if (num < 1000000) {
    const formatted = (num / 1000).toFixed(num >= 10000 ? 0 : 1);
    return `${formatted.replace(/\.0$/, '')}k`;
  }
  const formatted = (num / 1000000).toFixed(1);
  return `${formatted.replace(/\.0$/, '')}M`;
}

/**
 * Format byte sizes into human readable sizes.
 * @param {number | null | undefined} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || typeof bytes !== 'number' || isNaN(bytes)) {
    return '—';
  }
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unit = units[i] || 'B';
  const value = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${value} ${unit}`;
}

/**
 * Render nullable string or fallback to an em dash.
 * @param {string | null | undefined} value
 * @param {string} [fallback='—']
 * @returns {string}
 */
export function formatNullable(value, fallback = '—') {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str.length > 0 ? str : fallback;
}

/**
 * Format date string into human readable format.
 * @param {string | null | undefined} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Returns a suitable icon identifier / emoji or CSS class based on entry type and filename.
 * @param {{ name: string, type: string }} entry
 * @returns {{ icon: string, label: string, category: string }}
 */
export function getFileIconInfo(entry) {
  if (entry.type === 'dir') {
    return { icon: '📁', label: 'Directory', category: 'folder' };
  }
  if (entry.type === 'submodule') {
    return { icon: '📦', label: 'Submodule', category: 'submodule' };
  }
  if (entry.type === 'symlink') {
    return { icon: '🔗', label: 'Symlink', category: 'symlink' };
  }

  const name = entry.name.toLowerCase();

  if (name.startsWith('readme')) {
    return { icon: '📖', label: 'Documentation', category: 'readme' };
  }
  if (name.startsWith('license') || name.startsWith('licence')) {
    return { icon: '⚖️', label: 'License', category: 'license' };
  }
  if (name.startsWith('contributing')) {
    return { icon: '🤝', label: 'Contributing Guide', category: 'contribute' };
  }
  if (name === 'package.json' || name === 'cargo.toml' || name === 'pyproject.toml' || name === 'go.mod' || name === 'pom.xml') {
    return { icon: '⚙️', label: 'Package Manifest', category: 'manifest' };
  }
  if (name.endsWith('.lock') || name.endsWith('-lock.json') || name.endsWith('.lockb') || name.endsWith('.lock.yaml')) {
    return { icon: '🔒', label: 'Lockfile', category: 'lockfile' };
  }
  if (name.endsWith('.js') || name.endsWith('.mjs') || name.endsWith('.cjs')) {
    return { icon: '📄', label: 'JavaScript', category: 'code' };
  }
  if (name.endsWith('.ts') || name.endsWith('.mts') || name.endsWith('.cts')) {
    return { icon: '📄', label: 'TypeScript', category: 'code' };
  }
  if (name.endsWith('.py')) {
    return { icon: '🐍', label: 'Python', category: 'code' };
  }
  if (name.endsWith('.go')) {
    return { icon: '🐹', label: 'Go', category: 'code' };
  }
  if (name.endsWith('.rs')) {
    return { icon: '🦀', label: 'Rust', category: 'code' };
  }
  if (name.endsWith('.html') || name.endsWith('.htm')) {
    return { icon: '🌐', label: 'HTML', category: 'markup' };
  }
  if (name.endsWith('.css') || name.endsWith('.scss') || name.endsWith('.sass')) {
    return { icon: '🎨', label: 'Stylesheet', category: 'style' };
  }
  if (name.endsWith('.json') || name.endsWith('.yaml') || name.endsWith('.yml') || name.endsWith('.toml')) {
    return { icon: '🔧', label: 'Configuration', category: 'config' };
  }
  if (name.endsWith('.md') || name.endsWith('.rst') || name.endsWith('.txt')) {
    return { icon: '📝', label: 'Text/Markdown', category: 'docs' };
  }
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif') || name.endsWith('.svg') || name.endsWith('.webp')) {
    return { icon: '🖼️', label: 'Image', category: 'asset' };
  }
  if (name === 'dockerfile' || name.startsWith('docker-compose') || name === 'compose.yaml') {
    return { icon: '🐳', label: 'Docker Container', category: 'docker' };
  }

  return { icon: '📄', label: 'File', category: 'file' };
}
