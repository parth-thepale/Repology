import { describe, it, expect } from 'vitest';
import { calculatePulse, generateMarkdownReport, generateJsonReport } from '../src/services/repository-service.js';

describe('Velocity, Pulse & Report Generation', () => {
  it('calculates active velocity pulse when pushed recently', () => {
    const meta = {
      pushed_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      license: { spdx_id: 'MIT' },
    };
    const pulse = calculatePulse(meta);
    expect(pulse.status).toBe('nominal');
    expect(pulse.label).toContain('ACTIVE');
    expect(pulse.licensePermissive).toBe(true);
    expect(pulse.licenseType).toContain('Permissive');
  });

  it('calculates dormant pulse when last push is over 180 days', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 200);
    const meta = {
      pushed_at: pastDate.toISOString(),
      license: { spdx_id: 'GPL-3.0' },
    };
    const pulse = calculatePulse(meta);
    expect(pulse.status).toBe('critical');
    expect(pulse.label).toContain('DORMANT');
    expect(pulse.licenseCopyleft).toBe(true);
  });

  it('generates a valid markdown telemetry report with setup instructions', () => {
    const mockData = {
      owner: 'acme',
      repo: 'gadget',
      defaultBranch: 'main',
      metadata: {
        language: 'TypeScript',
        stargazers_count: 1200,
        forks_count: 85,
        license: { spdx_id: 'Apache-2.0' },
      },
      detection: {
        ecosystems: ['Node.js'],
        manifests: ['package.json'],
        packageManager: 'pnpm',
        hasCi: true,
        hasDocker: false,
      },
      setupGuides: [
        {
          title: 'Install Dependencies',
          command: 'pnpm install',
          confidence: 'Suggested',
          evidence: 'package.json',
        },
      ],
      pulse: {
        label: 'ACTIVE // HIGH_CADENCE',
        relativePush: 'Today',
      },
    };

    const report = generateMarkdownReport(mockData);
    expect(report).toContain('# Repology Orientation Telemetry: acme/gadget');
    expect(report).toContain('pnpm install');
    expect(report).toContain('TypeScript');
    expect(report).toContain('Apache-2.0');
  });

  it('generates valid JSON report telemetry', () => {
    const mockData = {
      owner: 'test',
      repo: 'repo',
      metadata: { name: 'repo' },
      detection: {},
      setupGuides: [],
    };
    const jsonStr = generateJsonReport(mockData);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.target).toBe('test/repo');
    expect(parsed.version).toBe('repology-telemetry-v1');
  });
});
