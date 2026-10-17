/**
 * Main application wiring and state manager:
 * - URL state synchronization (?repo=owner/repo or #owner/repo)
 * - Race-condition guard for in-flight requests (QA-18)
 * - Accessible state transitions (landing -> loading -> results / error)
 * - Keyboard navigation and brand reset handler
 */

import { parseRepoUrl } from './core/parse-repo-url.js';
import { analyzeRepository } from './services/repository-service.js';
import { renderLanding } from './ui/render-landing.js';
import { renderResults } from './ui/render-results.js';
import { renderLoadingSkeleton, renderErrorState } from './ui/render-states.js';

const appContainer = document.getElementById('app');

/**
 * Global state tracker
 */
let currentRequestId = 0;
let lastSearchedRepo = '';

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
  document.title = 'Repology — Understand the code. Find your way in.';

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
  document.title = `${fullName} — Repology Orientation`;

  // Increment request ID to guard against out-of-order race conditions (QA-18)
  const thisRequestId = ++currentRequestId;

  // 2. Render accessible loading state
  renderLoadingSkeleton(appContainer, `Connecting to GitHub for ${fullName}...`);

  // 3. Fetch data via orchestrator
  const result = await analyzeRepository(owner, repo, (progress) => {
    // Only update progress if this request is still active
    if (thisRequestId === currentRequestId) {
      const statusEl = appContainer.querySelector('.loading-status-text');
      if (statusEl) {
        statusEl.textContent = progress.message;
      }
    }
  });

  // Check if user started another request while this was in-flight
  if (thisRequestId !== currentRequestId) {
    // Discard stale result
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

// Start application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
