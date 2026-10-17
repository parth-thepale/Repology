/**
 * Main application wiring and state manager:
 * - URL state synchronization (?repo=owner/repo or #owner/repo)
 * - Live mission-control header telemetry synchronization (quota, reset time)
 * - Keyboard shortcuts (ESC to reset, ⌘K to search)
 * - Race-condition guard for in-flight requests (QA-18)
 * - Accessible state transitions (landing -> loading -> results / error)
 */

import { parseRepoUrl } from './core/parse-repo-url.js';
import { analyzeRepository } from './services/repository-service.js';
import { sessionRateLimit, formatResetTime } from './services/github-api.js';
import { renderLanding } from './ui/render-landing.js';
import { renderResults } from './ui/render-results.js';
import { renderLoadingSkeleton, renderErrorState } from './ui/render-states.js';

const appContainer = document.getElementById('app');

let currentRequestId = 0;
let lastSearchedRepo = '';

/**
 * Updates sticky top-bar rate limit telemetry counters
 */
function updateHeaderTelemetry() {
  const remainingEl = document.getElementById('telemetry-rate-remaining');
  const resetEl = document.getElementById('telemetry-rate-reset');

  if (remainingEl && sessionRateLimit.remaining !== null) {
    const total = sessionRateLimit.limit || 60;
    remainingEl.textContent = `${sessionRateLimit.remaining}/${total}`;
  }

  if (resetEl && sessionRateLimit.resetEpoch !== null) {
    resetEl.textContent = formatResetTime(sessionRateLimit.resetEpoch);
  }
}

/**
 * Read repo query or hash from current location.
 * @returns {string}
 */
function getRepoFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const qRepo = params.get('repo');
  if (qRepo) return qRepo.trim();

  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (hash) return hash;

  return '';
}

/**
 * Update browser URL query string without page reload.
 * @param {string} repoFullName
 */
function syncUrlWithRepo(repoFullName) {
  const currentUrl = new URL(window.location.href);
  if (repoFullName) {
    currentUrl.searchParams.set('repo', repoFullName);
    currentUrl.hash = '';
    window.history.pushState({ repo: repoFullName }, '', currentUrl.toString());
  } else {
    currentUrl.searchParams.delete('repo');
    currentUrl.hash = '';
    window.history.pushState({}, '', currentUrl.pathname);
  }
}

/**
 * Transition to Landing view.
 * @param {string} [initialError='']
 */
export function showLanding(initialError = '') {
  currentRequestId++;
  syncUrlWithRepo('');
  document.title = 'REPOLOGY // REPOSITORY_ORIENTATION_CONTROL_PLANE';

  renderLanding(appContainer, {
    initialValue: lastSearchedRepo,
    initialError,
    onSubmit: (input) => {
      handleExplore(input);
    },
  });
}

/**
 * Main exploration dispatcher.
 * @param {string} rawInput
 */
export async function handleExplore(rawInput) {
  // 1. Client-side validation before network request (FR-02)
  const parsed = parseRepoUrl(rawInput);
  if (!parsed.ok) {
    showLanding(parsed.error);
    return;
  }

  const { owner, repo, fullName } = parsed.data;
  lastSearchedRepo = fullName;
  syncUrlWithRepo(fullName);

  // Update page title
  document.title = `${fullName.toUpperCase()} // REPOLOGY_TELEMETRY`;

  // Increment request ID to guard against out-of-order race conditions (QA-18)
  const thisRequestId = ++currentRequestId;

  // 2. Render accessible radar loading state
  renderLoadingSkeleton(appContainer, `PROBING_GITHUB_API [TARGET: ${fullName}]...`);

  // 3. Fetch data via orchestrator
  const result = await analyzeRepository(owner, repo, (progress) => {
    if (thisRequestId === currentRequestId) {
      const statusEl = appContainer.querySelector('.loading-status-text');
      if (statusEl) {
        statusEl.textContent = `> ${progress.message.toUpperCase()}`;
      }
    }
  });

  // Sync header rate quota telemetry
  updateHeaderTelemetry();

  // Check if user started another request while this was in-flight
  if (thisRequestId !== currentRequestId) {
    return;
  }

  // 4. Render results or error
  if (!result.ok) {
    renderErrorState(appContainer, {
      error: result.error,
      onRetry: () => handleExplore(fullName),
      onReset: () => showLanding(),
    });
    return;
  }

  renderResults(appContainer, {
    data: result.data,
    onChangeRepo: () => showLanding(),
  });
}

/**
 * Initialize app on page load
 */
function init() {
  // Brand header logo click returns to landing
  const brandLink = document.getElementById('brand-home-link');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLanding();
    });
  }

  // Keyboard shortcut listeners (ESC to return home, ⌘K to search)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      showLanding();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.getElementById('repo-url-input');
      if (input) {
        input.focus();
        input.select();
      } else {
        showLanding();
      }
    }
  });

  // Handle browser back/forward navigation
  window.addEventListener('popstate', () => {
    const repoFromUrl = getRepoFromUrl();
    if (repoFromUrl) {
      handleExplore(repoFromUrl);
    } else {
      showLanding();
    }
  });

  // Check for initial repository in URL
  const initialRepo = getRepoFromUrl();
  if (initialRepo) {
    handleExplore(initialRepo);
  } else {
    showLanding();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
