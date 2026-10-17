import { describe, it, expect } from 'vitest';
import { parseRepoUrl } from '../src/core/parse-repo-url.js';

describe('parseRepoUrl', () => {
  it('QA-01: parses simple owner/repo shorthand', () => {
    const res = parseRepoUrl('vitejs/vite');
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({
      owner: 'vitejs',
      repo: 'vite',
      fullName: 'vitejs/vite',
      canonicalUrl: 'https://github.com/vitejs/vite',
    });
  });

  it('QA-02: parses canonical URL with trailing slash', () => {
    const res = parseRepoUrl('https://github.com/vitejs/vite/');
    expect(res.ok).toBe(true);
    expect(res.data.owner).toBe('vitejs');
    expect(res.data.repo).toBe('vite');
    expect(res.data.fullName).toBe('vitejs/vite');
  });

  it('QA-03: parses URL ending in .git', () => {
    const res = parseRepoUrl('https://github.com/expressjs/express.git');
    expect(res.ok).toBe(true);
    expect(res.data.owner).toBe('expressjs');
    expect(res.data.repo).toBe('express');
  });

  it('parses shorthand ending in .git', () => {
    const res = parseRepoUrl('expressjs/express.git');
    expect(res.ok).toBe(true);
    expect(res.data.owner).toBe('expressjs');
    expect(res.data.repo).toBe('express');
  });

  it('QA-04: rejects github.com with no repo segment', () => {
    const res1 = parseRepoUrl('https://github.com');
    expect(res1.ok).toBe(false);
    expect(res1.error).toContain('Enter a GitHub repository URL');

    const res2 = parseRepoUrl('https://github.com/vitejs');
    expect(res2.ok).toBe(false);
  });

  it('QA-05: rejects non-github look-alike hosts without making network request', () => {
    const res = parseRepoUrl('https://github.com.example.org/a/b');
    expect(res.ok).toBe(false);
    expect(res.error).toContain('Only public repositories on github.com are supported');
  });

  it('QA-06: rejects malformed or empty inputs', () => {
    expect(parseRepoUrl('').ok).toBe(false);
    expect(parseRepoUrl('   ').ok).toBe(false);
    expect(parseRepoUrl(null).ok).toBe(false);
    expect(parseRepoUrl('not-a-repo').ok).toBe(false);
  });

  it('normalizes tree / branch subpath to repository root', () => {
    const res = parseRepoUrl('https://github.com/facebook/react/tree/main');
    expect(res.ok).toBe(true);
    expect(res.data.owner).toBe('facebook');
    expect(res.data.repo).toBe('react');
  });

  it('handles git@github.com SSH url', () => {
    const res = parseRepoUrl('git@github.com:torvalds/linux.git');
    expect(res.ok).toBe(true);
    expect(res.data.owner).toBe('torvalds');
    expect(res.data.repo).toBe('linux');
  });
});
