/**
 * Landing page component:
 * - Brand wordmark and clear value proposition
 * - Accessible form with visible label, inline validation live region
 * - Pre-filled sample repositories
 * - Transparent privacy and read-only badges
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

  const landingWrapper = document.createElement('div');
  landingWrapper.className = 'landing-wrapper';

  // Hero Section
  const hero = document.createElement('section');
  hero.className = 'landing-hero';

  const badgeRow = document.createElement('div');
  badgeRow.className = 'landing-badge-row';
  badgeRow.innerHTML = `
    <span class="pill pill-accent">Open Source Repository Orientation</span>
    <span class="pill pill-neutral">Read-only MVP</span>
  `;
  hero.appendChild(badgeRow);

  const headline = document.createElement('h1');
  headline.className = 'landing-headline';
  headline.textContent = 'Get oriented in any open-source repo.';
  hero.appendChild(headline);

  const subline = document.createElement('p');
  subline.className = 'landing-subline';
  subline.textContent = 'A clear first map of the code, setup signals, and contribution links. Grounded in evidence, not hallucinated summaries.';
  hero.appendChild(subline);

  // Form Section
  const formCard = document.createElement('div');
  formCard.className = 'landing-form-card';

  const form = document.createElement('form');
  form.className = 'repo-form';
  form.noValidate = true;

  const label = document.createElement('label');
  label.htmlFor = 'repo-url-input';
  label.className = 'form-label';
  label.textContent = 'GitHub Repository URL or owner/repo';

  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';

  const input = document.createElement('input');
  input.id = 'repo-url-input';
  input.name = 'repoUrl';
  input.type = 'text';
  input.className = 'form-input form-input-lg';
  input.placeholder = 'e.g. vitejs/vite or https://github.com/expressjs/express';
  input.value = initialValue;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-describedby', 'input-hint input-error');

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary btn-lg submit-btn';
  submitBtn.textContent = 'Explore repository';

  inputGroup.appendChild(input);
  inputGroup.appendChild(submitBtn);

  const errorContainer = document.createElement('div');
  errorContainer.id = 'input-error';
  errorContainer.className = 'form-error';
  errorContainer.setAttribute('aria-live', 'polite');
  if (initialError) {
    errorContainer.textContent = initialError;
    input.classList.add('form-input-error');
  }

  const hintContainer = document.createElement('div');
  hintContainer.id = 'input-hint';
  hintContainer.className = 'form-hint';
  hintContainer.innerHTML = 'Supports <code>owner/repo</code>, full GitHub URLs, and trailing <code>.git</code>. Public repositories only.';

  form.appendChild(label);
  form.appendChild(inputGroup);
  form.appendChild(errorContainer);
  form.appendChild(hintContainer);
  formCard.appendChild(form);

  // Quick sample repositories
  const samplesRow = document.createElement('div');
  samplesRow.className = 'sample-repos-row';

  const sampleLabel = document.createElement('span');
  sampleLabel.className = 'sample-label';
  sampleLabel.textContent = 'Try a sample repository:';
  samplesRow.appendChild(sampleLabel);

  const samples = [
    { name: 'vitejs/vite', lang: 'TypeScript' },
    { name: 'expressjs/express', lang: 'JavaScript' },
    { name: 'fastapi/fastapi', lang: 'Python' },
    { name: 'golang/go', lang: 'Go' },
  ];

  samples.forEach((sample) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'sample-chip';
    chip.innerHTML = `<code>${sample.name}</code> <span class="sample-chip-lang">${sample.lang}</span>`;
    chip.addEventListener('click', () => {
      input.value = sample.name;
      errorContainer.textContent = '';
      input.classList.remove('form-input-error');
      onSubmit(sample.name);
    });
    samplesRow.appendChild(chip);
  });

  formCard.appendChild(samplesRow);
  hero.appendChild(formCard);

  // Privacy and honesty reassurance
  const trustBar = document.createElement('div');
  trustBar.className = 'landing-trust-bar';
  trustBar.innerHTML = `
    <div class="trust-item"><span class="trust-icon" aria-hidden="true">🔒</span> Read-only</div>
    <div class="trust-item"><span class="trust-icon" aria-hidden="true">🚫</span> No sign-in or tokens</div>
    <div class="trust-item"><span class="trust-icon" aria-hidden="true">⚡</span> Zero code execution</div>
    <div class="trust-item"><span class="trust-icon" aria-hidden="true">🌐</span> Directly queries GitHub REST API</div>
  `;
  hero.appendChild(trustBar);

  landingWrapper.appendChild(hero);

  // Feature Highlights Grid
  const featuresSection = document.createElement('section');
  featuresSection.className = 'landing-features';

  const features = [
    {
      icon: '🧭',
      title: 'Top-Level Orientation',
      desc: 'See repository metadata, primary language, license, branch structure, and root-level directories in one clear map.',
    },
    {
      icon: '⚡',
      title: 'Honest Setup Guidance',
      desc: 'Identifies package managers and scripts from detected files. Commands are strictly categorized as Detected, Suggested, or Not verified.',
    },
    {
      icon: '🤝',
      title: 'Safe First Step for Contributors',
      desc: 'Jump directly to open issues, good first issues, pull requests, and contributing guidelines without digging through folders.',
    },
  ];

  features.forEach((feat) => {
    const col = document.createElement('div');
    col.className = 'feature-card';
    col.innerHTML = `
      <div class="feature-icon" aria-hidden="true">${feat.icon}</div>
      <h3 class="feature-title">${feat.title}</h3>
      <p class="feature-desc">${feat.desc}</p>
    `;
    featuresSection.appendChild(col);
  });

  landingWrapper.appendChild(featuresSection);

  // Form submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) {
      errorContainer.textContent = 'Enter a GitHub repository URL or owner/repo, such as vitejs/vite.';
      input.classList.add('form-input-error');
      input.focus();
      return;
    }
    errorContainer.textContent = '';
    input.classList.remove('form-input-error');
    onSubmit(val);
  });

  input.addEventListener('input', () => {
    if (errorContainer.textContent) {
      errorContainer.textContent = '';
      input.classList.remove('form-input-error');
    }
  });

  container.appendChild(landingWrapper);
}
