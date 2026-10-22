import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateComparisonMetrics,
  generateComparisonMarkdown,
  getRepoIssues,
} from '../src/services/repository-service.js';
import { renderCompare } from '../src/ui/render-compare.js';
import { setupCommandPalette } from '../src/ui/render-palette.js';
import { DEMO_SNAPSHOT } from '../src/services/demo-snapshot.js';

describe('Phase 3: Radar Dogfight (Comparison Engine)', () => {
  const mockRepoA = {
    owner: 'vitejs',
    repo: 'vite',
    metadata: {
      stargazers_count: 70000,
      forks_count: 6000,
      open_issues_count: 100,
      license: { spdx_id: 'MIT' },
    },
    pulse: { diffDays: 1, label: 'ACTIVE' },
    depData: { prodCount: 4, signatures: { framework: 'Vite Ecosystem', bundler: 'Rollup' } },
    setupGuides: [{ command: 'pnpm dev' }],
  };

  const mockRepoB = {
    owner: 'webpack',
    repo: 'webpack',
    metadata: {
      stargazers_count: 64000,
      forks_count: 8500,
      open_issues_count: 1200,
      license: { spdx_id: 'MIT' },
    },
    pulse: { diffDays: 10, label: 'STEADY' },
    depData: { prodCount: 25, signatures: { framework: 'Webpack Core', bundler: 'Webpack' } },
    setupGuides: [{ command: 'npm start' }],
  };

  it('calculates comparative metrics and advantages accurately', () => {
    const metrics = calculateComparisonMetrics(mockRepoA, mockRepoB);

    expect(metrics.starsA).toBe(70000);
    expect(metrics.starsB).toBe(64000);
    expect(metrics.starDelta).toBe(6000);
    expect(metrics.winnerStars).toBe('A');
    expect(metrics.winnerVelocity).toBe('A'); // 1 day vs 10 days
    expect(metrics.depsA).toBe(4);
    expect(metrics.depsB).toBe(25);
  });

  it('generates an executive markdown benchmark comparison table', () => {
    const metrics = calculateComparisonMetrics(mockRepoA, mockRepoB);
    const md = generateComparisonMarkdown(mockRepoA, mockRepoB, metrics);

    expect(md).toContain('# Repology Radar Dogfight: vitejs/vite vs webpack/webpack');
    expect(md).toContain('| **Stars** | 70,000 | 64,000 |');
    expect(md).toContain('vitejs/vite');
  });

  it('renders the dual comparison console and triggers drilldown callbacks', () => {
    const container = document.createElement('div');
    let drilledRepo = null;

    renderCompare(container, {
      dataA: mockRepoA,
      dataB: mockRepoB,
      onBack: () => {},
      onExploreSingle: (r) => {
        drilledRepo = r;
      },
    });

    const titleEl = container.querySelector('.coords-repo');
    expect(titleEl.textContent).toContain('vitejs/vite');
    expect(titleEl.textContent).toContain('webpack/webpack');

    // Trigger drilldown button
    const inspectBtn = container.querySelector('#btn-inspect-a');
    expect(inspectBtn).toBeDefined();
    inspectBtn.click();
    expect(drilledRepo).toBe('vitejs/vite');
  });
});

describe('Phase 3: Hardware Command Palette', () => {
  beforeEach(() => {
    const existing = document.getElementById('command-palette-dialog');
    if (existing) existing.remove();
  });

  it('initializes dialog and wires up keyboard commands', () => {
    let selectedTab = null;
    let searchedRepo = null;

    const palette = setupCommandPalette({
      onSelectTab: (id) => {
        selectedTab = id;
      },
      onAction: () => {},
      onExplore: (r) => {
        searchedRepo = r;
      },
    });

    const dialog = document.getElementById('command-palette-dialog');
    expect(dialog).toBeDefined();

    palette.open();
    expect(dialog.open).toBe(true);

    const input = dialog.querySelector('#palette-search-input');
    input.value = 'env';
    input.dispatchEvent(new Event('input'));

    const rows = dialog.querySelectorAll('.palette-row');
    expect(rows.length).toBeGreaterThanOrEqual(1);

    // Simulate clicking the first item
    rows[0].click();
    expect(selectedTab).toBe('tab-env');
  });
});
