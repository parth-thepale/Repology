import { describe, it, expect } from 'vitest';
import { normalizeApiError, formatResetTime } from '../src/services/github-api.js';

describe('github-api normalizeApiError', () => {
  it('QA-07: normalizes 404 response to not-found error', () => {
    const mockResponse = new Response('Not Found', {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'x-ratelimit-remaining': '45',
        'x-ratelimit-reset': '1700000000',
      },
    });

    const error = normalizeApiError(mockResponse);
    expect(error.kind).toBe('not-found');
    expect(error.status).toBe(404);
    expect(error.message).toContain('We couldn’t access this repository');
  });

  it('QA-14: normalizes 403 rate limit response with reset guidance', () => {
    const futureEpoch = Math.floor(Date.now() / 1000) + 1800; // 30 min from now
    const mockResponse = new Response('API rate limit exceeded', {
      status: 403,
      statusText: 'Forbidden',
      headers: {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(futureEpoch),
      },
    });

    const error = normalizeApiError(mockResponse);
    expect(error.kind).toBe('rate-limit');
    expect(error.status).toBe(403);
    expect(error.rateLimitRemaining).toBe(0);
    expect(error.message).toContain('GitHub is limiting requests from this network');
    expect(error.resetTimeFormatted).toBeTruthy();
  });

  it('QA-13: normalizes network failure / TypeError', () => {
    const networkError = new TypeError('Failed to fetch');
    const error = normalizeApiError(networkError);
    expect(error.kind).toBe('network');
    expect(error.message).toContain('Couldn’t reach GitHub');
  });

  it('formats reset time nicely', () => {
    const epoch = 1700000000;
    const formatted = formatResetTime(epoch);
    expect(formatted).not.toBe('shortly');
    expect(typeof formatted).toBe('string');
  });
});
