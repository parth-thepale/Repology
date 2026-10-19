/**
 * INDUSTRIAL MODERNIST ENVIRONMENT & CONFIGURATION RADAR
 * Renders module 06 // ENV_&_CONFIG
 * Interactive variable matrix, sensitive secret flags, and one-click .env.local generator.
 */

import { generateEnvLocalBoilerplate } from '../core/env-decoder.js';

/**
 * Render the Environment & Secrets Radar into the provided panel container.
 * @param {HTMLElement} container
 * @param {object} params
 * @param {object} params.envData - Output from env-decoder.js
 * @param {string} params.owner
 * @param {string} params.repo
 */
export function renderEnv(container, { envData, owner, repo }) {
  container.innerHTML = '';

  const {
    hasEnvFile = false,
    fileName = '.env.example',
    entries = [],
    secretCount = 0,
    totalCount = 0,
    isInferred = false,
  } = envData || {};

  const envConsole = document.createElement('div');
  envConsole.className = 'env-console';

  // 1. Panel Header Bar
  const headerBar = document.createElement('div');
  headerBar.className = 'panel-header-bar';
  headerBar.innerHTML = `
    <div class="panel-header-left">
      <span class="panel-id-label">MODULE // 06_CONFIG_&_ENVIRONMENT_RADAR</span>
      <span class="badge-tag">${hasEnvFile ? `[SOURCE: ${fileName}]` : isInferred ? '[SOURCE: INFERRED_FROM_CODE]' : '[NO_CONFIG_FILE]'}</span>
      <span class="badge-tag badge-tag-nominal">[VARIABLES: ${totalCount}]</span>
      ${secretCount > 0 ? `<span class="badge-tag badge-tag-critical"><span class="badge-led"></span>${secretCount}_SECRETS_REQUIRED</span>` : ''}
    </div>
    <div class="panel-header-right">
      <span class="badge-tag">[KEYBINDS_ACTIVE: 1-7]</span>
    </div>
  `;
  envConsole.appendChild(headerBar);

  // 2. Action Toolbar & Generator Bar
  const actionCard = document.createElement('div');
  actionCard.className = 'env-action-card';

  const actionInfo = document.createElement('div');
  actionInfo.className = 'env-action-info';
  actionInfo.innerHTML = `
    <div class="env-action-title">
      <span>ENVIRONMENT_BLUEPRINT // LOCAL_DEV_ORCHESTRATION</span>
      ${hasEnvFile ? '<span class="badge-tag badge-tag-nominal">TEMPLATE_VERIFIED</span>' : '<span class="badge-tag badge-tag-warning">HEURISTIC_SCAN</span>'}
    </div>
    <p class="env-action-desc">
      ${hasEnvFile
        ? `Parsed directly from <code>${fileName}</code>. Generate a zero-friction <code>.env.local</code> configuration file with pre-populated placeholders for your workspace.`
        : 'No <code>.env.example</code> detected in the root tree. The variables below were scanned from script references and manifests.'}
    </p>
  `;
  actionCard.appendChild(actionInfo);

  const actionButtons = document.createElement('div');
  actionButtons.className = 'env-action-buttons';

  // One-Click Generate .env.local button
  const genBtn = document.createElement('button');
  genBtn.type = 'button';
  genBtn.className = 'btn btn-primary btn-sm';
  genBtn.innerHTML = '⚡ GENERATE .env.local';
  genBtn.title = 'Copy complete .env.local file template with placeholders to clipboard';
  genBtn.disabled = entries.length === 0;

  genBtn.addEventListener('click', async () => {
    try {
      const boilerplate = generateEnvLocalBoilerplate(entries, `${owner}/${repo}`);
      await navigator.clipboard.writeText(boilerplate);
      genBtn.innerHTML = '✓ .env.local COPIED!';
      setTimeout(() => {
        genBtn.innerHTML = '⚡ GENERATE .env.local';
      }, 2500);
    } catch {
      genBtn.innerHTML = 'COPY_FAILED';
    }
  });
  actionButtons.appendChild(genBtn);

  // Copy Keys Only Button
  const copyKeysBtn = document.createElement('button');
  copyKeysBtn.type = 'button';
  copyKeysBtn.className = 'btn btn-secondary btn-sm';
  copyKeysBtn.textContent = '[COPY_KEY_LIST]';
  copyKeysBtn.title = 'Copy all environment variable names';
  copyKeysBtn.disabled = entries.length === 0;

  copyKeysBtn.addEventListener('click', async () => {
    try {
      const keysText = entries.map((e) => e.key).join('\n');
      await navigator.clipboard.writeText(keysText);
      copyKeysBtn.textContent = '[KEYS_COPIED ✓]';
      setTimeout(() => {
        copyKeysBtn.textContent = '[COPY_KEY_LIST]';
      }, 2000);
    } catch {
      copyKeysBtn.textContent = '[COPY_FAILED]';
    }
  });
  actionButtons.appendChild(copyKeysBtn);

  actionCard.appendChild(actionButtons);
  envConsole.appendChild(actionCard);

  // 3. Variables Table or Empty State
  if (entries.length > 0) {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'env-table-wrapper';

    const table = document.createElement('table');
    table.className = 'env-matrix-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>VARIABLE_KEY</th>
          <th>TYPE_CLASSIFICATION</th>
          <th>SAMPLE_DEFAULT</th>
          <th>NOTES & PURPOSE</th>
          <th style="text-align: right;">QUICK_COPY</th>
        </tr>
      </thead>
      <tbody>
        ${entries
          .map((entry) => {
            const isSecret = entry.type.isSecret;
            const displayVal = isSecret && entry.value
              ? '••••••••••••'
              : entry.value
              ? entry.value
              : '<span class="text-muted">&lt;unset&gt;</span>';

            return `
              <tr>
                <td class="env-key-cell">
                  <code>${entry.key}</code>
                </td>
                <td>
                  <span class="badge-tag ${entry.type.badgeClass}">${entry.type.label}</span>
                </td>
                <td class="env-val-cell">
                  <code>${displayVal}</code>
                </td>
                <td class="env-notes-cell">
                  ${entry.comment || (isSecret ? 'Required authentication secret' : 'Configuration parameter')}
                </td>
                <td style="text-align: right;">
                  <button type="button" class="btn-copy-entry btn btn-secondary btn-sm" data-key="${entry.key}" data-val="${entry.value}">
                    COPY
                  </button>
                </td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    `;

    // Attach copy handlers for individual rows
    table.querySelectorAll('.btn-copy-entry').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const k = btn.getAttribute('data-key');
        const v = btn.getAttribute('data-val') || '';
        try {
          await navigator.clipboard.writeText(`${k}=${v}`);
          btn.textContent = 'COPIED';
          setTimeout(() => {
            btn.textContent = 'COPY';
          }, 1500);
        } catch {
          btn.textContent = 'ERR';
        }
      });
    });

    tableWrapper.appendChild(table);
    envConsole.appendChild(tableWrapper);
  } else {
    // Clean Technical Empty State
    const emptyState = document.createElement('div');
    emptyState.className = 'env-empty-state';
    emptyState.innerHTML = `
      <div class="env-empty-icon">⚲</div>
      <div class="env-empty-title">NO_CONFIGURATION_TEMPLATE_DETECTED</div>
      <p class="env-empty-desc">
        This repository does not declare a <code>.env.example</code>, <code>.env.sample</code>, or explicit runtime environment keys in its root manifests.
      </p>
      <div class="env-empty-guidance">
        <span class="env-guidance-heading">DEVELOPER_NOTES:</span>
        <ul>
          <li>The project may run out-of-the-box using purely hardcoded internal defaults.</li>
          <li>If local startup fails with connection errors, check documentation for required database, port, or API keys.</li>
        </ul>
      </div>
    `;
    envConsole.appendChild(emptyState);
  }

  container.appendChild(envConsole);
}
