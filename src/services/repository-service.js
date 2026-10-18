/**
 * Repository service: coordinates high-level repository data fetching.
 * Preserves partial successes: a README 404 does not fail file contents or metadata.
 * Adds Velocity & Pulse analytics, language breakdown, and telemetry export.
 */

import { githubFetch } from './github-api.js';
import { detectProject } from '../core/detect-project.js';
import { generateSetupGuides } from '../core/setup-guides.js';
import { explainRepository } from '../core/repo-explainer.js';

/**
 * Base64 decoder helper for browsers and environments.
 * @param {string} b64
 * @returns {string}
 */
export function decodeBase64Utf8(b64) {
  try {
    const cleanB64 = b64.replace(/\s/g, '');
    const binary = atob(cleanB64);
    const bytes = Uint8Array.from(binary, (m) => m.charCodeAt(0));
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch {
    return '';
  }
}

/**
 * Fetch top-level metadata for a repository.
 * @param {string} owner
 * @param {string} repo
 */
export async function getRepoMetadata(owner, repo) {
  return githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
}

/**
 * Fetch repository languages breakdown.
 * @param {string} owner
 * @param {string} repo
 */
export async function getRepoLanguages(owner, repo) {
  return githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`);
}

/**
 * Fetch root contents (or subfolder contents) for a repository.
 * @param {string} owner
 * @param {string} repo
 * @param {string} defaultBranch
 * @param {string} [path='']
 */
export async function getRepoContents(owner, repo, defaultBranch = 'main', path = '') {
  const cleanPath = path.replace(/^\/+/, '');
  const endpoint = cleanPath
    ? `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}?ref=${encodeURIComponent(
        defaultBranch
      )}`
    : `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents?ref=${encodeURIComponent(
        defaultBranch
      )}`;

  return githubFetch(endpoint);
}

/**
 * Fetch repository README.
 * @param {string} owner
 * @param {string} repo
 * @param {string} defaultBranch
 */
export async function getRepoReadme(owner, repo, defaultBranch = 'main') {
  return githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme?ref=${encodeURIComponent(
      defaultBranch
    )}`,
    { asRawText: true }
  );
}

/**
 * Fetch specific manifest content (e.g. package.json) as raw text.
 * @param {string} owner
 * @param {string} repo
 * @param {string} defaultBranch
 * @param {string} manifestPath
 */
export async function getManifestContent(owner, repo, defaultBranch = 'main', manifestPath = 'package.json') {
  return githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(
      manifestPath
    )}?ref=${encodeURIComponent(defaultBranch)}`,
    { asRawText: true }
  );
}

/**
 * Evaluates repository cadence, maintenance pulse, and license risk.
 * @param {object} metadata
 * @returns {object}
 */
export function calculatePulse(metadata) {
  const pushedDate = metadata.pushed_at ? new Date(metadata.pushed_at) : null;
  const now = new Date();
  const diffDays = pushedDate ? Math.floor((now - pushedDate) / (1000 * 60 * 60 * 24)) : 999;

  let status = 'nominal';
  let label = 'ACTIVE // HIGH_CADENCE';
  let color = '#10B981';
  let desc = 'Commits pushed recently. Active development velocity.';

  if (diffDays > 180) {
    status = 'critical';
    label = 'DORMANT // LOW_VELOCITY';
    color = '#EF4444';
    desc = `No commits pushed in > ${diffDays} days. Potential maintenance stagnation.`;
  } else if (diffDays > 30) {
    status = 'warning';
    label = 'STABLE // MODERATE_PACE';
    color = '#F59E0B';
    desc = `Last commit pushed ${diffDays} days ago. Steady maintenance mode.`;
  }

  // License classification
  const spdx = (metadata.license?.spdx_id || '').toUpperCase();
  const isPermissive = ['MIT', 'APACHE-2.0', 'BSD-2-CLAUSE', 'BSD-3-CLAUSE', 'ISC', '0BSD', 'UNLICENSE'].includes(spdx);
  const isCopyleft = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'MPL-2.0'].includes(spdx);

  return {
    status,
    label,
    color,
    diffDays,
    relativePush: diffDays === 0 ? 'Today' : `${diffDays}d ago`,
    licensePermissive: isPermissive,
    licenseCopyleft: isCopyleft,
    licenseType: isPermissive ? `Permissive (${spdx})` : isCopyleft ? `Copyleft (${spdx})` : spdx || 'No SPDX License',
  };
}

/**
 * Generates an executive Markdown report suitable for PRs or documentation.
 * @param {object} data
 * @returns {string}
 */
export function generateMarkdownReport(data) {
  const { owner, repo, metadata, defaultBranch, detection, setupGuides, pulse, explainer } = data;
  const featuresMd =
    explainer?.features?.length > 0
      ? `\n### Core Capabilities\n${explainer.features.map((f) => `- ${f}`).join('\n')}\n`
      : '';

  return `# Repology Orientation Telemetry: ${owner}/${repo}
*Generated at ${new Date().toISOString()} via Repology Control Plane*

## Executive Summary
- **Repository:** https://github.com/${owner}/${repo}
- **Primary Language:** ${metadata.language || 'Unknown'}
- **Default Branch:** \`${defaultBranch}\`
- **Project Classification:** ${explainer?.projectType?.label || 'General Codebase'}
- **Stars / Forks:** ${metadata.stargazers_count} ⭐ / ${metadata.forks_count} 🍴
- **Velocity Pulse:** ${pulse?.label || 'ACTIVE'} (Last push: ${pulse?.relativePush || 'Recent'})
- **License:** ${metadata.license?.spdx_id || 'None declared'}

## System Mission & Functionality
> ${explainer?.overviewExplanation || explainer?.elevatorPitch || metadata.description || 'Open-source software repository.'}
${featuresMd}
## Codebase Navigation Guide
- **Where to Start Reading:** \`${explainer?.entryPoint?.path || 'README.md'}\` (${explainer?.entryPoint?.reason || 'Primary repository entry point'})

## Ecosystem & Manifest Evidence
- **Detected Ecosystems:** ${detection.ecosystems.join(', ') || 'None recognized'}
- **Detected Manifests:** ${detection.manifests.join(', ') || 'None'}
- **Lockfile / Package Manager:** ${detection.packageManager || (detection.hasConflictingLockfiles ? 'Conflicting lockfiles' : 'None')}
- **CI / Workflows:** ${detection.hasCi ? 'Yes (.github/workflows)' : 'No'}
- **Containerization:** ${detection.hasDocker ? 'Yes (Dockerfile/Compose)' : 'No'}

## Verified Setup Guidance
${setupGuides
  .map(
    (g, idx) =>
      `### ${idx + 1}. ${g.title} [${g.confidence.toUpperCase()}]\n` +
      (g.command ? `\`\`\`bash\n${g.command}\n\`\`\`\n` : '') +
      `- **Evidence:** ${g.evidence}\n` +
      (g.note ? `- **Note:** ${g.note}\n` : '')
  )
  .join('\n')}

