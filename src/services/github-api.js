/**
 * GitHub REST API client with local persistent cache (30m TTL), in-flight request deduplication,
 * real-time rate limit tracking with countdown formatting, and optional ephemeral PAT token support.
 */

const BASE_URL = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const CACHE_MAX_ENTRIES = 40;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const STORAGE_CACHE_PREFIX = 'repology_cache_v1_';
const TOKEN_STORAGE_KEY = 'repology_ephemeral_pat';

/**
 * @typedef {'not-found' | 'rate-limit' | 'network' | 'forbidden' | 'invalid-response' | 'unknown'} ApiErrorKind
 *
 * @typedef {Object} ApiError
 * @property {ApiErrorKind} kind
 * @property {number} status
 * @property {string} message
 * @property {number | null} rateLimitReset - Unix epoch timestamp (seconds) when rate limit resets
 * @property {number | null} rateLimitRemaining
 * @property {string | null} resetTimeFormatted
 */

/**
 * Global rate-limit tracking for the current session.
 */
export const sessionRateLimit = {
  remaining: null,
  limit: null,
  resetEpoch: null,
  isLimited: false,
  hasCustomToken: false,
};

/**
 * In-memory fallback FIFO cache
 */
const responseCache = new Map();

/**
 * In-flight promise map to deduplicate simultaneous requests
 */
const inFlightRequests = new Map();

/**
 * Retrieve ephemeral token from sessionStorage if provided by user.
 * Held strictly in browser memory.
 * @returns {string | null}
 */
export function getEphemeralToken() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const token = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
      sessionRateLimit.hasCustomToken = Boolean(token);
      return token;
    }
  } catch {
    // Storage inaccessible
  }
  return null;
}

/**
 * Save user-entered ephemeral token into sessionStorage.
 * @param {string} token
 */
export function setEphemeralToken(token) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (token && token.trim()) {
        window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
        sessionRateLimit.hasCustomToken = true;
      } else {
        window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionRateLimit.hasCustomToken = false;
      }
    }
  } catch {
    // Storage inaccessible
  }
}

/**
 * Clear the ephemeral token.
 */
export function clearEphemeralToken() {
  setEphemeralToken('');
}

/**
 * Clear the in-memory and localStorage caches.
 */
export function clearApiCache() {
  responseCache.clear();
  inFlightRequests.clear();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  } catch {
    // LocalStorage error
  }
}

/**
 * Format unix timestamp in seconds to a human-readable local time (e.g. 23:45).
 * @param {number} epochSeconds
 * @returns {string}
 */
export function formatResetTime(epochSeconds) {
  if (!epochSeconds) return 'shortly';
  try {
    const date = new Date(epochSeconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'shortly';
  }
}

/**
 * Formats a live remaining countdown (e.g. "14m 22s" or "45s").
 * @param {number | null} epochSeconds
 * @returns {string}
 */
export function formatResetCountdown(epochSeconds) {
  if (!epochSeconds) return '60/HR';
  const now = Math.floor(Date.now() / 1000);
  const diff = epochSeconds - now;
  if (diff <= 0) return 'READY';
  if (diff < 60) return `${diff}s`;
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

/**
 * Inspect response headers and update session rate limit state.
 * @param {Headers} headers
 */
export function recordRateLimitHeaders(headers) {
  if (!headers) return;
  const remaining = headers.get('x-ratelimit-remaining');
  const limit = headers.get('x-ratelimit-limit');
  const reset = headers.get('x-ratelimit-reset');

  if (remaining !== null) {
    sessionRateLimit.remaining = parseInt(remaining, 10);
    sessionRateLimit.isLimited = sessionRateLimit.remaining === 0;
  }
  if (limit !== null) {
    sessionRateLimit.limit = parseInt(limit, 10);
  }
  if (reset !== null) {
    sessionRateLimit.resetEpoch = parseInt(reset, 10);
  }
}

/**
 * Normalizes an HTTP response or fetch error into a standardized ApiError.
 * @param {Response | Error | unknown} errorOrResponse
 * @param {string} [contextMessage]
 * @returns {ApiError}
 */
export function normalizeApiError(errorOrResponse, contextMessage = '') {
  if (errorOrResponse instanceof Response) {
    const status = errorOrResponse.status;
    const remaining = errorOrResponse.headers.get('x-ratelimit-remaining');
    const reset = errorOrResponse.headers.get('x-ratelimit-reset');
    const resetEpoch = reset ? parseInt(reset, 10) : null;
    const formattedReset = resetEpoch ? formatResetTime(resetEpoch) : null;

    if (status === 404) {
      return {
        kind: 'not-found',
        status,
        message: 'We couldn’t access this repository. Check the URL and make sure it is public.',
        rateLimitReset: resetEpoch,
        rateLimitRemaining: remaining ? parseInt(remaining, 10) : null,
        resetTimeFormatted: formattedReset,
      };
    }

    if (status === 403 || status === 429) {
      return {
        kind: 'rate-limit',
        status,
        message: formattedReset
          ? `GitHub is limiting requests from this network right now. Limit resets around ${formattedReset}.`
          : 'GitHub is limiting requests from this network right now. Wait for the limit to reset, or try again later.',
        rateLimitReset: resetEpoch,
        rateLimitRemaining: remaining ? parseInt(remaining, 10) : 0,
        resetTimeFormatted: formattedReset,
      };
    }

    return {
      kind: 'unknown',
      status,
      message: contextMessage || `GitHub API returned HTTP ${status}. Please try again later.`,
      rateLimitReset: resetEpoch,
      rateLimitRemaining: remaining ? parseInt(remaining, 10) : null,
      resetTimeFormatted: formattedReset,
    };
  }

  if (errorOrResponse instanceof Error) {
    if (errorOrResponse.name === 'AbortError') {
      return {
        kind: 'network',
        status: 0,
        message: 'Request was cancelled.',
        rateLimitReset: null,
        rateLimitRemaining: null,
        resetTimeFormatted: null,
      };
    }

    return {
      kind: 'network',
      status: 0,
      message: 'Couldn’t reach GitHub. Check your internet connection and retry.',
      rateLimitReset: null,
      rateLimitRemaining: null,
      resetTimeFormatted: null,
    };
  }

  return {
    kind: 'unknown',
    status: 0,
    message: 'An unexpected error occurred while contacting GitHub.',
    rateLimitReset: null,
    rateLimitRemaining: null,
    resetTimeFormatted: null,
  };
}

/**
 * Retrieve cached item from localStorage if valid.
 * @param {string} key
 * @returns {any | null}
 */
function getFromPersistentCache(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_CACHE_PREFIX + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        return parsed.data;
      }
      window.localStorage.removeItem(STORAGE_CACHE_PREFIX + key);
    }
  } catch {
    // LocalStorage quota or parse error
  }
  return null;
}

