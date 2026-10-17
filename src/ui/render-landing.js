/**
 * INDUSTRIAL MODERNIST LANDING CONSOLE
 * High-density blueprint with prompt input, keycap triggers, corner brackets, and exposed hairline bento grid.
 */

/**
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {(url: string) => void} options.onSubmit
 * @param {string} [options.initialValue='']
 * @param {string} [options.initialError='']
 */
export function renderLanding(container, { onSubmit, initialValue = '', initialError = '' }) {
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
    <span class="badge-tag">[UNAUTHENTICATED_REST]</span>
    <span class="badge-tag">[READ_ONLY]</span>
  `;
  heroBlock.appendChild(metaRow);

  const headline = document.createElement('h1');
  headline.className = 'hero-headline';
  headline.textContent = 'Orient in any public repository. Deterministic facts, zero hallucination.';
  heroBlock.appendChild(headline);

  const subline = document.createElement('p');
  subline.className = 'hero-subline';
  subline.textContent = 'Direct GitHub REST telemetry. Inspect root architecture, detect real manifest signals, view sanitized README markdown, and locate verified contribution entry points without code execution.';
  heroBlock.appendChild(subline);

  // Radar Input Panel with Corner Brackets
  const radarPanel = document.createElement('div');
  radarPanel.className = 'radar-input-panel';

  // Corner Ticks (Blueprint CAD look)
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
  input.placeholder = 'owner/repo (e.g. vitejs/vite)';
  input.value = initialValue;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'GitHub Repository identifier');

  const keycapHint = document.createElement('span');
  keycapHint.className = 'input-keycap-hint';
  keycapHint.innerHTML = '<span class="keycap">ENTER ↵</span>';

  prefixBox.appendChild(promptPrefix);
  prefixBox.appendChild(input);
  prefixBox.appendChild(keycapHint);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary';
  submitBtn.innerHTML = 'ANALYZE_REPO <span class="btn-arrow" aria-hidden="true">→</span>';

  inputGroup.appendChild(prefixBox);
  inputGroup.appendChild(submitBtn);

  const errorEl = document.createElement('div');
  errorEl.className = 'radar-error';
  errorEl.setAttribute('aria-live', 'polite');
  if (initialError) {
    errorEl.textContent = `[ERR] ${initialError}`;
  }

  form.appendChild(inputGroup);
  form.appendChild(errorEl);
  radarPanel.appendChild(form);

  // Preset selector
  const presetsRow = document.createElement('div');
  presetsRow.className = 'presets-row';

  const presetLabel = document.createElement('span');
  presetLabel.className = 'presets-label';
  presetLabel.textContent = 'PRESET_REPOSITORIES:';
  presetsRow.appendChild(presetLabel);

  const presets = [
    { idx: '01', repo: 'vitejs/vite' },
    { idx: '02', repo: 'expressjs/express' },
    { idx: '03', repo: 'fastapi/fastapi' },
    { idx: '04', repo: 'golang/go' },
  ];

  presets.forEach((p) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'preset-chip';
    chip.innerHTML = `<span class="chip-idx">[${p.idx}]</span> ${p.repo}`;
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

  // Hairline Bento Grid (Exposed Structural Honesty)
  const bentoGrid = document.createElement('section');
  bentoGrid.className = 'hairline-grid-4';

  const specs = [
    {
      idx: '01 // TELEMETRY',
      title: 'Fact Extractor',
      desc: 'Pulls raw repository metrics: stars, forks, default branch, licenses, and primary GitHub language without intermediate hallucination.',
    },
    {
      idx: '02 // INTEGRITY',
      title: 'Evidence Verifier',
      desc: 'Parses package.json scripts and lockfiles. Distinguishes verified detected commands from conventional suggestions and warns on conflicting lockfiles.',
    },
    {
      idx: '03 // MATRIX',
      title: 'Root Explorer',
      desc: 'Direct file and directory mapping with on-demand child folder expansion and safe links to GitHub source tree lines.',
    },
    {
      idx: '04 // AIRGAP',
      title: 'Zero Execution',
      desc: 'Untrusted README markdown is strictly sanitized via DOMPurify. Zero script execution, zero OAuth access tokens stored.',
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

  // Form submit event
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
