/**
 * Setup guidance panel:
 * - Renders evidence-backed setup cards with explicit confidence tiers:
 *   - "Detected"
 *   - "Suggested"
 *   - "Not verified"
 * - One-click clipboard copy with visible feedback
 * - Clear caveats and warnings for conflicting lockfiles
 */

/**
 * @param {HTMLElement} container
 * @param {Object} params
 * @param {import('../core/setup-guides.js').SetupGuideCard[]} params.guides
 * @param {string} params.owner
 * @param {string} params.repo
 */
export function renderSetup(container, { guides = [], owner, repo }) {
  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'panel-card setup-panel-card';

  // Panel header
  const header = document.createElement('div');
  header.className = 'panel-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'panel-title-group';

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Setup & Build Signals';

  const badge = document.createElement('span');
  badge.className = 'pill pill-neutral';
  badge.textContent = `${guides.length} signal${guides.length === 1 ? '' : 's'}`;

  titleGroup.appendChild(title);
  titleGroup.appendChild(badge);
  header.appendChild(titleGroup);
  panel.appendChild(header);

  // Trust & safety callout
  const banner = document.createElement('div');
  banner.className = 'setup-safety-banner';
  banner.innerHTML = `
    <span class="safety-banner-icon" aria-hidden="true">🛡️</span>
    <span class="safety-banner-text">
      <strong>Source-backed evidence:</strong> Commands are derived strictly from inspected root manifests and scripts.
      Repology never executes, builds, or installs repository code.
    </span>
  `;
  panel.appendChild(banner);

  // Cards container
  const cardsWrapper = document.createElement('div');
  cardsWrapper.className = 'setup-cards-grid';

  guides.forEach((guide) => {
    const card = document.createElement('div');
    card.className = `setup-guide-card ${guide.isWarning ? 'setup-guide-card-warning' : ''}`;

    const cardHeader = document.createElement('div');
    cardHeader.className = 'setup-card-header';

    const cardTitle = document.createElement('h4');
    cardTitle.className = 'setup-card-title';
    cardTitle.textContent = guide.title;
    cardHeader.appendChild(cardTitle);

    // Confidence badge
    const confBadge = document.createElement('span');
    const confClass =
      guide.confidence === 'Detected'
        ? 'pill-success'
        : guide.confidence === 'Suggested'
        ? 'pill-accent'
        : 'pill-warning';
    confBadge.className = `pill ${confClass}`;
    confBadge.textContent = guide.confidence;
    cardHeader.appendChild(confBadge);

    card.appendChild(cardHeader);

    // Command block if present
    if (guide.command) {
      const cmdWrapper = document.createElement('div');
      cmdWrapper.className = 'command-box';

      const codeEl = document.createElement('code');
      codeEl.className = 'command-code';
      codeEl.textContent = guide.command;
      cmdWrapper.appendChild(codeEl);

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-secondary btn-sm copy-btn';
      copyBtn.setAttribute('aria-label', `Copy command: ${guide.command}`);
      copyBtn.innerHTML = '<span class="copy-icon" aria-hidden="true">📋</span> Copy';

      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(guide.command);
          copyBtn.innerHTML = '<span class="copy-icon" aria-hidden="true">✓</span> Copied!';
          copyBtn.classList.add('btn-success');
          setTimeout(() => {
            copyBtn.innerHTML = '<span class="copy-icon" aria-hidden="true">📋</span> Copy';
            copyBtn.classList.remove('btn-success');
          }, 2000);
        } catch {
          copyBtn.textContent = 'Failed to copy';
        }
      });

      cmdWrapper.appendChild(copyBtn);
      card.appendChild(cmdWrapper);
    }

    // Evidence & note metadata
    const metaBox = document.createElement('div');
    metaBox.className = 'setup-card-meta';

    if (guide.evidence) {
      const evLine = document.createElement('div');
      evLine.className = 'setup-meta-line';
      evLine.innerHTML = `<span class="meta-label">Evidence:</span> <span class="meta-value">${guide.evidence}</span>`;
      metaBox.appendChild(evLine);
    }

    if (guide.note) {
      const noteLine = document.createElement('div');
      noteLine.className = 'setup-meta-note';
      noteLine.textContent = guide.note;
      metaBox.appendChild(noteLine);
    }

    if (guide.sourceUrl) {
      const linkLine = document.createElement('div');
      linkLine.className = 'setup-meta-link';
      linkLine.innerHTML = `<a href="${guide.sourceUrl}" target="_blank" rel="noopener noreferrer">View file on GitHub ↗</a>`;
      metaBox.appendChild(linkLine);
    }

    card.appendChild(metaBox);
    cardsWrapper.appendChild(card);
  });

  panel.appendChild(cardsWrapper);
  container.appendChild(panel);
}
