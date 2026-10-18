/**
 * REPOSITORY EXPLAINER & ARCHITECTURAL ANATOMY SYNTHESIZER
 * Extracts plain-English functionality explanations, key capabilities,
 * codebase anatomy (where to start reading), and foundational tech stack
 * directly from repository metadata, manifests, and README content.
 *
 * Zero hallucination: All claims are grounded directly in manifest evidence
 * and parsed README documentation.
 */

import { safeParsePackageJson } from './setup-guides.js';

/**
 * Common directory roles in software engineering repositories.
 */
const DIRECTORY_ROLES = {
  src: {
    label: 'Core Source Code',
    purpose: 'Primary application logic, internal modules, and implementation files.',
    badge: 'LOGIC',
  },
  lib: {
    label: 'Library Source',
    purpose: 'Compiled or exported library code and core functional units.',
    badge: 'LIBRARY',
  },
  packages: {
    label: 'Monorepo Packages',
    purpose: 'Modular sub-packages, independent plugins, or workspace crates.',
    badge: 'PACKAGES',
  },
  cmd: {
    label: 'Command Entry Points',
    purpose: 'Main executable entry points and CLI binaries (standard Go convention).',
    badge: 'BINARIES',
  },
  pkg: {
    label: 'Public Packages',
    purpose: 'Exported packages and public APIs intended for external consumption.',
    badge: 'PUBLIC_API',
  },
  internal: {
    label: 'Private Modules',
    purpose: 'Private application packages strictly encapsulated from external imports.',
    badge: 'INTERNAL',
  },
  test: {
    label: 'Test Suite',
    purpose: 'Unit tests, end-to-end integration tests, and verification suites.',
    badge: 'TESTS',
  },
  tests: {
    label: 'Test Suite',
    purpose: 'Unit tests, regression tests, and automated test fixtures.',
    badge: 'TESTS',
  },
  __tests__: {
    label: 'Test Suite',
    purpose: 'Unit tests and behavioral test assertions.',
    badge: 'TESTS',
  },
  docs: {
    label: 'Documentation',
    purpose: 'API specifications, architectural documentation, and guides.',
    badge: 'DOCS',
  },
  documentation: {
    label: 'Documentation',
    purpose: 'Architectural documentation, user manuals, and guides.',
    badge: 'DOCS',
  },
  scripts: {
    label: 'Automation Scripts',
    purpose: 'Build automation, release pipelines, and development helper scripts.',
    badge: 'AUTOMATION',
  },
  tools: {
    label: 'Development Tooling',
    purpose: 'Internal developer utilities, generators, and linters.',
    badge: 'TOOLING',
  },
  public: {
    label: 'Static Assets',
    purpose: 'Static assets, client HTML templates, favicons, and public media.',
    badge: 'ASSETS',
  },
  assets: {
    label: 'Media Assets',
    purpose: 'Images, logos, diagrams, and illustrative documentation media.',
    badge: 'MEDIA',
  },
  examples: {
    label: 'Sample Projects',
    purpose: 'Reference implementations, tutorials, and demonstration examples.',
    badge: 'EXAMPLES',
  },
  samples: {
    label: 'Sample Projects',
    purpose: 'Reference implementations, recipes, and sample code.',
    badge: 'SAMPLES',
  },
  playground: {
    label: 'Interactive Sandbox',
    purpose: 'Development playground and test environments for manual testing.',
    badge: 'SANDBOX',
  },
  '.github': {
    label: 'GitHub Workflows & Config',
    purpose: 'CI/CD pipeline actions, issue templates, and automated workflows.',
    badge: 'CI_CD',
  },
  benchmarks: {
    label: 'Performance Benchmarks',
    purpose: 'Latency, throughput, and performance measurement benchmarks.',
    badge: 'PERF',
  },
  api: {
    label: 'API Definitions',
    purpose: 'REST endpoints, GraphQL schemas, or protobuf RPC specifications.',
    badge: 'API',
  },
  app: {
    label: 'Application Root',
    purpose: 'Top-level routing, page views, and layout containers.',
    badge: 'APP',
  },
};

