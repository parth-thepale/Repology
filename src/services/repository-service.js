/**
 * Repository service: coordinates high-level repository data fetching.
 * Preserves partial successes: a README 404 does not fail file contents or metadata.
 */

import { githubFetch } from './github-api.js';
import { detectProject } from '../core/detect-project.js';
import { generateSetupGuides } from '../core/setup-guides.js';

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
  // Use asRawText to get actual raw markdown
  const res = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme?ref=${encodeURIComponent(
      defaultBranch
    )}`,
    { asRawText: true }
  );

  return res;
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
 * Full repository analysis orchestrator.
 * Handles partial failures gracefully:
 * - If metadata fails -> whole request fails
 * - If readme or contents fail -> partial success state
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

  onProgress?.({ phase: 'details', message: 'Scanning files, README, and setup signals...' });

  // 2. Concurrently fetch root contents and README
  const [contentsSettled, readmeSettled] = await Promise.allSettled([
    getRepoContents(owner, repo, defaultBranch),
    getRepoReadme(owner, repo, defaultBranch),
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

  // 5. Generate setup guides
  const setupGuides = generateSetupGuides({
    detection,
    packageJsonContent,
    owner,
    repo,
    defaultBranch,
  });

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
      isPartial,
    },
  };
}
