import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { updateSeoMeta } from '../src/main.js';

describe('SEO & Responsive Metadata Verification', () => {
  beforeEach(() => {
    // Setup clean mock DOM head
    document.title = 'DEFAULT_TITLE';
    document.head.innerHTML = `
      <meta name="description" content="Default description" />
      <meta property="og:title" content="Default OG Title" />
      <meta property="og:description" content="Default OG Desc" />
      <meta name="twitter:title" content="Default Twitter Title" />
      <meta name="twitter:description" content="Default Twitter Desc" />
      <link rel="canonical" href="https://repology.vercel.app/" />
    `;
  });

  it('dynamically updates document title, description, and canonical URL', () => {
    updateSeoMeta({
      title: 'FACEBOOK/REACT // REPOLOGY_TELEMETRY',
      description: 'The library for web and native user interfaces.',
      canonicalUrl: 'https://repology.vercel.app/?target=facebook/react',
      ogTitle: 'facebook/react // Repository Orientation',
      ogDescription: 'The library for web and native user interfaces.',
    });

    expect(document.title).toBe('FACEBOOK/REACT // REPOLOGY_TELEMETRY');
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toBe(
      'The library for web and native user interfaces.'
    );
    expect(document.querySelector('meta[property="og:title"]').getAttribute('content')).toBe(
      'facebook/react // Repository Orientation'
    );
    expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(
      'https://repology.vercel.app/?target=facebook/react'
    );
  });

  it('verifies robots.txt exists with valid crawler directives and sitemap link', () => {
    const robotsPath = path.resolve(__dirname, '../public/robots.txt');
    expect(fs.existsSync(robotsPath)).toBe(true);
    const content = fs.readFileSync(robotsPath, 'utf-8');
    expect(content).toContain('User-agent: *');
    expect(content).toContain('Allow: /');
    expect(content).toContain('Sitemap: https://repology.vercel.app/sitemap.xml');
  });

  it('verifies sitemap.xml exists with valid schema and deep-linked targets', () => {
    const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
    expect(fs.existsSync(sitemapPath)).toBe(true);
    const content = fs.readFileSync(sitemapPath, 'utf-8');
    expect(content).toContain('https://repology.vercel.app/');
    expect(content).toContain('https://repology.vercel.app/?target=vitejs/vite');
    expect(content).toContain('https://repology.vercel.app/?target=vercel/next.js');
    expect(content).toContain('https://repology.vercel.app/?target=torvalds/linux');
  });

  it('verifies index.html has Schema.org JSON-LD structured data and OpenGraph preview', () => {
    const indexPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(indexPath, 'utf-8');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('WebApplication');
    expect(html).toContain('https://repology.vercel.app/og-image.svg');
    expect(html).toContain('canonical');
    expect(html).toContain('maximum-scale=5.0');
  });

  it('verifies og-image.svg exists for rich social unfurls', () => {
    const ogImagePath = path.resolve(__dirname, '../public/og-image.svg');
    expect(fs.existsSync(ogImagePath)).toBe(true);
    const svg = fs.readFileSync(ogImagePath, 'utf-8');
    expect(svg).toContain('REPOLOGY // RADAR_ORIENTATION_CONTROL_PLANE');
    expect(svg).toContain('1200');
    expect(svg).toContain('630');
  });
});
