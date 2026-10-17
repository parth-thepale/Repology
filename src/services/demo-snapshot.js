/**
 * Pre-cached offline telemetry snapshot for millisecond-zero demo mode.
 * Allows visitors and automated auditors to experience the full radar console
 * instantly with 0 API calls or network latency.
 */

export const DEMO_SNAPSHOT = {
  owner: 'vitejs',
  repo: 'vite',
  isDemo: true,
  isCacheHit: true,
  defaultBranch: 'main',
  metadata: {
    name: 'vite',
    full_name: 'vitejs/vite',
    owner: { login: 'vitejs' },
    html_url: 'https://github.com/vitejs/vite',
    description: 'Next generation frontend tooling. It\'s fast!',
    fork: false,
    stargazers_count: 73200,
    watchers_count: 73200,
    forks_count: 6350,
    open_issues_count: 148,
    language: 'TypeScript',
    license: { spdx_id: 'MIT', name: 'MIT License' },
    default_branch: 'main',
    pushed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    archived: false,
  },
  languages: {
    TypeScript: 884000,
    JavaScript: 64200,
    HTML: 28900,
    CSS: 15400,
  },
  contents: [
    { name: '.github', type: 'dir', path: '.github' },
    { name: 'docs', type: 'dir', path: 'docs' },
    { name: 'packages', type: 'dir', path: 'packages' },
    { name: 'playground', type: 'dir', path: 'playground' },
    { name: 'scripts', type: 'dir', path: 'scripts' },
    { name: '.editorconfig', type: 'file', size: 382, path: '.editorconfig' },
    { name: '.gitignore', type: 'file', size: 512, path: '.gitignore' },
    { name: 'CONTRIBUTING.md', type: 'file', size: 4890, path: 'CONTRIBUTING.md' },
    { name: 'LICENSE.md', type: 'file', size: 1072, path: 'LICENSE.md' },
    { name: 'README.md', type: 'file', size: 8420, path: 'README.md' },
    { name: 'package.json', type: 'file', size: 3120, path: 'package.json' },
    { name: 'pnpm-lock.yaml', type: 'file', size: 489200, path: 'pnpm-lock.yaml' },
    { name: 'pnpm-workspace.yaml', type: 'file', size: 180, path: 'pnpm-workspace.yaml' },
    { name: 'tsconfig.json', type: 'file', size: 1240, path: 'tsconfig.json' },
  ],
  contentsError: null,
  readmeText: `# Vite ⚡

> Next Generation Frontend Tooling

- 💡 Instant Server Start
- ⚡️ Lightning Fast HMR
- 🛠️ Rich Features
- 📦 Optimized Build
- 🔩 Universal Plugin Interface
- 🔑 Fully Typed APIs

Vite (French word for "quick", pronounced \`/vit/\`, like "veet") is a build tool that aims to provide a faster and leaner development experience for modern web projects.

## Packages

- **vite**: The core library.
- **@vitejs/plugin-vue**: Vue 3 SFC support.
- **@vitejs/plugin-react**: React Fast Refresh support.

## Getting Started

With NPM:
\`\`\`bash
npm create vite@latest
\`\`\`

With PNPM:
\`\`\`bash
pnpm create vite
\`\`\`
`,
  readmeError: null,
  detection: {
    ecosystems: ['Node.js / JavaScript / TypeScript', 'TypeScript'],
    manifests: ['package.json', 'tsconfig.json'],
    lockfiles: ['pnpm-lock.yaml'],
    packageManager: 'pnpm',
    hasConflictingLockfiles: false,
    conflictingLockfiles: [],
    readmeFile: 'README.md',
    contributingFile: 'CONTRIBUTING.md',
    licenseFile: 'LICENSE.md',
    hasDocker: false,
    hasCi: true,
    rootFiles: [],
  },
  setupGuides: [
    {
      title: 'Install Dependencies',
      command: 'pnpm install',
      confidence: 'Suggested',
      evidence: 'pnpm-lock.yaml + package.json',
      note: 'Derived from detected pnpm-lock.yaml.',
      sourceUrl: 'https://github.com/vitejs/vite/blob/main/pnpm-lock.yaml',
    },
    {
      title: 'Run Script: dev',
      command: 'pnpm run dev',
      confidence: 'Detected',
      evidence: 'package.json -> scripts["dev"]',
      note: 'Executes defined script: "run-p build-check-packages dev".',
      sourceUrl: 'https://github.com/vitejs/vite/blob/main/package.json',
    },
    {
      title: 'Run Script: build',
      command: 'pnpm run build',
      confidence: 'Detected',
      evidence: 'package.json -> scripts["build"]',
      note: 'Executes defined script: "run-s build-bundle".',
      sourceUrl: 'https://github.com/vitejs/vite/blob/main/package.json',
    },
    {
      title: 'Run Script: test',
      command: 'pnpm run test',
      confidence: 'Detected',
      evidence: 'package.json -> scripts["test"]',
      note: 'Executes defined script: "run-s test-unit test-e2e".',
      sourceUrl: 'https://github.com/vitejs/vite/blob/main/package.json',
    },
  ],
  pulse: {
    status: 'nominal',
    label: 'ACTIVE // HIGH_CADENCE',
    color: '#10B981',
    relativePush: 'Today',
    licensePermissive: true,
    licenseType: 'Permissive (MIT)',
    busFactorRisk: 'LOW // Multi-team maintainers',
  },
  isPartial: false,
};
