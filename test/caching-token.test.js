import { describe, it, expect, beforeEach } from 'vitest';
import {
  setEphemeralToken,
  getEphemeralToken,
  clearEphemeralToken,
  formatResetCountdown,
  sessionRateLimit,
} from '../src/services/github-api.js';

describe('Ephemeral Token & Live Countdown Engine', () => {
  beforeEach(() => {
    clearEphemeralToken();
  });

  it('manages ephemeral PAT token in sessionStorage', () => {
    expect(getEphemeralToken()).toBeNull();
    expect(sessionRateLimit.hasCustomToken).toBe(false);

    setEphemeralToken('test_custom_token_123');
    expect(getEphemeralToken()).toBe('test_custom_token_123');
    expect(sessionRateLimit.hasCustomToken).toBe(true);

    clearEphemeralToken();
    expect(getEphemeralToken()).toBeNull();
    expect(sessionRateLimit.hasCustomToken).toBe(false);
  });

  it('formats live countdown string correctly', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatResetCountdown(now + 90)).toBe('1m 30s');
    expect(formatResetCountdown(now + 45)).toBe('45s');
    expect(formatResetCountdown(now - 10)).toBe('READY');
    expect(formatResetCountdown(null)).toBe('60/HR');
  });
});