/**
 * Strips markdown badges, shields, HTML tags, and markdown links from raw text.
 * @param {string} text
 * @returns {string}
 */
export function cleanMarkdownText(text = '') {
  return text
    // Remove markdown image badges e.g. [![badge](img)](link) or ![badge](img)
    .replace(/\[\!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '')
    .replace(/\!\[[^\]]*\]\([^)]*\)/g, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove HTML tags e.g. <div align="center">...</div>
    .replace(/<[^>]+>/g, '')
    // Normalize markdown links [Label](url) -> Label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove blockquote arrows
    .replace(/^>\s*/gm, '')
    // Remove extra whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts candidate feature list items from README markdown.
 * Looks for sections like "## Features", "## Highlights", "## Why X?", or leading bullet points.
 * @param {string} rawMarkdown
 * @returns {string[]}
 */
export function extractFeaturesFromReadme(rawMarkdown = '') {
  if (!rawMarkdown) return [];

  const lines = rawMarkdown.split('\n');
  const features = [];
  let inFeatureSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check heading for feature indicator
    if (/^#{1,3}\s+(features|highlights|key features|why|capabilities|what is|core concepts)/i.test(line)) {
      inFeatureSection = true;
      continue;
    }

    // If in feature section and hit another heading, stop
    if (inFeatureSection && /^#{1,3}\s+/.test(line)) {
      break;
    }

    // Extract bullet points
    if (inFeatureSection && /^[-*•]\s+/.test(line)) {
      const clean = cleanMarkdownText(line.replace(/^[-*•]\s+/, '')).trim();
      if (clean && clean.length > 5 && clean.length < 200) {
        features.push(clean);
      }
    }
  }

  // If no dedicated section found, check for early bullet points in the first 40 lines
  if (features.length === 0) {
    const earlyLines = lines.slice(0, 45);
    for (const line of earlyLines) {
      if (/^[-*•]\s+/.test(line.trim())) {
        const clean = cleanMarkdownText(line.replace(/^[-*•]\s+/, '')).trim();
        if (clean && clean.length > 5 && clean.length < 200 && !clean.toLowerCase().includes('http')) {
          features.push(clean);
        }
      }
    }
  }

  return features.slice(0, 8);
}

/**
 * Extracts clean introductory paragraphs from README to explain what the project does.
 * @param {string} rawMarkdown
 * @param {string} defaultDescription
 * @returns {string}
 */
export function extractOverviewExplanation(rawMarkdown = '', defaultDescription = '') {
  if (!rawMarkdown) return defaultDescription || 'No detailed overview provided.';

  const cleaned = cleanMarkdownText(rawMarkdown);
  const paragraphs = cleaned.split(/\n\s*\n/);

  // Find first substantial prose paragraph (>= 40 chars, not a title, header, or bullet list)
  for (const p of paragraphs) {
    const trimmed = p.trim();
    const startsWithBullet = /^[-*•]\s+/i.test(trimmed);
    const startsWithHeading = /^#{1,6}\s+/i.test(trimmed);
    const isCopyright =
      trimmed.toLowerCase().startsWith('copyright') || trimmed.toLowerCase().startsWith('license');

    if (trimmed.length >= 40 && !startsWithHeading && !startsWithBullet && !isCopyright) {
      // Limit to 380 chars for executive punchiness
      if (trimmed.length > 380) {
        return trimmed.slice(0, 377).trim() + '...';
      }
      return trimmed;
    }
  }

  return defaultDescription || 'No detailed overview provided.';
}

/**
 * Classifies the repository project type (e.g. Monorepo, CLI Tool, Library, Framework, etc.).
 * @param {object} params
 * @param {import('./detect-project.js').RootFileEntry[]} params.contents
 * @param {object} params.metadata
 * @param {object | null} params.pkg
 * @returns {{ id: string, label: string, badge: string, icon: string, description: string }}
 */
