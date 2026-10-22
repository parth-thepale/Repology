import { describe, it, expect, beforeEach } from 'vitest';
import { generateHtmlDossier } from '../src/services/dossier-generator.js';
import { saveRecentRepo, getRecentRepos } from '../src/main.js';
import { DEMO_SNAPSHOT } from '../src/services/demo-snapshot.js';
import { renderFiles } from '../src/ui/render-files.js';

describe('Phase 2 UI Improvements & Dossier Generator', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates self-contained, valid standalone HTML dossier', () => {
    const html = generateHtmlDossier(DEMO_SNAPSHOT);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('REPOLOGY // AIRGAPPED_TELEMETRY_DOSSIER');
    expect(html).toContain('vitejs/vite');
    expect(html).toContain('01 // FUNCTIONALITY_OVERVIEW');
    expect(html).toContain('02 // CODEBASE_ANATOMY & WHERE_TO_START');
    expect(html).toContain('03 // VERIFIED_SETUP_COMMANDS');
    expect(html).toContain('04 // ENVIRONMENT_&_CONFIGURATION_PARAMETERS');
    expect(html).toContain('05 // DEPENDENCY_MANIFEST_SNAPSHOT');
  });

  it('saves and retrieves recent repositories in localStorage', () => {
    saveRecentRepo('facebook/react');
    saveRecentRepo('vitejs/vite');
    saveRecentRepo('vercel/next.js');
    saveRecentRepo('torvalds/linux');
    saveRecentRepo('facebook/react'); // Duplicate should move to front

    const recents = getRecentRepos();
    expect(recents.length).toBeLessThanOrEqual(4);
    expect(recents[0]).toBe('facebook/react');
    expect(recents).toContain('vercel/next.js');
  });

  it('renderFiles displays extension breakdown chips and filters items cleanly', () => {
    const container = document.createElement('div');
    const mockEntries = [
      { name: 'src', type: 'dir', path: 'src' },
      { name: 'index.ts', type: 'file', path: 'index.ts', size: 1200 },
      { name: 'package.json', type: 'file', path: 'package.json', size: 500 },
      { name: 'README.md', type: 'file', path: 'README.md', size: 2400 },
    ];

    renderFiles(container, {
      entries: mockEntries,
      owner: 'testowner',
      repo: 'testrepo',
      defaultBranch: 'main',
    });

    const searchInput = container.querySelector('.matrix-search-input');
    expect(searchInput).toBeDefined();

    // Verify entry node badge was applied to index.ts and src
    const entryBadges = container.querySelectorAll('.badge-tag-nominal');
    expect(entryBadges.length).toBeGreaterThanOrEqual(1);

    // Verify extension chips exist
    const extChips = container.querySelectorAll('.file-ext-chips button');
    expect(extChips.length).toBeGreaterThan(0);

    // Simulate search filter input
    searchInput.value = 'package';
    searchInput.dispatchEvent(new Event('input'));

    const rows = container.querySelectorAll('.file-row-item');
    let visibleRows = 0;
    rows.forEach((r) => {
      if (r.style.display !== 'none') visibleRows++;
    });

    expect(visibleRows).toBe(1);
  });
});
