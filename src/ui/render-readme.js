/**
 * README rendering module with strict DOMPurify sanitization,
 * safe external link rewrites, relative image path resolution,
 * table-of-contents section navigation, and raw-text fallback view.
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Configure marked options for GitHub Flavored Markdown.
 */
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Returns an instance of DOMPurify for browser or test environments.
 */
function getPurifier() {
  if (typeof window !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
    return DOMPurify;
  }
  if (typeof window !== 'undefined' && typeof DOMPurify === 'function') {
    return DOMPurify(window);
  }
  return {
    sanitize: (html) => html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
  };
}

/**
 * Sanitizes markdown HTML using DOMPurify with strict whitelist settings.
 * @param {string} rawHtml
 * @returns {string}
 */
export function sanitizeReadmeHtml(rawHtml) {
  const purifier = getPurifier();
  return purifier.sanitize(rawHtml, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|#|\/)/i,
    ADD_ATTR: ['target', 'rel'],
  });
}

/**
 * Normalizes relative URLs and image links in sanitized HTML to point safely to GitHub.
 * @param {string} html
 * @param {string} owner
 * @param {string} repo
 * @param {string} defaultBranch
 * @returns {string}
 */
export function rewriteRelativeGithubLinks(html, owner, repo, defaultBranch = 'main') {
  if (!owner || !repo || !html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const githubBlobBase = `https://github.com/${owner}/${repo}/blob/${defaultBranch}/`;
  const githubRawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/`;

  // Fix link targets and relative URLs
  const links = doc.querySelectorAll('a');
  links.forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');

    const href = a.getAttribute('href');
    if (!href) return;

    // Skip in-page hash anchors
    if (href.startsWith('#')) return;

    // Disallow javascript: or unsafe schemes
    if (/^(?:javascript|data|vbscript):/i.test(href)) {
      a.removeAttribute('href');
      return;
    }

    // Relative links rewritten to GitHub blob URLs
    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:')) {
      const cleanPath = href.replace(/^\.\//, '').replace(/^\/+/, '');
      a.setAttribute('href', `${githubBlobBase}${cleanPath}`);
    }
  });

  // Fix relative image links
  const images = doc.querySelectorAll('img');
  images.forEach((img) => {
    img.setAttribute('loading', 'lazy');
    const src = img.getAttribute('src');
    if (!src) return;

    if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
      const cleanPath = src.replace(/^\.\//, '').replace(/^\/+/, '');
      img.setAttribute('src', `${githubRawBase}${cleanPath}`);
    }
  });

  return doc.body.innerHTML;
}

/**
 * Extracts h2/h3 headings from HTML for section navigation.
 * @param {string} html
 * @returns {{ id: string, text: string, level: number }[]}
 */
export function extractHeadings(html) {
  if (!html) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = [];

  doc.querySelectorAll('h1, h2, h3').forEach((heading, idx) => {
    const text = heading.textContent.trim();
    if (!text) return;
    const id = heading.id || `heading-${idx}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    headings.push({
      id,
      text,
      level: parseInt(heading.tagName.substring(1), 10),
    });
  });

  return headings;
}

/**
 * Renders the README preview or fallback into the given container.
 * @param {HTMLElement} container
 * @param {Object} params
 * @param {string | null} params.readmeText
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {string} [params.defaultBranch='main']
 * @param {import('../services/github-api.js').ApiError | null} [params.error]
 */
