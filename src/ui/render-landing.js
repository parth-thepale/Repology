/**
 * INDUSTRIAL MODERNIST LANDING CONSOLE
 * High-density blueprint with clear human value proposition:
 * "Every repository has a story. Understand it before you open the code."
 * Supports one-click iconic presets and instant 0ms offline demo mode.
 */

import { APP_CONFIG } from '../core/config.js';

/**
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {(url: string) => void} options.onSubmit
 * @param {() => void} [options.onLoadDemo]
 * @param {string} [options.initialValue='']
 * @param {string} [options.initialError='']
 */
export function renderLanding(container, { onSubmit, onLoadDemo, initialValue = '', initialError = '' }) {
  container.innerHTML = '';

  const consoleWrapper = document.createElement('div');
  consoleWrapper.className = 'landing-console';

  // Section Blueprint Bar
  const blueprintBar = document.createElement('div');
  blueprintBar.className = 'section-blueprint-bar';
  blueprintBar.innerHTML = `
    <span class="blueprint-eyebrow">00 // REPOSITORY_ORIENTATION_RADAR</span>
    <span class="blueprint-coords">[SYS_GRID: 1440px / 1px_HAIRLINE]</span>
  `;
  consoleWrapper.appendChild(blueprintBar);

  // Hero Section
  const heroBlock = document.createElement('section');
  heroBlock.className = 'hero-block';

  const metaRow = document.createElement('div');
  metaRow.className = 'hero-header-meta';
  metaRow.innerHTML = `
    <span class="badge-tag badge-tag-nominal"><span class="badge-led"></span>ACTIVE_RECON</span>
    <span class="badge-tag">[NO_AUTH_REQUIRED]</span>
    <span class="badge-tag">[READ_ONLY_REST]</span>
    <span class="badge-tag">[HOTKEY: / FOCUS_PROMPT]</span>
  `;
  heroBlock.appendChild(metaRow);

  const headline = document.createElement('h1');
  headline.className = 'hero-headline';
  headline.textContent = APP_CONFIG.tagline;
  heroBlock.appendChild(headline);

  const subline = document.createElement('p');
  subline.className = 'hero-subline';
  subline.textContent = APP_CONFIG.description;
  heroBlock.appendChild(subline);

  // Radar Input Panel with Corner Brackets
  const radarPanel = document.createElement('div');
  radarPanel.className = 'radar-input-panel';

  radarPanel.innerHTML = `
    <span class="corner-tick corner-tl" aria-hidden="true"></span>
    <span class="corner-tick corner-tr" aria-hidden="true"></span>
    <span class="corner-tick corner-bl" aria-hidden="true"></span>
    <span class="corner-tick corner-br" aria-hidden="true"></span>
  `;

  const form = document.createElement('form');
  form.noValidate = true;

  const inputGroup = document.createElement('div');
  inputGroup.className = 'radar-input-group';

  const prefixBox = document.createElement('div');
  prefixBox.className = 'input-prefix-box';

  const promptPrefix = document.createElement('span');
  promptPrefix.className = 'prompt-prefix';
  promptPrefix.textContent = 'gh://github.com/';

  const input = document.createElement('input');
  input.id = 'repo-url-input';
  input.name = 'repoUrl';
  input.type = 'text';
  input.className = 'radar-input';
  input.placeholder = 'owner/repo (e.g. vitejs/vite or full URL)';
  input.value = initialValue;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'GitHub Repository URL or owner/repo shorthand');

  const keycapHint = document.createElement('span');
  keycapHint.className = 'input-keycap-hint';
  keycapHint.innerHTML = '<span class="keycap">ENTER ↵</span>';

  prefixBox.appendChild(promptPrefix);
  prefixBox.appendChild(input);
  prefixBox.appendChild(keycapHint);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary';
  submitBtn.innerHTML = 'EXPLORE_REPO <span class="btn-arrow" aria-hidden="true">→</span>';

  inputGroup.appendChild(prefixBox);
  inputGroup.appendChild(submitBtn);

  if (onLoadDemo) {
    const demoBtn = document.createElement('button');
    demoBtn.type = 'button';
    demoBtn.className = 'btn btn-secondary';
    demoBtn.title = 'Load pre-cached telemetry snapshot immediately with 0 API cost';
    demoBtn.innerHTML = '[LOAD_DEMO // 0ms]';
    demoBtn.addEventListener('click', onLoadDemo);
    inputGroup.appendChild(demoBtn);
  }

  const errorEl = document.createElement('div');
  errorEl.className = 'radar-error';
  errorEl.setAttribute('aria-live', 'polite');
  if (initialError) {
    errorEl.textContent = `[ERR] ${initialError}`;
  }

  const helperNote = document.createElement('div');
  helperNote.style.fontFamily = 'var(--font-mono)';
  helperNote.style.fontSize = '11px';
  helperNote.style.color = 'var(--text-muted)';
  helperNote.style.marginTop = '0.35rem';
  helperNote.innerHTML = 'Supports <code>owner/repo</code>, canonical URL, and <code>.git</code> • Public repositories only • Zero code execution';

  form.appendChild(inputGroup);
  form.appendChild(errorEl);
  form.appendChild(helperNote);
  radarPanel.appendChild(form);

  // Quick-Select Iconic Target Presets
  const presetsRow = document.createElement('div');
  presetsRow.className = 'presets-row';

  const presetLabel = document.createElement('span');
  presetLabel.className = 'presets-label';
  presetLabel.textContent = 'ICONIC_TARGET_PRESETS:';
  presetsRow.appendChild(presetLabel);

  const presets = [
    { label: '[LOAD: vitejs/vite]', repo: 'vitejs/vite' },
    { label: '[LOAD: vercel/next.js]', repo: 'vercel/next.js' },
    { label: '[LOAD: facebook/react]', repo: 'facebook/react' },
    { label: '[LOAD: torvalds/linux]', repo: 'torvalds/linux' },
    { label: '[LOAD: fastapi/fastapi]', repo: 'fastapi/fastapi' },
  ];

  presets.forEach((p) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'preset-chip';
    chip.textContent = p.label;
    chip.addEventListener('click', () => {
      input.value = p.repo;
      errorEl.textContent = '';
      onSubmit(p.repo);
    });
    presetsRow.appendChild(chip);
  });

  radarPanel.appendChild(presetsRow);
  heroBlock.appendChild(radarPanel);
  consoleWrapper.appendChild(heroBlock);

  // Hairline Bento Grid - High-clarity value propositions
  const bentoGrid = document.createElement('section');
  bentoGrid.className = 'hairline-grid-4';

  const specs = [
    {
      idx: '01 // TECH_STACK',
      title: 'Language & Manifest Detection',
      desc: 'Discovers package managers and build tools from root files (npm, cargo, pip, go) rather than guessing from descriptions.',
    },
    {
      idx: '02 // ROOT_TREE',
      title: 'Navigable File Architecture',
      desc: 'Instant visual map of repository layout. Expand folders on demand with direct links to GitHub source lines.',
    },
    {
      idx: '03 // SETUP_SIGNALS',
      title: 'Honest Setup & Run Commands',
      desc: 'Reads actual package.json scripts and lockfiles. Clearly labels commands as Detected, Suggested, or Not verified.',
    },
    {
      idx: '04 // ENTRY_POINTS',
      title: 'Contribution Opportunities',
      desc: 'Jump directly to open issues, beginner-friendly "good first issue" tags, pull requests, and contributing rules.',
    },
  ];

  specs.forEach((s) => {
    const cell = document.createElement('div');
    cell.className = 'bento-cell';
    cell.innerHTML = `
      <div class="bento-eyebrow">
        <span>${s.idx}</span>
        <span class="badge-led"></span>
      </div>
      <h3 class="bento-title">${s.title}</h3>
      <p class="bento-desc">${s.desc}</p>
    `;
    bentoGrid.appendChild(cell);
  });

  consoleWrapper.appendChild(bentoGrid);

  // Form submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) {
      errorEl.textContent = '[ERR] Enter a GitHub repository URL or owner/repo, such as vitejs/vite.';
      input.focus();
      return;
    }
    errorEl.textContent = '';
    onSubmit(val);
  });

  input.addEventListener('input', () => {
    if (errorEl.textContent) {
      errorEl.textContent = '';
    }
  });

  container.appendChild(consoleWrapper);
}
