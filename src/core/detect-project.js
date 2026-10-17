/**
 * Analyzes root-level files and repository metadata to detect project ecosystem,
 * package managers, manifests, documentation, and lockfile ambiguities.
 */

/**
 * @typedef {Object} RootFileEntry
 * @property {string} name
 * @property {string} path
 * @property {'file' | 'dir' | 'symlink' | 'submodule'} type
 * @property {number} [size]
 * @property {string} [html_url]
 * @property {string} [download_url]
 */

/**
 * @typedef {Object} DetectionResult
 * @property {string[]} ecosystems - Detected ecosystems (e.g., 'Node.js', 'Python', 'Go', 'Rust')
 * @property {string[]} manifests - Detected manifest files (e.g. ['package.json', 'pyproject.toml'])
 * @property {string[]} lockfiles - Detected lockfiles
 * @property {string | null} packageManager - Single package manager if unambiguous, or null
 * @property {boolean} hasConflictingLockfiles - True if multiple package manager lockfiles coexist
 * @property {string[]} conflictingLockfiles - List of conflicting lockfiles detected
 * @property {string | null} readmeFile - Name of detected README
 * @property {string | null} contributingFile - Name of detected CONTRIBUTING guide
 * @property {string | null} licenseFile - Name of detected LICENSE file
 * @property {boolean} hasDocker - True if Dockerfile/compose is present
 * @property {boolean} hasCi - True if .github/workflows or CI file is present
 * @property {RootFileEntry[]} rootFiles - Sorted list of root items (dirs first, then files)
 */

const LOCKFILE_MANAGERS = {
  'package-lock.json': 'npm',
  'npm-shrinkwrap.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
  'bun.lockb': 'bun',
  'bun.lock': 'bun',
  'poetry.lock': 'poetry',
  'Pipfile.lock': 'pipenv',
  'uv.lock': 'uv',
  'Cargo.lock': 'cargo',
  'go.sum': 'go',
};

const MANIFEST_PATTERNS = [
  { file: 'package.json', ecosystem: 'Node.js / JavaScript / TypeScript' },
  { file: 'tsconfig.json', ecosystem: 'TypeScript' },
  { file: 'requirements.txt', ecosystem: 'Python' },
  { file: 'pyproject.toml', ecosystem: 'Python' },
  { file: 'Pipfile', ecosystem: 'Python' },
  { file: 'setup.py', ecosystem: 'Python' },
  { file: 'go.mod', ecosystem: 'Go' },
  { file: 'Cargo.toml', ecosystem: 'Rust' },
  { file: 'pom.xml', ecosystem: 'Java (Maven)' },
  { file: 'build.gradle', ecosystem: 'JVM (Gradle)' },
  { file: 'build.gradle.kts', ecosystem: 'JVM (Gradle Kotlin)' },
  { file: 'Gemfile', ecosystem: 'Ruby' },
  { file: 'composer.json', ecosystem: 'PHP' },
  { file: 'CMakeLists.txt', ecosystem: 'C / C++ (CMake)' },
  { file: 'Makefile', ecosystem: 'Make' },
];

/**
 * @param {RootFileEntry[]} entries - Array of files/directories from repo root
 * @param {string | null} [primaryLanguage] - Primary language reported by GitHub
 * @returns {DetectionResult}
 */
export function detectProject(entries = [], primaryLanguage = null) {
  if (!Array.isArray(entries)) {
    entries = [];
  }

  const fileNames = new Set(entries.map((e) => e.name));
  const lowerFileNames = new Map();
  for (const entry of entries) {
    lowerFileNames.set(entry.name.toLowerCase(), entry.name);
  }

  const ecosystems = new Set();
  const manifests = [];
  const lockfiles = [];
  const detectedManagers = new Set();

  // Primary language hint
  if (primaryLanguage) {
    ecosystems.add(primaryLanguage);
  }

  // Check manifests
  for (const { file, ecosystem } of MANIFEST_PATTERNS) {
    if (fileNames.has(file)) {
      manifests.push(file);
      ecosystems.add(ecosystem);
    }
  }

  // Check .NET (.sln, .csproj)
  for (const name of fileNames) {
    if (name.endsWith('.sln') || name.endsWith('.csproj') || name === 'global.json') {
      manifests.push(name);
      ecosystems.add('.NET');
    }
  }

  // Check Node lockfiles and detect conflicts
  const nodeLockfiles = [];
  if (fileNames.has('package-lock.json')) nodeLockfiles.push('package-lock.json');
  if (fileNames.has('yarn.lock')) nodeLockfiles.push('yarn.lock');
  if (fileNames.has('pnpm-lock.yaml')) nodeLockfiles.push('pnpm-lock.yaml');
  if (fileNames.has('bun.lockb') || fileNames.has('bun.lock')) {
    nodeLockfiles.push(fileNames.has('bun.lockb') ? 'bun.lockb' : 'bun.lock');
  }

  for (const lock of nodeLockfiles) {
    lockfiles.push(lock);
    const mgr = LOCKFILE_MANAGERS[lock];
    if (mgr) detectedManagers.add(mgr);
  }

  // Check other lockfiles
  for (const [lock, mgr] of Object.entries(LOCKFILE_MANAGERS)) {
    if (!nodeLockfiles.includes(lock) && fileNames.has(lock)) {
      lockfiles.push(lock);
      detectedManagers.add(mgr);
    }
  }

  const hasConflictingLockfiles = nodeLockfiles.length > 1;
  const conflictingLockfiles = hasConflictingLockfiles ? nodeLockfiles : [];

  let packageManager = null;
  if (nodeLockfiles.length === 1) {
    packageManager = LOCKFILE_MANAGERS[nodeLockfiles[0]] || null;
  } else if (fileNames.has('package.json') && nodeLockfiles.length === 0) {
    // Default suggestion when package.json is present without lockfile
    packageManager = 'npm (inferred; no lockfile)';
  }

  // Detect documentation files (case-insensitive)
  let readmeFile = null;
  let contributingFile = null;
  let licenseFile = null;

  for (const [lower, actual] of lowerFileNames.entries()) {
    if (!readmeFile && (lower === 'readme.md' || lower === 'readme' || lower.startsWith('readme.'))) {
      readmeFile = actual;
    }
    if (!contributingFile && (lower === 'contributing.md' || lower === 'contributing' || lower.startsWith('contributing.'))) {
      contributingFile = actual;
    }
    if (!licenseFile && (lower === 'license' || lower === 'license.md' || lower === 'licence' || lower.startsWith('license.'))) {
      licenseFile = actual;
    }
  }

  const hasDocker =
    fileNames.has('Dockerfile') ||
    fileNames.has('Containerfile') ||
    fileNames.has('compose.yaml') ||
    fileNames.has('compose.yml') ||
    fileNames.has('docker-compose.yml') ||
    fileNames.has('docker-compose.yaml');

  const hasCi =
    fileNames.has('.github') ||
    fileNames.has('.gitlab-ci.yml') ||
    fileNames.has('.circleci') ||
    fileNames.has('Jenkinsfile');

  // Sort root files: directories first (alphabetical), then files (alphabetical)
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.type === 'dir' && b.type !== 'dir') return -1;
    if (a.type !== 'dir' && b.type === 'dir') return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return {
    ecosystems: Array.from(ecosystems),
    manifests,
    lockfiles,
    packageManager,
    hasConflictingLockfiles,
    conflictingLockfiles,
    readmeFile,
    contributingFile,
    licenseFile,
    hasDocker,
    hasCi,
    rootFiles: sortedEntries,
  };
}