export function classifyProjectType({ contents = [], metadata = {}, pkg = null }) {
  const fileNames = new Set(contents.map((c) => c.name));
  const desc = (metadata.description || '').toLowerCase();
  const topics = Array.isArray(metadata.topics) ? metadata.topics.map((t) => t.toLowerCase()) : [];

  // Monorepo detection
  if (
    fileNames.has('pnpm-workspace.yaml') ||
    fileNames.has('lerna.json') ||
    (pkg && (pkg.workspaces || pkg.private)) &&
    fileNames.has('packages')
  ) {
    return {
      id: 'monorepo',
      label: 'Monorepo Workspace',
      badge: '[TYPE: MONOREPO_WORKSPACE]',
      icon: '📦',
      description: 'Houses multiple coordinated packages, tools, or libraries in a single repository.',
    };
  }

  // CLI Tool detection
  if (
    (pkg && pkg.bin) ||
    fileNames.has('cmd') ||
    desc.includes('cli') ||
    desc.includes('command line') ||
    topics.includes('cli')
  ) {
    return {
      id: 'cli',
      label: 'Command-Line Interface (CLI)',
      badge: '[TYPE: CLI_TOOL]',
      icon: '⌨️',
      description: 'Executes from the command line as a developer tool or terminal utility.',
    };
  }

  // Web Framework / Frontend App
  if (
    desc.includes('framework') ||
    topics.includes('framework') ||
    fileNames.has('next.config.js') ||
    fileNames.has('vite.config.js') ||
    fileNames.has('vite.config.ts') ||
    fileNames.has('nuxt.config.js')
  ) {
    return {
      id: 'framework',
      label: 'Application / Framework',
      badge: '[TYPE: WEB_FRAMEWORK_OR_APP]',
      icon: '🌐',
      description: 'Provides application architecture, dev server, or full-stack web runtime.',
    };
  }

  // SDK / Library
  if (
    fileNames.has('src') ||
    fileNames.has('lib') ||
    desc.includes('library') ||
    desc.includes('sdk') ||
    desc.includes('client') ||
    (pkg && (pkg.main || pkg.module || pkg.exports))
  ) {
    return {
      id: 'library',
      label: 'Software Library / SDK',
      badge: '[TYPE: SOFTWARE_LIBRARY_SDK]',
      icon: '📚',
      description: 'Modular package designed to be imported as a dependency into other projects.',
    };
  }

  // Backend Service / API
  if (fileNames.has('Dockerfile') || fileNames.has('docker-compose.yml') || fileNames.has('api')) {
    return {
      id: 'service',
      label: 'Backend Service / Container',
      badge: '[TYPE: BACKEND_SERVICE]',
      icon: '🐳',
      description: 'Containerized service or server-side API application.',
    };
  }

  return {
    id: 'general',
    label: 'Open-Source Codebase',
    badge: '[TYPE: GENERAL_REPOSITORY]',
    icon: '📂',
    description: 'General open-source software project.',
  };
}

/**
 * Identifies the prime entry point where a newcomer should start reading code.
 * @param {object} params
 * @param {import('./detect-project.js').RootFileEntry[]} params.contents
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {string} params.defaultBranch
 * @param {object | null} params.pkg
 * @returns {{ path: string, url: string, reason: string }}
 */
