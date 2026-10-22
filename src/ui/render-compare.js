/**
 * INDUSTRIAL MODERNIST DUAL RADAR COMPARISON CONSOLE ("DOGFIGHT MODE")
 * High-density side-by-side architectural and velocity benchmark matrix
 * comparing two GitHub repositories with zero code execution.
 */

import { calculateComparisonMetrics, generateComparisonMarkdown } from '../services/repository-service.js';
import { formatCompactNumber } from '../core/formatters.js';

/**
 * Renders the side-by-side comparison console.
 * @param {HTMLElement} container
 * @param {object} params
 * @param {object} params.dataA - Telemetry for Repository A
 * @param {object} params.dataB - Telemetry for Repository B
 * @param {() => void} params.onBack - Return to single view or landing
 * @param {() => void} [params.onSwap] - Swap A and B positions
 * @param {(repoFullName: string) => void} [params.onExploreSingle] - Drill into single repo
 */
export function renderCompare(container, { dataA, dataB, onBack, onSwap, onExploreSingle }) {
  container.innerHTML = '';

  const repoA = `${dataA.owner}/${dataA.repo}`;
  const repoB = `${dataB.owner}/${dataB.repo}`;
  const metrics = calculateComparisonMetrics(dataA, dataB);

  const compareConsole = document.createElement('div');
  compareConsole.className = 'compare-console';

  // 1. Control Deck Header Bar
  const deckHeader = document.createElement('section');
  deckHeader.className = 'telemetry-deck compare-deck';

  const deckTop = document.createElement('div');
  deckTop.className = 'deck-top-row';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'deck-repo-coords';
  titleGroup.innerHTML = `
    <div class="coords-breadcrumbs">
      <span class="badge-tag badge-tag-nominal"><span class="badge-led"></span>RADAR_DOGFIGHT</span>
      <span class="badge-tag">[DUAL_TELEMETRY_BENCHMARK]</span>
      <h2 class="coords-repo" style="font-size: 1.1rem;">
        <span style="color: #FFFFFF;">${repoA}</span>
        <span style="color: #F59E0B; margin: 0 0.5rem;">VS</span>
        <span style="color: #FFFFFF;">${repoB}</span>
      </h2>
    </div>
  `;
  deckTop.appendChild(titleGroup);

  const actionsGroup = document.createElement('div');
  actionsGroup.className = 'deck-actions';

  // Copy Comparison Markdown
  const copyMdBtn = document.createElement('button');
  copyMdBtn.type = 'button';
  copyMdBtn.className = 'btn btn-secondary btn-sm';
  copyMdBtn.textContent = '[COPY_BENCHMARK_MD]';
  copyMdBtn.addEventListener('click', async () => {
    try {
      const md = generateComparisonMarkdown(dataA, dataB, metrics);
      await navigator.clipboard.writeText(md);
      copyMdBtn.textContent = '[MD_COPIED ✓]';
      setTimeout(() => {
        copyMdBtn.textContent = '[COPY_BENCHMARK_MD]';
      }, 2000);
    } catch {
      copyMdBtn.textContent = '[COPY_FAILED]';
    }
  });
  actionsGroup.appendChild(copyMdBtn);

  // Swap Sides
  if (onSwap) {
    const swapBtn = document.createElement('button');
    swapBtn.type = 'button';
    swapBtn.className = 'btn btn-secondary btn-sm';
    swapBtn.textContent = '[SWAP_SIDES ⇄]';
    swapBtn.title = 'Swap Repository A and B positions';
    swapBtn.addEventListener('click', onSwap);
    actionsGroup.appendChild(swapBtn);
  }

  // Share comparison URL
  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'btn btn-secondary btn-sm';
  shareBtn.textContent = '[SHARE_URL]';
  shareBtn.addEventListener('click', async () => {
    try {
      const url = `${window.location.origin}/?target=${encodeURIComponent(repoA)}&vs=${encodeURIComponent(repoB)}`;
      await navigator.clipboard.writeText(url);
      shareBtn.textContent = '[URL_COPIED ✓]';
      setTimeout(() => {
        shareBtn.textContent = '[SHARE_URL]';
      }, 2000);
    } catch {
      shareBtn.textContent = '[COPY_FAILED]';
    }
  });
  actionsGroup.appendChild(shareBtn);

  // Back trigger
  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'btn btn-primary btn-sm';
  backBtn.innerHTML = '← EXIT_COMPARE <span class="keycap">ESC</span>';
  backBtn.addEventListener('click', onBack);
  actionsGroup.appendChild(backBtn);

  deckTop.appendChild(actionsGroup);
  deckHeader.appendChild(deckTop);
  compareConsole.appendChild(deckHeader);

  // 2. High-Density Side-by-Side Comparison Matrix Table
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'compare-table-wrapper';
  tableWrapper.style.backgroundColor = 'var(--bg-surface-1)';
  tableWrapper.style.border = '1px solid var(--border-default)';
  tableWrapper.style.overflowX = 'auto';

  const starDeltaAbs = Math.abs(metrics.starDelta);
  const starAdvantageText =
    metrics.starDelta > 0
      ? `+${formatCompactNumber(starDeltaAbs)} for ${dataA.repo}`
      : metrics.starDelta < 0
      ? `+${formatCompactNumber(starDeltaAbs)} for ${dataB.repo}`
      : 'Equal';

  const issuesAdvantage =
    metrics.issuesA < metrics.issuesB
      ? `Fewer open issues on ${dataA.repo}`
      : metrics.issuesA > metrics.issuesB
      ? `Fewer open issues on ${dataB.repo}`
      : 'Equal';

  const table = document.createElement('table');
  table.className = 'env-matrix-table compare-matrix-table';
  table.style.width = '100%';
  table.innerHTML = `
    <thead>
      <tr>
        <th style="width: 25%;">BENCHMARK_SIGNAL</th>
        <th style="width: 35%; color: #FFFFFF;">${repoA}</th>
        <th style="width: 35%; color: #FFFFFF;">${repoB}</th>
        <th style="width: 15%; text-align: right;">ADVANTAGE</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>COMMUNITY_STARS</strong></td>
        <td><code>${metrics.starsA.toLocaleString()} ★</code></td>
        <td><code>${metrics.starsB.toLocaleString()} ★</code></td>
        <td style="text-align: right;">
          <span class="badge-tag ${metrics.starDelta !== 0 ? 'badge-tag-nominal' : ''}">${starAdvantageText}</span>
        </td>
      </tr>
      <tr>
        <td><strong>FORK_TRACTION</strong></td>
        <td><code>${metrics.forksA.toLocaleString()} 🍴</code></td>
        <td><code>${metrics.forksB.toLocaleString()} 🍴</code></td>
        <td style="text-align: right;">
          <span class="badge-tag">${metrics.forksA >= metrics.forksB ? dataA.repo : dataB.repo}</span>
        </td>
      </tr>
      <tr>
        <td><strong>OPEN_TICKETS</strong></td>
        <td><code>${metrics.issuesA.toLocaleString()}</code></td>
        <td><code>${metrics.issuesB.toLocaleString()}</code></td>
        <td style="text-align: right;">
          <span class="badge-tag badge-tag-info">${issuesAdvantage}</span>
        </td>
      </tr>
      <tr>
        <td><strong>LAST_PUSH_VELOCITY</strong></td>
        <td><code>${metrics.daysA === 0 ? 'Today' : `${metrics.daysA}d ago`}</code> <span class="badge-tag" style="color: ${dataA.pulse?.color}; font-size: 10px;">[${metrics.cadenceA}]</span></td>
        <td><code>${metrics.daysB === 0 ? 'Today' : `${metrics.daysB}d ago`}</code> <span class="badge-tag" style="color: ${dataB.pulse?.color}; font-size: 10px;">[${metrics.cadenceB}]</span></td>
        <td style="text-align: right;">
          <span class="badge-tag ${metrics.winnerVelocity !== 'TIE' ? 'badge-tag-nominal' : ''}">
            ${metrics.winnerVelocity === 'A' ? dataA.repo : metrics.winnerVelocity === 'B' ? dataB.repo : 'Identical'}
          </span>
        </td>
      </tr>
      <tr>
        <td><strong>PROD_DEPENDENCIES</strong></td>
        <td><code>${metrics.depsA} packages</code></td>
        <td><code>${metrics.depsB} packages</code></td>
        <td style="text-align: right;">
          <span class="badge-tag">${metrics.depsA <= metrics.depsB ? `${dataA.repo} (Leaner)` : `${dataB.repo} (Leaner)`}</span>
        </td>
      </tr>
      <tr>
        <td><strong>SPDX_LICENSE</strong></td>
        <td><code>${metrics.licenseA}</code></td>
        <td><code>${metrics.licenseB}</code></td>
        <td style="text-align: right;"><span class="badge-tag">License</span></td>
      </tr>
      <tr>
        <td><strong>FRAMEWORK_SIGNATURE</strong></td>
        <td><code>${dataA.depData?.signatures?.framework || 'Vanilla'}</code></td>
        <td><code>${dataB.depData?.signatures?.framework || 'Vanilla'}</code></td>
        <td style="text-align: right;"><span class="badge-tag">Architecture</span></td>
      </tr>
      <tr>
        <td><strong>BUILD_TOOLCHAIN</strong></td>
        <td><code>${dataA.depData?.signatures?.bundler || 'Standard'}</code></td>
        <td><code>${dataB.depData?.signatures?.bundler || 'Standard'}</code></td>
        <td style="text-align: right;"><span class="badge-tag">Tooling</span></td>
      </tr>
      <tr>
        <td><strong>TEST_HARNESS</strong></td>
        <td><code>${dataA.depData?.signatures?.testRunner || 'None declared'}</code></td>
        <td><code>${dataB.depData?.signatures?.testRunner || 'None declared'}</code></td>
        <td style="text-align: right;"><span class="badge-tag">QA</span></td>
      </tr>
      <tr>
        <td><strong>PRIMARY_RUN_SCRIPT</strong></td>
        <td><code>${dataA.setupGuides?.[0]?.command || 'None'}</code></td>
        <td><code>${dataB.setupGuides?.[0]?.command || 'None'}</code></td>
        <td style="text-align: right;"><span class="badge-tag">Setup</span></td>
      </tr>
    </tbody>
  `;
  tableWrapper.appendChild(table);
  compareConsole.appendChild(tableWrapper);

  // 3. Drill-down Action Bento
  const bentoGrid = document.createElement('div');
  bentoGrid.className = 'hairline-grid-4';
  bentoGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
  bentoGrid.style.marginTop = '1rem';

  const cardA = document.createElement('div');
  cardA.className = 'bento-cell';
  cardA.innerHTML = `
    <div class="bento-eyebrow">
      <span>DRILLDOWN // 01</span>
      <span class="badge-tag badge-tag-nominal">ACTIVE_NODE</span>
    </div>
    <h3 class="bento-title">${repoA}</h3>
    <p class="bento-desc">${dataA.explainer?.overviewExplanation || dataA.metadata?.description || 'Repository overview'}</p>
    <button type="button" class="btn btn-primary btn-sm" id="btn-inspect-a" style="margin-top: 1rem;">
      INSPECT ${dataA.repo.toUpperCase()} EXCLUSIVELY →
    </button>
  `;
  cardA.querySelector('#btn-inspect-a')?.addEventListener('click', () => {
    onExploreSingle?.(repoA);
  });

  const cardB = document.createElement('div');
  cardB.className = 'bento-cell';
  cardB.innerHTML = `
    <div class="bento-eyebrow">
      <span>DRILLDOWN // 02</span>
      <span class="badge-tag badge-tag-nominal">ACTIVE_NODE</span>
    </div>
    <h3 class="bento-title">${repoB}</h3>
    <p class="bento-desc">${dataB.explainer?.overviewExplanation || dataB.metadata?.description || 'Repository overview'}</p>
    <button type="button" class="btn btn-primary btn-sm" id="btn-inspect-b" style="margin-top: 1rem;">
      INSPECT ${dataB.repo.toUpperCase()} EXCLUSIVELY →
    </button>
  `;
  cardB.querySelector('#btn-inspect-b')?.addEventListener('click', () => {
    onExploreSingle?.(repoB);
  });

  bentoGrid.appendChild(cardA);
  bentoGrid.appendChild(cardB);
  compareConsole.appendChild(bentoGrid);

  container.appendChild(compareConsole);
}
