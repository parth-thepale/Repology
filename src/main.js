/**
 * Main application wiring and state manager:
 * - URL state synchronization (?target=owner/repo or ?repo=owner/repo)
 * - Live mission-control rate telemetry engine with live second-by-second countdown
 * - Ephemeral PAT token dialog integration (60/hr -> 5000/hr)
 * - Global keyboard shortcuts (1-5 tabs, / or ⌘K search, ESC reset)
 * - Instant 0ms offline demo mode snapshot
 * - Race-condition guard for in-flight requests (QA-18)
 */

import { parseRepoUrl } from './core/parse-repo-url.js';
import { analyzeRepository } from './services/repository-service.js';
import {
  sessionRateLimit,
  formatResetTime,
  formatResetCountdown,
  probeInitialRateLimit,
  setEphemeralToken,
  clearEphemeralToken,
  getEphemeralToken,
} from './services/github-api.js';
import { DEMO_SNAPSHOT } from './services/demo-snapshot.js';
import { renderLanding } from './ui/render-landing.js';
import { renderResults } from './ui/render-results.js';
import { renderLoadingSkeleton, renderErrorState } from './ui/render-states.js';

const getAppContainer = () => document.getElementById('app');

let currentRequestId = 0;
let lastSearchedRepo = '';

/**
 * Updates sticky top-bar rate limit telemetry counters & live countdown
 */
function updateHeaderTelemetry() {
  const remainingEl = document.getElementById('telemetry-rate-remaining');
  const resetEl = document.getElementById('telemetry-rate-reset');
  const tokenBadgeEl = document.getElementById('telemetry-token-status');

  if (tokenBadgeEl) {
    const hasToken = Boolean(getEphemeralToken());
    tokenBadgeEl.textContent = hasToken ? '[TOKEN_5K]' : '[NO_TOKEN]';
    tokenBadgeEl.style.color = hasToken ? '#10B981' : '';
  }

  if (remainingEl) {
    if (sessionRateLimit.remaining !== null) {
      const total = sessionRateLimit.limit || (sessionRateLimit.hasCustomToken ? 5000 : 60);
      remainingEl.textContent = `${sessionRateLimit.remaining}/${total}`;
      remainingEl.style.color = sessionRateLimit.remaining === 0 ? '#EF4444' : '';
    } else {
      remainingEl.textContent = 'READY';
      remainingEl.style.color = '';
    }
  }

  if (resetEl) {
    if (sessionRateLimit.resetEpoch !== null) {
      resetEl.textContent = formatResetCountdown(sessionRateLimit.resetEpoch);
    } else {
      resetEl.textContent = sessionRateLimit.hasCustomToken ? '5K/HR' : '60/HR';
    }
  }
}

/**
 * Read repo query or hash from current location.
 * Supports both ?target=owner/repo and ?repo=owner/repo
 * @returns {string}
 */
function getRepoFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const target = params.get('target') || params.get('repo');
  if (target) return target.trim();

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
    currentUrl.searchParams.set('target', repoFullName);
    currentUrl.searchParams.delete('repo');
    currentUrl.hash = '';
    window.history.pushState({ target: repoFullName }, '', currentUrl.toString());
  } else {
    currentUrl.searchParams.delete('target');
    currentUrl.searchParams.delete('repo');
    currentUrl.hash = '';
    window.history.pushState({}, '', currentUrl.pathname);
  }
}

/**
 * Synchronize document title, meta description, and OpenGraph tags dynamically for SEO.
 * @param {object} params
 */
export function updateSeoMeta({ title, description, canonicalUrl, ogTitle, ogDescription }) {
  if (title) {
    document.title = title;
  }

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta && description) {
    descMeta.setAttribute('content', description);
  }

  const ogTitleMeta = document.querySelector('meta[property="og:title"]');
  if (ogTitleMeta && (ogTitle || title)) {
    ogTitleMeta.setAttribute('content', ogTitle || title);
  }

  const ogDescMeta = document.querySelector('meta[property="og:description"]');
  if (ogDescMeta && (ogDescription || description)) {
    ogDescMeta.setAttribute('content', ogDescription || description);
  }

  const twitterTitleMeta = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitleMeta && (ogTitle || title)) {
    twitterTitleMeta.setAttribute('content', ogTitle || title);
  }

  const twitterDescMeta = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescMeta && (ogDescription || description)) {
    twitterDescMeta.setAttribute('content', ogDescription || description);
  }

  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink && canonicalUrl) {
    canonicalLink.setAttribute('href', canonicalUrl);
  }
}

/**
 * Transition to Landing view.
 * @param {string} [initialError='']
 */
export function showLanding(initialError = '') {
  currentRequestId++;
  syncUrlWithRepo('');
  updateSeoMeta({
    title: 'REPOLOGY // REPOSITORY_ORIENTATION_CONTROL_PLANE',
    description:
      'High-density industrial orientation control plane for public GitHub repositories. Instant plain-English functionality explanations, verified manifests, setup signals, file tree architecture, and safe contribution vectors.',
    canonicalUrl: 'https://repology.vercel.app/',
    ogTitle: 'REPOLOGY // REPOSITORY_ORIENTATION_CONTROL_PLANE',
    ogDescription:
      'Every repository has a story. Understand it before you open the code. High-density GitHub orientation radar.',
  });

  const appContainer = getAppContainer();
  if (!appContainer) return;

  renderLanding(appContainer, {
    initialValue: lastSearchedRepo,
    initialError,
    onSubmit: (input) => {
      handleExplore(input);
    },
    onLoadDemo: () => {
      handleLoadDemo();
    },
  });
}