export function renderReadme(container, { readmeText, owner, repo, defaultBranch = 'main', error = null }) {
  container.innerHTML = '';

  const readmeCard = document.createElement('div');
  readmeCard.className = 'panel-card readme-card';

  // Header with actions
  const header = document.createElement('div');
  header.className = 'readme-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'readme-title-group';

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'README Preview';

  const badge = document.createElement('span');
  badge.className = 'pill pill-neutral';
  badge.textContent = readmeText ? 'Sanitized Markdown' : 'Not found';

  titleGroup.appendChild(title);
  titleGroup.appendChild(badge);
  header.appendChild(titleGroup);

  const actions = document.createElement('div');
  actions.className = 'readme-actions';

  if (readmeText) {
    // View mode toggle (Rendered vs Raw)
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn-secondary btn-sm';
    toggleBtn.textContent = 'Show raw text';
    toggleBtn.setAttribute('aria-pressed', 'false');

    // Copy raw markdown button
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-secondary btn-sm';
    copyBtn.textContent = 'Copy README';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(readmeText);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('btn-success');
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.classList.remove('btn-success');
        }, 2000);
      } catch {
        copyBtn.textContent = 'Failed to copy';
      }
    });

    // GitHub external link
    const ghLink = document.createElement('a');
    ghLink.className = 'btn btn-secondary btn-sm';
    ghLink.href = `https://github.com/${owner}/${repo}#readme`;
    ghLink.target = '_blank';
    ghLink.rel = 'noopener noreferrer';
    ghLink.textContent = 'Open on GitHub ↗';

    actions.appendChild(toggleBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(ghLink);
    header.appendChild(actions);
    readmeCard.appendChild(header);

    // Parse and sanitize markdown
    let sanitizedHtml = '';
    try {
      const rawParsed = marked.parse(readmeText);
      const clean = sanitizeReadmeHtml(rawParsed);
      sanitizedHtml = rewriteRelativeGithubLinks(clean, owner, repo, defaultBranch);
    } catch {
      sanitizedHtml = `<pre class="readme-raw-pre">${readmeText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    }

    // Quick Section TOC navigation (P1-03)
    const headings = extractHeadings(sanitizedHtml);
    if (headings.length > 2) {
      const tocWrapper = document.createElement('nav');
      tocWrapper.className = 'readme-toc';
      tocWrapper.setAttribute('aria-label', 'README table of contents');

      const tocLabel = document.createElement('span');
      tocLabel.className = 'readme-toc-label';
      tocLabel.textContent = 'Jump to:';
      tocWrapper.appendChild(tocLabel);

      const tocList = document.createElement('div');
      tocList.className = 'readme-toc-chips';

      // Show top 6 headings
      headings.slice(0, 6).forEach((h) => {
        const chip = document.createElement('a');
        chip.className = 'readme-toc-chip';
        chip.href = `#${h.id}`;
        chip.textContent = h.text;
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          const target = readmeCard.querySelector(`[id="${h.id}"]`) ||
            Array.from(readmeCard.querySelectorAll('h1, h2, h3')).find((el) => el.textContent.trim() === h.text);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.setAttribute('tabindex', '-1');
            target.focus();
          }
        });
        tocList.appendChild(chip);
      });

      tocWrapper.appendChild(tocList);
      readmeCard.appendChild(tocWrapper);
    }

    // Rendered container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'readme-rendered markdown-body';
    contentContainer.innerHTML = sanitizedHtml;

    // Attach IDs to matching headings for jump links
    contentContainer.querySelectorAll('h1, h2, h3').forEach((h, idx) => {
      if (!h.id) {
        h.id = `readme-h-${idx}`;
      }
    });

    // Raw container
    const rawContainer = document.createElement('pre');
    rawContainer.className = 'readme-raw-pre';
    rawContainer.style.display = 'none';
    rawContainer.textContent = readmeText;

    // Toggle behavior
    let isShowingRaw = false;
    toggleBtn.addEventListener('click', () => {
      isShowingRaw = !isShowingRaw;
      toggleBtn.setAttribute('aria-pressed', isShowingRaw ? 'true' : 'false');
      if (isShowingRaw) {
        contentContainer.style.display = 'none';
        rawContainer.style.display = 'block';
        toggleBtn.textContent = 'Show rendered';
      } else {
        contentContainer.style.display = 'block';
        rawContainer.style.display = 'none';
        toggleBtn.textContent = 'Show raw text';
      }
    });

    readmeCard.appendChild(contentContainer);
    readmeCard.appendChild(rawContainer);
  } else {
    // Empty / Missing README state
    header.appendChild(actions);
    readmeCard.appendChild(header);

    const emptyBox = document.createElement('div');
    emptyBox.className = 'empty-state-box';

    const emptyIcon = document.createElement('div');
    emptyIcon.className = 'empty-state-icon';
    emptyIcon.textContent = '📖';

    const emptyTitle = document.createElement('h4');
    emptyTitle.className = 'empty-state-title';
    emptyTitle.textContent = error && error.status === 404
      ? 'No README found in repository'
      : 'README preview unavailable';

    const emptyDesc = document.createElement('p');
    emptyDesc.className = 'empty-state-text';
    emptyDesc.textContent = error && error.status === 404
      ? 'No README file was found in the default branch. The metadata, file map, and setup signals are still available.'
      : 'The README content could not be retrieved from GitHub. Other repository sections remain accessible.';

    const ghLink = document.createElement('a');
    ghLink.className = 'btn btn-secondary';
    ghLink.href = `https://github.com/${owner}/${repo}`;
    ghLink.target = '_blank';
    ghLink.rel = 'noopener noreferrer';
    ghLink.textContent = 'View repository on GitHub ↗';

    emptyBox.appendChild(emptyIcon);
    emptyBox.appendChild(emptyTitle);
    emptyBox.appendChild(emptyDesc);
    emptyBox.appendChild(ghLink);

    readmeCard.appendChild(emptyBox);
  }

  container.appendChild(readmeCard);
}