---
*Zero code execution. Airgapped read-only analysis.*`;
}

/**
 * Generates structured JSON telemetry.
 * @param {object} data
 * @returns {string}
 */
export function generateJsonReport(data) {
  return JSON.stringify(
    {
      version: 'repology-telemetry-v1',
      generatedAt: new Date().toISOString(),
      target: `${data.owner}/${data.repo}`,
      metadata: data.metadata,
      detection: data.detection,
      setupGuides: data.setupGuides,
      pulse: data.pulse,
      languages: data.languages,
      explainer: data.explainer,
    },
    null,
    2
  );
}

/**
 * Full repository analysis orchestrator.
 * Handles partial failures gracefully.
 *
 * @param {string} owner
 * @param {string} repo
 * @param {(progress: { phase: string, message: string }) => void} [onProgress]
 */
export async function analyzeRepository(owner, repo, onProgress) {
  onProgress?.({ phase: 'metadata', message: 'Fetching repository details from GitHub...' });

  // 1. Fetch metadata
  const metaRes = await getRepoMetadata(owner, repo);
  if (!metaRes.ok) {
    return {
      ok: false,
      error: metaRes.error,
    };
  }

  const metadata = metaRes.data;
  const defaultBranch = metadata.default_branch || 'main';
  const isCacheHit = Boolean(metaRes.isCacheHit);

  onProgress?.({ phase: 'details', message: 'Scanning files, README, and language composition...' });

  // 2. Concurrently fetch root contents, README, and languages
  const [contentsSettled, readmeSettled, languagesSettled] = await Promise.allSettled([
    getRepoContents(owner, repo, defaultBranch),
    getRepoReadme(owner, repo, defaultBranch),
    getRepoLanguages(owner, repo),
  ]);

  let contents = [];
  let contentsError = null;
  if (contentsSettled.status === 'fulfilled' && contentsSettled.value.ok) {
    contents = Array.isArray(contentsSettled.value.data) ? contentsSettled.value.data : [];
  } else if (contentsSettled.status === 'fulfilled') {
    contentsError = contentsSettled.value.error;
  } else {
    contentsError = { kind: 'unknown', message: 'Could not load root directory listing.' };
  }

  let readmeText = null;
  let readmeError = null;
  if (readmeSettled.status === 'fulfilled' && readmeSettled.value.ok) {
    readmeText = typeof readmeSettled.value.data === 'string' ? readmeSettled.value.data : '';
  } else if (readmeSettled.status === 'fulfilled') {
    readmeError = readmeSettled.value.error;
  } else {
    readmeError = { kind: 'unknown', message: 'Could not load README.' };
  }

  let languages = {};
  if (languagesSettled.status === 'fulfilled' && languagesSettled.value.ok) {
    languages = languagesSettled.value.data || {};
  }

  // 3. Run project detection
  const detection = detectProject(contents, metadata.language);

  // 4. If package.json is detected, fetch its content to inspect scripts
  let packageJsonContent = null;
  if (detection.manifests.includes('package.json')) {
    onProgress?.({ phase: 'manifest', message: 'Inspecting package.json for verified scripts...' });
    const pkgRes = await getManifestContent(owner, repo, defaultBranch, 'package.json');
    if (pkgRes.ok && typeof pkgRes.data === 'string') {
      packageJsonContent = pkgRes.data;
    }
  }

  // 5. Generate setup guides & pulse
  const setupGuides = generateSetupGuides({
    detection,
    packageJsonContent,
    owner,
    repo,
    defaultBranch,
  });

  // 6. Generate plain-English functionality explainer & codebase anatomy
  const explainer = explainRepository({
    metadata,
    readmeText,
    contents,
    packageJsonContent,
    owner,
    repo,
    defaultBranch,
  });

  const pulse = calculatePulse(metadata);
  const isPartial = Boolean(contentsError || readmeError);

  return {
    ok: true,
    data: {
      owner,
      repo,
      metadata,
      defaultBranch,
      contents,
      contentsError,
      readmeText,
      readmeError,
      detection,
      setupGuides,
      languages,
      pulse,
      explainer,
      isPartial,
      isCacheHit,
    },
  };
}
