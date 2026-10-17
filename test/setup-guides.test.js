import { describe, it, expect } from 'vitest';
import { detectProject } from '../src/core/detect-project.js';
import { generateSetupGuides, safeParsePackageJson } from '../src/core/setup-guides.js';

describe('detectProject', () => {
  it('detects Node.js ecosystem and single lockfile', () => {
    const entries = [
      { name: 'package.json', type: 'file' },
      { name: 'pnpm-lock.yaml', type: 'file' },
      { name: 'src', type: 'dir' },
      { name: 'README.md', type: 'file' },
    ];
    const res = detectProject(entries, 'TypeScript');
    expect(res.ecosystems).toContain('Node.js / JavaScript / TypeScript');
    expect(res.ecosystems).toContain('TypeScript');
    expect(res.manifests).toContain('package.json');
    expect(res.packageManager).toBe('pnpm');
    expect(res.hasConflictingLockfiles).toBe(false);
    expect(res.readmeFile).toBe('README.md');
  });

  it('QA-12: flags conflicting lockfiles when multiple exist', () => {
    const entries = [
      { name: 'package.json', type: 'file' },
      { name: 'package-lock.json', type: 'file' },
      { name: 'yarn.lock', type: 'file' },
    ];
    const res = detectProject(entries);
    expect(res.hasConflictingLockfiles).toBe(true);
    expect(res.conflictingLockfiles).toContain('package-lock.json');
    expect(res.conflictingLockfiles).toContain('yarn.lock');
    expect(res.packageManager).toBeNull();
  });

  it('detects Python manifests and virtualenv recommendations', () => {
    const entries = [
      { name: 'requirements.txt', type: 'file' },
      { name: 'pyproject.toml', type: 'file' },
    ];
    const res = detectProject(entries, 'Python');
    expect(res.manifests).toContain('requirements.txt');
    expect(res.manifests).toContain('pyproject.toml');
  });

  it('QA-15: handles empty entries array without crashing', () => {
    const res = detectProject([]);
    expect(res.ecosystems).toEqual([]);
    expect(res.manifests).toEqual([]);
    expect(res.rootFiles).toEqual([]);
    expect(res.readmeFile).toBeNull();
  });
});

describe('generateSetupGuides', () => {
  it('QA-10: returns "No verified setup command found" when no manifests exist', () => {
    const detection = detectProject([
      { name: 'notes.txt', type: 'file' },
      { name: 'README.md', type: 'file' },
    ]);
    const guides = generateSetupGuides({
      detection,
      owner: 'test',
      repo: 'repo',
    });
    expect(guides.length).toBe(1);
    expect(guides[0].title).toBe('No verified setup command found');
    expect(guides[0].confidence).toBe('Not verified');
    expect(guides[0].command).toBeUndefined();
  });

  it('QA-11: package.json with ONLY "test" script shows only actual detected script and no assumed dev/start', () => {
    const detection = detectProject([
      { name: 'package.json', type: 'file' },
      { name: 'package-lock.json', type: 'file' },
    ]);
    const packageJsonContent = JSON.stringify({
      name: 'sample',
      scripts: {
        test: 'vitest run',
      },
    });

    const guides = generateSetupGuides({
      detection,
      packageJsonContent,
      owner: 'acme',
      repo: 'tool',
    });

    const scriptGuides = guides.filter((g) => g.title.startsWith('Run Script:'));
    expect(scriptGuides.length).toBe(1);
    expect(scriptGuides[0].title).toBe('Run Script: test');
    expect(scriptGuides[0].command).toBe('npm run test');
    expect(scriptGuides[0].confidence).toBe('Detected');

    // Confirm no fake dev or start script was invented
    const devGuide = guides.find((g) => g.title === 'Run Script: dev' || g.command === 'npm run dev');
    expect(devGuide).toBeUndefined();
    const startGuide = guides.find((g) => g.title === 'Run Script: start' || g.command === 'npm run start');
    expect(startGuide).toBeUndefined();
  });

  it('QA-12: conflicting lockfiles generates an explicit warning card', () => {
    const detection = detectProject([
      { name: 'package.json', type: 'file' },
      { name: 'package-lock.json', type: 'file' },
      { name: 'yarn.lock', type: 'file' },
    ]);
    const guides = generateSetupGuides({
      detection,
      owner: 'acme',
      repo: 'tool',
    });
    const warning = guides.find((g) => g.isWarning);
    expect(warning).toBeDefined();
    expect(warning.title).toContain('Ambiguous Package Manager');
    expect(warning.confidence).toBe('Not verified');
  });

  it('python requirements.txt produces suggested install command with note', () => {
    const detection = detectProject([{ name: 'requirements.txt', type: 'file' }]);
    const guides = generateSetupGuides({
      detection,
      owner: 'python',
      repo: 'cpython',
    });
    const pyGuide = guides.find((g) => g.title === 'Python Dependencies');
    expect(pyGuide).toBeDefined();
    expect(pyGuide.confidence).toBe('Suggested');
    expect(pyGuide.command).toBe('python -m pip install -r requirements.txt');
    expect(pyGuide.note).toContain('Virtual environment');
  });

  it('pyproject.toml alone is labelled Not verified', () => {
    const detection = detectProject([{ name: 'pyproject.toml', type: 'file' }]);
    const guides = generateSetupGuides({
      detection,
      owner: 'python',
      repo: 'tool',
    });
    const guide = guides.find((g) => g.title === 'Python Project Manifest');
    expect(guide.confidence).toBe('Not verified');
    expect(guide.command).toBeUndefined();
  });
});
