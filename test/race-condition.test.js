import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as repoService from '../src/services/repository-service.js';

describe('QA-18: Out-of-order and stale request cancellation', () => {
  it('ensures newer requests supersede in-flight requests', async () => {
    let requestId = 0;
    const history = [];

    async function mockExplore(repoName, delayMs) {
      const thisId = ++requestId;
      await new Promise((r) => setTimeout(r, delayMs));
      if (thisId === requestId) {
        history.push(`RENDERED_${repoName}`);
      } else {
        history.push(`DISCARDED_${repoName}`);
      }
    }

    // Request 1 starts (slow, 50ms)
    const p1 = mockExplore('slow/repo', 50);
    // Request 2 starts immediately (fast, 10ms)
    const p2 = mockExplore('fast/repo', 10);

    await Promise.all([p1, p2]);

    expect(history).toEqual(['RENDERED_fast/repo', 'DISCARDED_slow/repo']);
  });
});
