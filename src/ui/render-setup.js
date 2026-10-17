/**
 * INDUSTRIAL MODERNIST SETUP & BUILD SIGNALS
 * Strict evidence tiers ([DETECTED], [SUGGESTED], [NOT_VERIFIED]),
 * terminal command bars with gutter numbers, and one-click copy triggers.
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
  panel.className = 'setup-module-panel';

  // Panel Header Bar
  const header = document.createElement('div');
  header.className = 'panel-header-bar';
  header.innerHTML = `
    <div class="panel-header-left">
      <span class="panel-id-label">MODULE // 03_SETUP_SIGNALS</span>
      <span class="badge-tag">[SIGNALS: ${guides.length}]</span>
    </div>
    <div class="panel-header-right">
      <span class="badge-tag badge-tag-nominal"><span class="badge-led"></span>DETERMINISTIC</span>
    </div>
  `;
  panel.appendChild(header);

  // Safety Callout Strip
  const safetyStrip = document.createElement('div');
  safetyStrip.className = 'safety-strip';
  safetyStrip.innerHTML = `
    <span class="badge-tag badge-tag-nominal">[POLICY]</span>
    <span>Commands derived strictly from root manifests and lockfiles. Repology never executes, installs, or builds code.</span>
  `;
  panel.appendChild(safetyStrip);

  // Cards Stack
  const stack = document.createElement('div');
  stack.className = 'setup-cards-stack';

  guides.forEach((guide) => {
    const block = document.createElement('div');
    block.className = 'setup-block';

    const blockHeader = document.createElement('div');
    blockHeader.className = 'setup-block-header';

    const titleEl = document.createElement('h4');
    titleEl.className = 'setup-block-title';
    titleEl.textContent = guide.title;
    blockHeader.appendChild(titleEl);

    // Confidence badge in technical bracketed format
    const confTag = document.createElement('span');
    const confClass =
      guide.confidence === 'Detected'
        ? 'badge-tag-nominal'
        : guide.confidence === 'Suggested'
        ? 'badge-tag-info'
        : 'badge-tag-warning';

    confTag.className = `badge-tag ${confClass}`;
    confTag.innerHTML = `<span class="badge-led"></span>[${guide.confidence.toUpperCase().replace(/\s+/g, '_')}]`;
    blockHeader.appendChild(confTag);

    block.appendChild(blockHeader);

    // Command Bar
    if (guide.command) {
      const cmdBar = document.createElement('div');
      cmdBar.className = 'terminal-cmd-bar';

      const gutter = document.createElement('span');
      gutter.className = 'cmd-gutter-num';
      gutter.textContent = '01 $';
      cmdBar.appendChild(gutter);

      const code = document.createElement('code');
      code.className = 'terminal-cmd-code';
      code.textContent = guide.command;
      cmdBar.appendChild(code);

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-secondary btn-sm';
      copyBtn.innerHTML = '[COPY_CMD]';

      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(guide.command);
          copyBtn.innerHTML = '<span style="color: #10B981;">[COPIED_OK ✓]</span>';
          copyBtn.classList.add('btn-success');
          setTimeout(() => {
            copyBtn.innerHTML = '[COPY_CMD]';
            copyBtn.classList.remove('btn-success');
          }, 2000);
        } catch {
          copyBtn.textContent = '[COPY_FAILED]';
        }
      });

      cmdBar.appendChild(copyBtn);
      block.appendChild(cmdBar);
    }

    // Metadata Row
    const metaRow = document.createElement('div');
    metaRow.className = 'setup-meta-row';

    if (guide.evidence) {
      const evSpan = document.createElement('span');
      evSpan.innerHTML = `EVIDENCE: <span class="setup-evidence-val">${guide.evidence}</span>`;
      metaRow.appendChild(evSpan);
    }

    if (guide.note) {
      const noteSpan = document.createElement('span');
      noteSpan.className = 'setup-note-text';
      noteSpan.textContent = `// ${guide.note}`;
      metaRow.appendChild(noteSpan);
    }

    if (guide.sourceUrl) {
      const linkSpan = document.createElement('span');
      linkSpan.innerHTML = `<a href="${guide.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: #EDEDED; text-decoration: underline;">SOURCE_FILE ↗</a>`;
      metaRow.appendChild(linkSpan);
    }

    block.appendChild(metaRow);
    stack.appendChild(block);
  });

  panel.appendChild(stack);
  container.appendChild(panel);
}