export function identifyEntryPoint({ contents = [], owner, repo, defaultBranch = 'main', pkg = null }) {
  const fileNames = new Set(contents.map((c) => c.name));
  const baseGithub = `https://github.com/${owner}/${repo}`;

  // 1. package.json main/exports/module
  if (pkg) {
    const entry = pkg.module || pkg.main || (typeof pkg.exports === 'string' ? pkg.exports : null);
    if (typeof entry === 'string' && entry) {
      const clean = entry.replace(/^\.\//, '');
      return {
        path: clean,
        url: `${baseGithub}/blob/${defaultBranch}/${clean}`,
        reason: 'Exported primary entry point defined in package.json.',
      };
    }
  }

  // 2. Monorepos -> packages folder or core package
  if (fileNames.has('packages')) {
    return {
      path: 'packages/',
      url: `${baseGithub}/tree/${defaultBranch}/packages`,
      reason: 'Monorepo workspace root containing the core packages and plugins.',
    };
  }

  // 3. Go main entry point
  if (fileNames.has('cmd')) {
    return {
      path: 'cmd/',
      url: `${baseGithub}/tree/${defaultBranch}/cmd`,
      reason: 'Command entry point directory where main executables are located.',
    };
  }
  if (fileNames.has('main.go')) {
    return {
      path: 'main.go',
      url: `${baseGithub}/blob/${defaultBranch}/main.go`,
      reason: 'Root binary entry point where the Go runtime initializes.',
    };
  }

  // 4. Standard src directory
  if (fileNames.has('src')) {
    return {
      path: 'src/',
      url: `${baseGithub}/tree/${defaultBranch}/src`,
      reason: 'Core source code directory housing implementation modules.',
    };
  }

  // 5. Standard lib directory
  if (fileNames.has('lib')) {
    return {
      path: 'lib/',
      url: `${baseGithub}/tree/${defaultBranch}/lib`,
      reason: 'Primary library modules and internal implementations.',
    };
  }

  // Fallback to README
  return {
    path: 'README.md',
    url: `${baseGithub}#readme`,
    reason: 'Primary project overview and developer documentation.',
  };
}

/**
 * Maps root directories to their architectural purpose.
 * @param {import('./detect-project.js').RootFileEntry[]} contents
 * @param {string} owner
 * @param {string} repo
 * @param {string} defaultBranch
 * @returns {Array<{ name: string, label: string, purpose: string, badge: string, url: string }>}
 */
export function buildDirectoryAnatomy(contents = [], owner, repo, defaultBranch = 'main') {
  const dirs = contents.filter((c) => c.type === 'dir');
  const baseGithub = `https://github.com/${owner}/${repo}/tree/${defaultBranch}`;

  return dirs.map((d) => {
    const role = DIRECTORY_ROLES[d.name.toLowerCase()] || {
      label: 'Directory Module',
      purpose: 'Structural repository sub-directory.',
      badge: 'DIR',
    };

    return {
      name: d.name,
      label: role.label,
      purpose: role.purpose,
      badge: `[${role.badge}]`,
      url: `${baseGithub}/${d.name}`,
    };
  });
}

/**
 * Extracts key dependencies and build toolchain from parsed package.json.
 * @param {object | null} pkg
 * @returns {{ runtimeDeps: string[], devToolchain: string[] }}
 */
export function extractDependenciesOverview(pkg = null) {
  if (!pkg) {
    return { runtimeDeps: [], devToolchain: [] };
  }

  const runtimeDeps = pkg.dependencies ? Object.keys(pkg.dependencies).slice(0, 8) : [];
  const devToolchain = pkg.devDependencies ? Object.keys(pkg.devDependencies).slice(0, 8) : [];

  return { runtimeDeps, devToolchain };
}

/**
 * Comprehensive repository functionality and architectural explanation generator.
 * @param {object} params
 * @param {object} params.metadata
 * @param {string | null} params.readmeText
 * @param {import('./detect-project.js').RootFileEntry[]} params.contents
 * @param {string | object | null} [params.packageJsonContent]
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {string} [params.defaultBranch='main']
 * @returns {object}
 */
export function explainRepository({
  metadata = {},
  readmeText = null,
  contents = [],
  packageJsonContent = null,
  owner = '',
  repo = '',
  defaultBranch = 'main',
}) {
  const pkg = safeParsePackageJson(packageJsonContent);

  const elevatorPitch = metadata.description || 'Open-source software repository.';
  const overviewExplanation = extractOverviewExplanation(readmeText, elevatorPitch);
  const features = extractFeaturesFromReadme(readmeText);
  const projectType = classifyProjectType({ contents, metadata, pkg });
  const entryPoint = identifyEntryPoint({ contents, owner, repo, defaultBranch, pkg });
  const directoryAnatomy = buildDirectoryAnatomy(contents, owner, repo, defaultBranch);
  const { runtimeDeps, devToolchain } = extractDependenciesOverview(pkg);

  return {
    elevatorPitch,
    overviewExplanation,
    features,
    projectType,
    entryPoint,
    directoryAnatomy,
    runtimeDeps,
    devToolchain,
  };
}