/**
 * Save item to persistent localStorage cache.
 * @param {string} key
 * @param {any} data
 */
function saveToPersistentCache(key, data) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        STORAGE_CACHE_PREFIX + key,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    }
  } catch {
    // Storage quota reached; non-critical
  }
}

/**
 * Low-level GitHub fetcher with persistent local cache, deduplication, and rate-limit tracking.
 * @param {string} endpoint - Relative path (e.g. '/repos/owner/repo')
 * @param {RequestInit & { bypassCache?: boolean, asRawText?: boolean }} [options]
 * @returns {Promise<{ ok: true, data: any, headers?: Headers, isCacheHit?: boolean } | { ok: false, error: ApiError }>}
 */
export async function githubFetch(endpoint, options = {}) {
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  const cacheKey = `${url}:${options.asRawText ? 'text' : 'json'}`;

  // 1. Check in-memory & persistent localStorage cache
  if (!options.bypassCache) {
    if (responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey);
      return { ok: true, data: cached.data, headers: cached.headers, isCacheHit: true };
    }
    const persisted = getFromPersistentCache(cacheKey);
    if (persisted !== null) {
      responseCache.set(cacheKey, { data: persisted, headers: new Headers() });
      return { ok: true, data: persisted, isCacheHit: true };
    }
  }

  // 2. Deduplicate in-flight requests to identical endpoint
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const headers = new Headers(options.headers || {});
      headers.set('Accept', options.asRawText ? 'application/vnd.github.raw' : 'application/vnd.github+json');
      headers.set('X-GitHub-Api-Version', API_VERSION);

      // Check for user-provided ephemeral PAT token
      const token = getEphemeralToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      recordRateLimitHeaders(response.headers);

      if (!response.ok) {
        const error = normalizeApiError(response);
        return { ok: false, error };
      }

      const data = options.asRawText ? await response.text() : await response.json();

      // Store in memory FIFO cache
      if (responseCache.size >= CACHE_MAX_ENTRIES) {
        const oldestKey = responseCache.keys().next().value;
        responseCache.delete(oldestKey);
      }
      responseCache.set(cacheKey, { data, headers: response.headers });

      // Save to persistent cache (only for JSON API payloads, not huge raw texts)
      if (!options.asRawText) {
        saveToPersistentCache(cacheKey, data);
      }

      return { ok: true, data, headers: response.headers, isCacheHit: false };
    } catch (err) {
      const error = normalizeApiError(err);
      return { ok: false, error };
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Proactively inspects the unauthenticated rate limit quota from GitHub.
 * This endpoint (/rate_limit) does not consume or decrement your rate limit budget.
 * @returns {Promise<{ ok: boolean, remaining?: number, limit?: number, resetEpoch?: number }>}
 */
export async function probeInitialRateLimit() {
  try {
    const res = await githubFetch('/rate_limit', { bypassCache: true });
    if (res.ok && res.data && res.data.resources?.core) {
      const core = res.data.resources.core;
      sessionRateLimit.remaining = core.remaining;
      sessionRateLimit.limit = core.limit;
      sessionRateLimit.resetEpoch = core.reset;
      sessionRateLimit.isLimited = core.remaining === 0;
      return {
        ok: true,
        remaining: core.remaining,
        limit: core.limit,
        resetEpoch: core.reset,
      };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
