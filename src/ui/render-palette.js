/**
 * INDUSTRIAL MODERNIST COMMAND PALETTE (CMD+K / QUICK SWITCHER)
 * Keyboard-first command palette for instant module switching,
 * rapid repository exploration, and power-user action triggers.
 */

/**
 * Initializes and manages the hardware command palette overlay.
 * @param {object} params
 * @param {(tabId: string) => void} params.onSelectTab
 * @param {(actionId: string) => void} params.onAction
 * @param {(repoFullName: string) => void} params.onExplore
 * @param {(repoA: string, repoB: string) => void} [params.onCompare]
 * @param {() => string} [params.getCurrentRepo]
 */
export function setupCommandPalette({ onSelectTab, onAction, onExplore, onCompare, getCurrentRepo }) {
  let dialog = document.getElementById('command-palette-dialog');

  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'command-palette-dialog';
    dialog.className = 'technical-modal command-palette-dialog';
    dialog.setAttribute('closedby', 'any');
    dialog.setAttribute('aria-label', 'Command Palette');

    dialog.innerHTML = `
      <div class="modal-box palette-box" style="max-width: 620px; width: calc(100% - 2rem);">
        <div class="palette-input-wrap" style="display: flex; align-items: center; border-bottom: 1px solid var(--border-default); background-color: #030303; padding: 0.5rem 0.75rem;">
          <span style="font-family: var(--font-mono); font-size: 11px; color: #10B981; margin-right: 0.5rem;">[PROMPT]&gt;</span>
          <input
            type="search"
            id="palette-search-input"
            class="palette-input"
            placeholder="Type a repository (e.g. vitejs/vite), module (1-7), or action..."
            style="background: transparent; border: none; color: #FFFFFF; font-family: var(--font-mono); font-size: 13px; width: 100%; outline: none;"
            autocomplete="off"
            spellcheck="false"
          />
          <span class="keycap" style="font-size: 10px;">ESC</span>
        </div>
        <div class="palette-results-list" id="palette-results" style="max-height: 340px; overflow-y: auto; background-color: var(--bg-surface-1);"></div>
        <div class="palette-footer" style="padding: 0.5rem 0.75rem; border-top: 1px solid var(--border-subtle); background-color: #020202; display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);">
          <span>↑↓ NAVIGATE • ↵ SELECT</span>
          <span>REPOLOGY // CONTROL_PALETTE</span>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Backdrop click light-dismiss fallback
    dialog.addEventListener('click', (e) => {
      if (e.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isInside =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInside) {
        close();
      }
    });
  }

  const input = dialog.querySelector('#palette-search-input');
  const resultsContainer = dialog.querySelector('#palette-results');

  const baseCommands = [
    { id: 'tab-overview', type: 'tab', label: '01 // Overview & Explainer', shortcut: '1' },
    { id: 'tab-files', type: 'tab', label: '02 // Root Directory Tree', shortcut: '2' },
    { id: 'tab-setup', type: 'tab', label: '03 // Verified Setup Signals', shortcut: '3' },
    { id: 'tab-readme', type: 'tab', label: '04 // Readme Terminal', shortcut: '4' },
    { id: 'tab-contribute', type: 'tab', label: '05 // Contribute Vectors & Scorecard', shortcut: '5' },
    { id: 'tab-env', type: 'tab', label: '06 // Environment & Secrets Radar', shortcut: '6' },
    { id: 'tab-deps', type: 'tab', label: '07 // Dependency & Supply Chain Audit', shortcut: '7' },
    { id: 'action-gen-env', type: 'action', label: '⚡ Generate .env.local file', shortcut: 'ENV' },
    { id: 'action-copy-md', type: 'action', label: '📋 Copy Executive Markdown Report', shortcut: 'MD' },
    { id: 'action-export-dossier', type: 'action', label: '📄 Download Offline HTML Dossier', shortcut: 'HTML' },
    { id: 'action-badge', type: 'action', label: '🛡️ Copy README Markdown Badge', shortcut: 'BADGE' },
    { id: 'action-compare', type: 'action', label: '⚔️ Dual Radar Comparison (Dogfight)', shortcut: 'VS' },
    { id: 'preset-vite', type: 'preset', label: 'Preset: vitejs/vite', target: 'vitejs/vite' },
    { id: 'preset-next', type: 'preset', label: 'Preset: vercel/next.js', target: 'vercel/next.js' },
    { id: 'preset-react', type: 'preset', label: 'Preset: facebook/react', target: 'facebook/react' },
    { id: 'preset-linux', type: 'preset', label: 'Preset: torvalds/linux', target: 'torvalds/linux' },
    { id: 'preset-fastapi', type: 'preset', label: 'Preset: fastapi/fastapi', target: 'fastapi/fastapi' },
  ];

  let selectedIndex = 0;
  let currentFiltered = [];

  function renderList(query = '') {
    resultsContainer.innerHTML = '';
    const q = query.trim().toLowerCase();

    currentFiltered = [];

    // If query looks like an owner/repo, offer explore option first
    if (q.includes('/')) {
      currentFiltered.push({
        id: 'dynamic-explore',
        type: 'explore',
        label: `EXPLORE_TARGET: ${q}`,
        target: q,
      });
    }

    const matched = baseCommands.filter((cmd) => {
      if (!q) return true;
      return (
        cmd.label.toLowerCase().includes(q) ||
        (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q)) ||
        (cmd.target && cmd.target.toLowerCase().includes(q))
      );
    });

    currentFiltered.push(...matched);

    // If no command matched and query doesn't have slash, offer explore as fallback
    if (!q.includes('/') && matched.length === 0 && q.length > 2) {
      currentFiltered.push({
        id: 'dynamic-explore',
        type: 'explore',
        label: `EXPLORE_TARGET: ${q}`,
        target: q,
      });
    }

    if (currentFiltered.length === 0) {
      const empty = document.createElement('div');
      empty.style.padding = '1.5rem';
      empty.style.textAlign = 'center';
      empty.style.color = 'var(--text-muted)';
      empty.style.fontFamily = 'var(--font-mono)';
      empty.style.fontSize = '12px';
      empty.textContent = '[NO_MATCHING_COMMANDS]';
      resultsContainer.appendChild(empty);
      return;
    }

    if (selectedIndex >= currentFiltered.length) {
      selectedIndex = 0;
    }

    currentFiltered.forEach((cmd, idx) => {
      const row = document.createElement('div');
      row.className = `palette-row ${idx === selectedIndex ? 'selected' : ''}`;
      row.style.padding = '0.55rem 0.85rem';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.cursor = 'pointer';
      row.style.borderBottom = '1px solid #111111';
      row.style.fontFamily = 'var(--font-mono)';
      row.style.fontSize = '12px';
      row.style.backgroundColor = idx === selectedIndex ? '#141414' : 'transparent';
      row.style.borderLeft = idx === selectedIndex ? '2px solid #10B981' : '2px solid transparent';

      row.innerHTML = `
        <span style="color: ${idx === selectedIndex ? '#FFFFFF' : '#B0B0B0'};">${cmd.label}</span>
        ${cmd.shortcut ? `<span class="keycap" style="font-size: 9px;">${cmd.shortcut}</span>` : ''}
      `;

      row.addEventListener('click', () => {
        executeCommand(cmd);
      });

      resultsContainer.appendChild(row);
    });
  }

  function executeCommand(cmd) {
    if (!cmd) return;
    close();

    if (cmd.type === 'tab') {
      onSelectTab(cmd.id);
    } else if (cmd.type === 'action') {
      onAction(cmd.id);
    } else if (cmd.type === 'preset' || cmd.type === 'explore') {
      onExplore(cmd.target);
    }
  }

  input.addEventListener('input', () => {
    selectedIndex = 0;
    renderList(input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentFiltered.length;
      renderList(input.value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + currentFiltered.length) % currentFiltered.length;
      renderList(input.value);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentFiltered[selectedIndex]);
    }
  });

  function open() {
    input.value = '';
    selectedIndex = 0;
    renderList('');
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    input.focus();
  }

  function close() {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  return { open, close };
}
