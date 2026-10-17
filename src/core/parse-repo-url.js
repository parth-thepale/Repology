/**
 * Validates and normalizes GitHub repository inputs into a canonical owner and repo pair.
 *
 * Supported formats:
 * - "owner/repo"
 * - "https://github.com/owner/repo"
 * - "https://github.com/owner/repo/"
 * - "https://github.com/owner/repo.git"
 * - "git@github.com:owner/repo.git"
 * - "https://github.com/owner/repo/tree/main" (normalizes to root owner/repo)
 *
 * Rejects:
 * - Empty or whitespace inputs
 * - Non-GitHub domains (e.g. github.com.example.org, gitlab.com)
 * - Missing owner or repo segments
 * - Malformed URLs
 */

const GITHUB_HOSTS = new Set(['github.com', 'www.github.com']);

// GitHub usernames/orgs: alphanumeric + single hyphens, cannot begin/end with hyphen.
// Repositories: alphanumeric, hyphens, underscores, dots.
const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
const REPO_REGEX = /^[a-zA-Z0-9_.-]+$/;

/**
 * @param {string} input - Raw input string from the user.
 * @returns {{ ok: true, data: { owner: string, repo: string, fullName: string, canonicalUrl: string } } | { ok: false, error: string }}
 */
export function parseRepoUrl(input) {
  if (typeof input !== 'string') {
    return {
      ok: false,
      error: 'Enter a GitHub repository URL or owner/repo, such as vitejs/vite.',
    };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: 'Enter a GitHub repository URL or owner/repo, such as vitejs/vite.',
    };
  }

  let owner = '';
  let repo = '';

  // Check if it's an SSH URL e.g. git@github.com:owner/repo.git
  if (trimmed.startsWith('git@github.com:')) {
    const pathPart = trimmed.slice('git@github.com:'.length);
    const segments = pathPart.split('/').map((s) => s.trim()).filter(Boolean);
    if (segments.length >= 2) {
      owner = segments[0];
      repo = segments[1];
    }
  } else if (trimmed.includes('://') || trimmed.startsWith('//')) {
    // Has a scheme or protocol-relative
    try {
      const url = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed);
      const host = url.hostname.toLowerCase();

      if (!GITHUB_HOSTS.has(host)) {
        return {
          ok: false,
          error: 'Only public repositories on github.com are supported in this version.',
        };
      }

      // Path segments
      const segments = url.pathname.split('/').map((s) => s.trim()).filter(Boolean);
      if (segments.length < 2) {
        return {
          ok: false,
          error: 'Enter a GitHub repository URL or owner/repo, such as vitejs/vite.',
        };
      }

      owner = segments[0];
      repo = segments[1];
    } catch {
      return {
        ok: false,
        error: 'Enter a valid URL or owner/repo format, such as vitejs/vite.',
      };
    }
  } else if (trimmed.includes('/') && !trimmed.startsWith('/') && !trimmed.endsWith('/')) {
    // Candidate for owner/repo or github.com/owner/repo
    const withoutDomain = trimmed.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '');
    const segments = withoutDomain.split('/').map((s) => s.trim()).filter(Boolean);

    if (segments.length >= 2) {
      owner = segments[0];
      repo = segments[1];
    }
  } else if (trimmed.includes('/')) {
    // Might have trailing slashes
    const cleaned = trimmed.replace(/\/+$/, '');
    const withoutDomain = cleaned.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '');
    const segments = withoutDomain.split('/').map((s) => s.trim()).filter(Boolean);

    if (segments.length >= 2) {
      owner = segments[0];
      repo = segments[1];
    }
  }

  // Strip trailing .git suffix from repo if present
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  // Clean any trailing query/hash characters if entered directly
  repo = repo.replace(/[?#].*$/, '');

  if (!owner || !repo) {
    return {
      ok: false,
      error: 'Enter a GitHub repository URL or owner/repo, such as vitejs/vite.',
    };
  }

  // Validate owner and repo format
  if (!OWNER_REGEX.test(owner) || !REPO_REGEX.test(repo)) {
    return {
      ok: false,
      error: 'Repository path contains invalid characters. Expected format: owner/repo.',
    };
  }

  const fullName = `${owner}/${repo}`;
  const canonicalUrl = `https://github.com/${owner}/${repo}`;

  return {
    ok: true,
    data: {
      owner,
      repo,
      fullName,
      canonicalUrl,
    },
  };
}
