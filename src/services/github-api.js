/**
 * GitHub REST API client with bounded in-memory cache, in-flight request deduplication,
 * rate limit inspection, and error classification.
 */

const BASE_URL = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const CACHE_MAX_ENTRIES = 30;

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
};

/**
 * FIFO in-memory cache: Map<url, { data, timestamp }>
 */
const responseCache = new Map();

/**
 * Map of in-flight promises to deduplicate simultaneous requests: Map<url, Promise<any>>
 */
const inFlightRequests = new Map();

/**
 * Clear the in-memory cache (useful for tests or manual reload).
 */
export function clearApiCache() {
  responseCache.clear();
  inFlightRequests.clear();
}

/**
 * Format unix timestamp in seconds to a human-readable local time.
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
    if (sessionRateLimit.remaining === 0) {
      sessionRateLimit.isLimited = true;
    }
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
      const isRateLimit = remaining === '0' || errorOrResponse.headers.has('retry-after');
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

  // Network / TypeError (offline, CORS failure, aborted)
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
 * Low-level GitHub fetcher with caching, deduplication, and rate-limit tracking.
 * @param {string} endpoint - Relative path (e.g. '/repos/owner/repo')
 * @param {RequestInit & { bypassCache?: boolean, asRawText?: boolean }} [options]
 * @returns {Promise<{ ok: true, data: any, headers: Headers } | { ok: false, error: ApiError }>}
 */
export async function githubFetch(endpoint, options = {}) {
  // Ensure endpoint is relative and safe
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  const cacheKey = `${url}:${options.asRawText ? 'text' : 'json'}`;

  // 1. Check in-memory cache (unless explicitly bypassed)
  if (!options.bypassCache && responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    return { ok: true, data: cached.data, headers: cached.headers };
  }

  // 2. Deduplicate in-flight requests to the exact same endpoint
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const headers = new Headers(options.headers || {});
      headers.set('Accept', options.asRawText ? 'application/vnd.github.raw' : 'application/vnd.github+json');
      headers.set('X-GitHub-Api-Version', API_VERSION);

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

      // Store in FIFO cache
      if (responseCache.size >= CACHE_MAX_ENTRIES) {
        const oldestKey = responseCache.keys().next().value;
        responseCache.delete(oldestKey);
      }
      responseCache.set(cacheKey, { data, headers: response.headers });

      return { ok: true, data, headers: response.headers };
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
