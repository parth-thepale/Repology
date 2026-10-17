/**
 * INDUSTRIAL MODERNIST README TERMINAL
 * DOMPurify-sanitized markdown terminal with TOC jump rack,
 * [RAW] / [PARSED] view toggles, and safe GitHub links.
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  gfm: true,
  breaks: true,
});

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

export function sanitizeReadmeHtml(rawHtml) {
  const purifier = getPurifier();
  return purifier.sanitize(rawHtml, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|#|\/)/i,
    ADD_ATTR: ['target', 'rel'],
  });
}

export function rewriteRelativeGithubLinks(html, owner, repo, defaultBranch = 'main') {
  if (!owner || !repo || !html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const githubBlobBase = `https://github.com/${owner}/${repo}/blob/${defaultBranch}/`;
  const githubRawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/`;

  const links = doc.querySelectorAll('a');
  links.forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');

    const href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#')) return;

    if (/^(?:javascript|data|vbscript):/i.test(href)) {
      a.removeAttribute('href');
      return;
    }

    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:')) {
      const cleanPath = href.replace(/^\.\//, '').replace(/^\/+/, '');
      a.setAttribute('href', `${githubBlobBase}${cleanPath}`);
    }
  });

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

  const panel = document.createElement('div');
  panel.className = 'readme-terminal-panel';

  // Panel Header Bar
  const header = document.createElement('div');
  header.className = 'panel-header-bar';

  const leftGroup = document.createElement('div');
  leftGroup.className = 'panel-header-left';
  leftGroup.innerHTML = `
    <span class="panel-id-label">MODULE // 04_README_TERMINAL</span>
    <span class="badge-tag">${readmeText ? '[BUFFER: SANITIZED_GFM]' : '[BUFFER: EMPTY]'}</span>
  `;
  header.appendChild(leftGroup);

  const actions = document.createElement('div');
  actions.className = 'panel-header-right';

  if (readmeText) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn-secondary btn-sm';
    toggleBtn.textContent = '[MODE: RAW]';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-secondary btn-sm';
    copyBtn.textContent = '[COPY_RAW]';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(readmeText);
        copyBtn.textContent = '[COPIED_OK ✓]';
        setTimeout(() => {
          copyBtn.textContent = '[COPY_RAW]';
        }, 2000);
      } catch {
        copyBtn.textContent = '[COPY_FAILED]';
      }
    });

    const ghLink = document.createElement('a');
    ghLink.className = 'btn btn-secondary btn-sm';
    ghLink.href = `https://github.com/${owner}/${repo}#readme`;
    ghLink.target = '_blank';
    ghLink.rel = 'noopener noreferrer';
    ghLink.textContent = 'GH_README ↗';

    actions.appendChild(toggleBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(ghLink);
    header.appendChild(actions);
    panel.appendChild(header);

    // Markdown sanitization
    let sanitizedHtml = '';
    try {
      const rawParsed = marked.parse(readmeText);
      const clean = sanitizeReadmeHtml(rawParsed);
      sanitizedHtml = rewriteRelativeGithubLinks(clean, owner, repo, defaultBranch);
    } catch {
      sanitizedHtml = `<pre class="readme-raw-pre">${readmeText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    }

    // TOC Section Navigation Rack
    const headings = extractHeadings(sanitizedHtml);
    if (headings.length > 2) {
      const tocRack = document.createElement('div');
      tocRack.className = 'readme-toc-rack';
      tocRack.innerHTML = '<span class="toc-label">TOC // JUMP:</span>';

      headings.slice(0, 6).forEach((h) => {
        const chip = document.createElement('a');
        chip.className = 'toc-chip';
        chip.href = `#${h.id}`;
        chip.textContent = `[${h.text.toUpperCase().slice(0, 24)}]`;
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          const target = panel.querySelector(`[id="${h.id}"]`) ||
            Array.from(panel.querySelectorAll('h1, h2, h3')).find((el) => el.textContent.trim() === h.text);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.setAttribute('tabindex', '-1');
            target.focus();
          }
        });
        tocRack.appendChild(chip);
      });

      panel.appendChild(tocRack);
    }

    // Scrollable Viewport
    const viewport = document.createElement('div');
    viewport.className = 'terminal-scroll-viewport';

    const renderedDiv = document.createElement('div');
    renderedDiv.className = 'markdown-body';
    renderedDiv.innerHTML = sanitizedHtml;

    renderedDiv.querySelectorAll('h1, h2, h3').forEach((h, idx) => {
      if (!h.id) h.id = `readme-h-${idx}`;
    });

    const rawPre = document.createElement('pre');
    rawPre.className = 'readme-raw-pre';
    rawPre.style.display = 'none';
    rawPre.textContent = readmeText;

    let isRaw = false;
    toggleBtn.addEventListener('click', () => {
      isRaw = !isRaw;
      if (isRaw) {
        renderedDiv.style.display = 'none';
        rawPre.style.display = 'block';
        toggleBtn.textContent = '[MODE: PARSED]';
      } else {
        renderedDiv.style.display = 'block';
        rawPre.style.display = 'none';
        toggleBtn.textContent = '[MODE: RAW]';
      }
    });

    viewport.appendChild(renderedDiv);
    viewport.appendChild(rawPre);
    panel.appendChild(viewport);
  } else {
    // Missing README
    header.appendChild(actions);
    panel.appendChild(header);

    const emptyBox = document.createElement('div');
    emptyBox.className = 'radar-telemetry-error';
    emptyBox.innerHTML = `
      <div class="error-headline">${error && error.status === 404 ? '[README_BUFFER_NOT_FOUND]' : '[README_UNAVAILABLE]'}</div>
      <p style="color: #737373; font-size: 13px; margin-bottom: 1rem;">
        ${error && error.status === 404
          ? 'No README file was detected in the root of the default branch.'
          : 'Could not retrieve README stream from GitHub REST API.'}
      </p>
      <a href="https://github.com/${owner}/${repo}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
        INSPECT_REPO_ROOT ↗
      </a>
    `;
    panel.appendChild(emptyBox);
  }

  container.appendChild(panel);
}
