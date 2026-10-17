/**
 * Evaluates detected manifests, lockfiles, and optional manifest contents (such as package.json)
 * to produce source-backed setup guidance with strict confidence labels:
 *
 * - "Detected": Exact manifest, file, or script was inspected and found.
 * - "Suggested": Conventional command follows from a detected file, not tested or executed.
 * - "Not verified": Insufficient evidence; user directed to repository documentation.
 */

/**
 * @typedef {'Detected' | 'Suggested' | 'Not verified'} ConfidenceLevel
 *
 * @typedef {Object} SetupGuideCard
 * @property {string} title
 * @property {string} [command] - Safe text-only command to copy (never auto-executed)
 * @property {ConfidenceLevel} confidence
 * @property {string} evidence - Exact file or signal that provided this evidence
 * @property {string} [note] - Operational caveats (e.g., virtualenv requirement)
 * @property {string} [sourceUrl] - Link to file or section on GitHub
 * @property {boolean} [isWarning] - True for conflicting configurations or ambiguities
 */

/**
 * Safely parses package.json text into an object, handling malformed JSON.
 * @param {string | object} content
 * @returns {object | null}
 */
export function safeParsePackageJson(content) {
  if (!content) return null;
  if (typeof content === 'object') return content;
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * @param {Object} params
 * @param {import('./detect-project.js').DetectionResult} params.detection
 * @param {string | object | null} [params.packageJsonContent] - Raw or parsed package.json
 * @param {string} [params.owner]
 * @param {string} [params.repo]
 * @param {string} [params.defaultBranch='main']
 * @returns {SetupGuideCard[]}
 */
export function generateSetupGuides({
  detection,
  packageJsonContent = null,
  owner = '',
  repo = '',
  defaultBranch = 'main',
}) {
  const cards = [];
  const baseGitHubUrl = owner && repo ? `https://github.com/${owner}/${repo}` : '';
  const branchPath = defaultBranch || 'main';

  const fileUrl = (filename) =>
    baseGitHubUrl ? `${baseGitHubUrl}/blob/${branchPath}/${filename}` : undefined;

  // 1. Check for conflicting lockfiles first (Ambiguity warning)
  if (detection.hasConflictingLockfiles) {
    cards.push({
      title: 'Ambiguous Package Manager (Conflicting Lockfiles)',
      confidence: 'Not verified',
      evidence: detection.conflictingLockfiles.join(', '),
      note: `Multiple package manager lockfiles were found (${detection.conflictingLockfiles.join(
        ', '
      )}). Consult the README or CONTRIBUTING guide to verify which package manager the project uses before installing.`,
      sourceUrl: baseGitHubUrl ? `${baseGitHubUrl}/tree/${branchPath}` : undefined,
      isWarning: true,
    });
  }

  // 2. Node.js / package.json analysis
  if (detection.manifests.includes('package.json')) {
    const pkg = safeParsePackageJson(packageJsonContent);

    let pkgManagerCmd = 'npm';
    if (!detection.hasConflictingLockfiles) {
      if (detection.lockfiles.includes('pnpm-lock.yaml')) pkgManagerCmd = 'pnpm';
      else if (detection.lockfiles.includes('yarn.lock')) pkgManagerCmd = 'yarn';
      else if (detection.lockfiles.includes('bun.lockb') || detection.lockfiles.includes('bun.lock')) pkgManagerCmd = 'bun';
    }

    // Install dependencies
    if (detection.hasConflictingLockfiles) {
      cards.push({
        title: 'Install Dependencies',
        command: `${pkgManagerCmd} install`,
        confidence: 'Suggested',
        evidence: 'package.json (Note: conflicting lockfiles detected)',
        note: `Install command suggested, but please verify whether npm, yarn, or pnpm is preferred.`,
        sourceUrl: fileUrl('package.json'),
      });
    } else {
      const lockfileName = detection.lockfiles.find((l) =>
        ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb'].includes(l)
      );
      cards.push({
        title: 'Install Dependencies',
        command: `${pkgManagerCmd} install`,
        confidence: lockfileName ? 'Suggested' : 'Suggested',
        evidence: lockfileName ? `${lockfileName} + package.json` : 'package.json',
        note: lockfileName
          ? `Derived from detected ${lockfileName}.`
          : 'No lockfile found in repository root; using npm convention.',
        sourceUrl: fileUrl(lockfileName || 'package.json'),
      });
    }

    // Inspect scripts ONLY if package.json was fetched and parsed
    if (pkg && pkg.scripts && typeof pkg.scripts === 'object') {
      const scriptEntries = Object.entries(pkg.scripts);
      if (scriptEntries.length > 0) {
        for (const [scriptName, scriptCmd] of scriptEntries) {
          // Render each detected script as "Detected"
          cards.push({
            title: `Run Script: ${scriptName}`,
            command: `${pkgManagerCmd} run ${scriptName}`,
            confidence: 'Detected',
            evidence: `package.json -> scripts["${scriptName}"]`,
            note: `Executes defined script: "${scriptCmd}". Never run scripts from untrusted repositories without inspecting them.`,
            sourceUrl: fileUrl('package.json'),
          });
        }
      } else {
        cards.push({
          title: 'package.json Scripts',
          confidence: 'Detected',
          evidence: 'package.json -> scripts object is empty',
          note: 'No npm scripts are defined in package.json.',
          sourceUrl: fileUrl('package.json'),
        });
      }
    } else if (!pkg) {
      cards.push({
        title: 'Inspect package.json Scripts',
        confidence: 'Not verified',
        evidence: 'package.json detected in root',
        note: 'Open package.json on GitHub or load details to view available run scripts.',
        sourceUrl: fileUrl('package.json'),
      });
    }
  }

  // 3. Python manifests
  if (detection.manifests.includes('requirements.txt')) {
    cards.push({
      title: 'Python Dependencies',
      command: 'python -m pip install -r requirements.txt',
      confidence: 'Suggested',
      evidence: 'requirements.txt',
      note: 'Virtual environment strongly recommended before installing (e.g. `python -m venv .venv`).',
      sourceUrl: fileUrl('requirements.txt'),
    });
  }

  if (detection.manifests.includes('pyproject.toml')) {
    cards.push({
      title: 'Python Project Manifest',
      confidence: 'Not verified',
      evidence: 'pyproject.toml',
      note: 'pyproject.toml detected. Build and install requirements depend on the chosen backend (Poetry, Flit, Hatch, setuptools, or uv). Follow repository README for setup.',
      sourceUrl: fileUrl('pyproject.toml'),
    });
  }

  if (detection.manifests.includes('Pipfile')) {
    cards.push({
      title: 'Pipenv Environment',
      command: 'pipenv install',
      confidence: 'Suggested',
      evidence: 'Pipfile',
      note: 'Requires Pipenv. Creates and manages a dedicated virtualenv.',
      sourceUrl: fileUrl('Pipfile'),
    });
  }

  // 4. Go module
  if (detection.manifests.includes('go.mod')) {
    cards.push({
      title: 'Build Go Module',
      command: 'go build ./...',
      confidence: 'Suggested',
      evidence: 'go.mod',
      note: 'Requires Go toolchain. Run `go test ./...` for tests. Refer to README for specific binary targets.',
      sourceUrl: fileUrl('go.mod'),
    });
  }

  // 5. Rust Cargo
  if (detection.manifests.includes('Cargo.toml')) {
    cards.push({
      title: 'Build Cargo Package',
      command: 'cargo build',
      confidence: 'Suggested',
      evidence: 'Cargo.toml',
      note: 'Requires Rust toolchain (rustc / cargo). Run `cargo test` for test suite.',
      sourceUrl: fileUrl('Cargo.toml'),
    });
  }

  // 6. JVM / Java / Kotlin
  if (detection.manifests.includes('pom.xml')) {
    const hasWrapper = detection.rootFiles.some((f) => f.name === 'mvnw');
    cards.push({
      title: 'Maven Build',
      command: hasWrapper ? './mvnw clean install' : 'mvn clean install',
      confidence: 'Suggested',
      evidence: hasWrapper ? 'pom.xml + mvnw wrapper' : 'pom.xml',
      note: 'Requires Java Development Kit (JDK).',
      sourceUrl: fileUrl(hasWrapper ? 'mvnw' : 'pom.xml'),
    });
  } else if (
    detection.manifests.includes('build.gradle') ||
    detection.manifests.includes('build.gradle.kts')
  ) {
    const hasWrapper = detection.rootFiles.some((f) => f.name === 'gradlew');
    const manifest = detection.manifests.includes('build.gradle.kts')
      ? 'build.gradle.kts'
      : 'build.gradle';
    cards.push({
      title: 'Gradle Build',
      command: hasWrapper ? './gradlew build' : 'gradle build',
      confidence: 'Suggested',
      evidence: hasWrapper ? `${manifest} + gradlew wrapper` : manifest,
      note: 'Requires JDK. Gradle wrapper automatically handles the configured Gradle runtime.',
      sourceUrl: fileUrl(hasWrapper ? 'gradlew' : manifest),
    });
  }

  // 7. Makefile
  if (detection.manifests.includes('Makefile')) {
    cards.push({
      title: 'Make Targets',
      command: 'make',
      confidence: 'Suggested',
      evidence: 'Makefile',
      note: 'Inspect Makefile targets or README before running default make.',
      sourceUrl: fileUrl('Makefile'),
    });
  }

  // 8. Docker
  if (detection.hasDocker) {
    const dockerFile = detection.rootFiles.find(
      (f) =>
        f.name === 'Dockerfile' ||
        f.name === 'compose.yaml' ||
        f.name === 'docker-compose.yml'
    );
    if (dockerFile) {
      if (dockerFile.name.includes('compose')) {
        cards.push({
          title: 'Docker Compose',
          command: 'docker compose up',
          confidence: 'Suggested',
          evidence: dockerFile.name,
          note: 'Starts multi-container environment defined in compose specification.',
          sourceUrl: fileUrl(dockerFile.name),
        });
      } else {
        cards.push({
          title: 'Docker Container Build',
          command: `docker build -t ${repo || 'app'} .`,
          confidence: 'Suggested',
          evidence: dockerFile.name,
          note: 'Builds container image according to root Dockerfile instructions.',
          sourceUrl: fileUrl(dockerFile.name),
        });
      }
    }
  }

  // 9. If no manifests recognized, render the clear unverified fallback
  if (cards.length === 0) {
    cards.push({
      title: 'No verified setup command found',
      confidence: 'Not verified',
      evidence: 'No known package manifest or build configuration recognized in root',
      note: detection.readmeFile
        ? `No standard setup manifest was detected. Consult ${detection.readmeFile} for installation and build instructions.`
        : 'No standard setup manifest or README was detected. Inspect root files directly on GitHub.',
      sourceUrl: detection.readmeFile ? fileUrl(detection.readmeFile) : baseGitHubUrl,
    });
  }

  return cards;
}
