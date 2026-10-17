import { describe, it, expect } from 'vitest';
import { sanitizeReadmeHtml, rewriteRelativeGithubLinks, extractHeadings } from '../src/ui/render-readme.js';

describe('README Security and Sanitization', () => {
  it('SEC-01: strips script tags and executable code', () => {
    const malicious = '<p>Normal text</p><script>alert("xss")</script><script src="evil.js"></script>';
    const sanitized = sanitizeReadmeHtml(malicious);
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('alert(');
    expect(sanitized).toContain('Normal text');
  });

  it('SEC-02: strips event handlers like onerror and onload', () => {
    const malicious = '<img src="invalid.jpg" onerror="alert(document.cookie)" onload="alert(1)" />';
    const sanitized = sanitizeReadmeHtml(malicious);
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('onload');
    expect(sanitized).not.toContain('alert');
  });

  it('SEC-03: neutralizes javascript: and data: pseudo-protocol links', () => {
    const malicious = '<a href="javascript:alert(1)">Click Me</a><a href="data:text/html,<script>alert(1)</script>">Data URI</a>';
    const sanitized = sanitizeReadmeHtml(malicious);
    const rewritten = rewriteRelativeGithubLinks(sanitized, 'owner', 'repo', 'main');
    expect(rewritten).not.toContain('javascript:alert(1)');
    expect(rewritten).not.toContain('data:text/html');
  });

  it('SEC-04: repository HTML in descriptions or text is escaped inertly', () => {
    const htmlText = '<b>Feature</b> & <img src=x onerror=1>';
    const sanitized = sanitizeReadmeHtml(htmlText);
    expect(sanitized).not.toContain('onerror');
  });

  it('rewrites relative markdown image links to raw.githubusercontent.com', () => {
    const html = '<img src="./assets/logo.png" alt="Logo">';
    const rewritten = rewriteRelativeGithubLinks(html, 'vitejs', 'vite', 'main');
    expect(rewritten).toContain('https://raw.githubusercontent.com/vitejs/vite/main/assets/logo.png');
  });

  it('rewrites relative doc links to github blob links with noopener noreferrer', () => {
    const html = '<a href="docs/contributing.md">Contributing</a>';
    const rewritten = rewriteRelativeGithubLinks(html, 'vitejs', 'vite', 'main');
    expect(rewritten).toContain('https://github.com/vitejs/vite/blob/main/docs/contributing.md');
    expect(rewritten).toContain('rel="noopener noreferrer"');
    expect(rewritten).toContain('target="_blank"');
  });

  it('extracts h1, h2, h3 headings for TOC', () => {
    const html = '<h1>Main Title</h1><h2>Installation</h2><h3>NPM</h3><h2>Usage</h2>';
    const headings = extractHeadings(html);
    expect(headings.length).toBe(4);
    expect(headings[1].text).toBe('Installation');
    expect(headings[1].level).toBe(2);
  });
});