/**
 * Loads the 0ms pre-cached offline demo snapshot.
 */
export function handleLoadDemo() {
  currentRequestId++;
  lastSearchedRepo = `${DEMO_SNAPSHOT.owner}/${DEMO_SNAPSHOT.repo}`;
  syncUrlWithRepo(lastSearchedRepo);
  updateSeoMeta({
    title: `${lastSearchedRepo.toUpperCase()} // DEMO_TELEMETRY // REPOLOGY`,
    description: `Explore ${lastSearchedRepo} on Repology: Next generation frontend tooling. Verified tech stack, package manager, and honest setup commands.`,
    canonicalUrl: `https://repology.vercel.app/?target=${lastSearchedRepo}`,
  });

  const appContainer = getAppContainer();
  if (!appContainer) return;

  renderResults(appContainer, {
    data: DEMO_SNAPSHOT,
    onChangeRepo: () => showLanding(),
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

  // Update initial page title & meta for loading phase
  updateSeoMeta({
    title: `${fullName.toUpperCase()} // PROBING_TELEMETRY // REPOLOGY`,
    description: `Probing repository ${fullName} for architecture, manifests, and setup signals.`,
    canonicalUrl: `https://repology.vercel.app/?target=${fullName}`,
  });

  const appContainer = getAppContainer();
  if (!appContainer) return;

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

  // Update SEO metadata dynamically with analyzed repository facts
  const repoDesc =
    result.data.explainer?.overviewExplanation ||
    result.data.metadata?.description ||
    `Explore ${fullName} repository architecture, setup guides, and telemetry on Repology.`;

  updateSeoMeta({
    title: `${fullName.toUpperCase()} // REPOLOGY_TELEMETRY`,
    description: repoDesc.length > 200 ? repoDesc.slice(0, 197) + '...' : repoDesc,
    canonicalUrl: `https://repology.vercel.app/?target=${fullName}`,
    ogTitle: `${fullName} // Repository Orientation Telemetry`,
    ogDescription: repoDesc.length > 200 ? repoDesc.slice(0, 197) + '...' : repoDesc,
  });

  renderResults(appContainer, {
    data: result.data,
    onChangeRepo: () => showLanding(),
  });
}

/**
 * Setup PAT Token Dialog Interactions
 */
function setupTokenDialog() {
  const dialog = document.getElementById('token-dialog');
  const triggerBtn = document.getElementById('header-rate-telemetry');
  const closeBtn = document.getElementById('btn-close-dialog');
  const saveBtn = document.getElementById('btn-save-token');
  const clearBtn = document.getElementById('btn-clear-token');
  const tokenInput = document.getElementById('input-pat-token');

  if (!dialog || !triggerBtn) return;

  triggerBtn.addEventListener('click', () => {
    if (tokenInput) {
      tokenInput.value = getEphemeralToken() || '';
    }
    dialog.showModal();
  });

  closeBtn?.addEventListener('click', () => {
    dialog.close();
  });

  saveBtn?.addEventListener('click', async () => {
    if (tokenInput) {
      setEphemeralToken(tokenInput.value);
      dialog.close();
      await probeInitialRateLimit();
      updateHeaderTelemetry();
    }
  });

  clearBtn?.addEventListener('click', async () => {
    clearEphemeralToken();
    if (tokenInput) tokenInput.value = '';
    dialog.close();
    await probeInitialRateLimit();
    updateHeaderTelemetry();
  });
}

/**
 * Initialize app on page load
 */
function init() {
  const appContainer = getAppContainer();
  if (!appContainer) return;

  // Brand header logo click returns to landing
  const brandLink = document.getElementById('brand-home-link');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLanding();
    });
  }

  // Setup Ephemeral Token Dialog
  setupTokenDialog();

  // Global Keyboard shortcuts:
  // - '/' or 'Cmd+K' to focus search
  // - 'ESC' to return home / close dialog
  // - '1'-'5' to switch tabs in results
  window.addEventListener('keydown', (e) => {
    const dialog = document.getElementById('token-dialog');
    const isModalOpen = dialog && dialog.open;

    if (e.key === 'Escape') {
      if (isModalOpen) {
        dialog.close();
      } else {
        showLanding();
      }
    } else if (
      (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) &&
      !isModalOpen &&
      document.activeElement?.tagName !== 'INPUT'
    ) {
      e.preventDefault();
      const input = document.getElementById('repo-url-input');
      if (input) {
        input.focus();
        input.select();
      } else {
        showLanding();
      }
    } else if (
      ['1', '2', '3', '4', '5', '6', '7'].includes(e.key) &&
      !isModalOpen &&
      document.activeElement?.tagName !== 'INPUT' &&
      document.activeElement?.tagName !== 'TEXTAREA'
    ) {
      const tabMap = {
        '1': 'tab-overview',
        '2': 'tab-files',
        '3': 'tab-setup',
        '4': 'tab-readme',
        '5': 'tab-contribute',
        '6': 'tab-env',
        '7': 'tab-deps',
      };
      const tabBtn = document.getElementById(tabMap[e.key]);
      if (tabBtn) {
        tabBtn.click();
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

  // Second-by-second live countdown telemetry ticker
  setInterval(updateHeaderTelemetry, 1000);

  // Proactively probe GitHub rate limit quota on boot
  probeInitialRateLimit()
    .then(() => updateHeaderTelemetry())
    .catch(() => {});

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
