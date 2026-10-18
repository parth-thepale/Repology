import { describe, it, expect } from 'vitest';
import {
  cleanMarkdownText,
  extractFeaturesFromReadme,
  extractOverviewExplanation,
  classifyProjectType,
  identifyEntryPoint,
  buildDirectoryAnatomy,
  extractDependenciesOverview,
  explainRepository,
} from '../src/core/repo-explainer.js';

describe('Repository Explainer & Codebase Anatomy Synthesizer', () => {
  describe('cleanMarkdownText', () => {
    it('strips badges, shields, HTML comments, and HTML tags', () => {
      const raw = `
        <div align="center">
          <h1>My Project</h1>
          [![Build Status](https://img.shields.io/build/status)](https://ci.example.com)
          <!-- Internal comment -->
          <p>Next generation build tool.</p>
        </div>
      `;
      const cleaned = cleanMarkdownText(raw);
      expect(cleaned).not.toContain('<div');
      expect(cleaned).not.toContain('shields.io');
      expect(cleaned).not.toContain('Internal comment');
      expect(cleaned).toContain('Next generation build tool.');
    });

    it('normalizes markdown links to plain text', () => {
      const raw = 'Check out [Documentation](https://example.com/docs) for [API Details](https://example.com/api).';
      const cleaned = cleanMarkdownText(raw);
      expect(cleaned).toBe('Check out Documentation for API Details.');
    });
  });

  describe('extractFeaturesFromReadme', () => {
    it('extracts bullet points under a Features heading', () => {
      const readme = `
# Project X

A great tool.

## Features
- Instant compilation with zero configuration
- Lightning-fast hot module replacement
- Built-in TypeScript and JSX support

## Installation
npm install project-x
      `;
      const features = extractFeaturesFromReadme(readme);
      expect(features.length).toBe(3);
      expect(features[0]).toContain('Instant compilation');
      expect(features[1]).toContain('Lightning-fast');
      expect(features[2]).toContain('Built-in TypeScript');
    });

    it('extracts bullet points under Highlights or Why section', () => {
      const readme = `
# SuperFast

## Highlights
* Sub-millisecond latency
* Distributed architecture
* Zero memory leaks

## Other Section
      `;
      const features = extractFeaturesFromReadme(readme);
      expect(features.length).toBe(3);
      expect(features[0]).toContain('Sub-millisecond latency');
    });

    it('falls back to early bullet points in the header if no feature heading exists', () => {
      const readme = `
# Tool

- Fast start
- Easy setup
- Small footprint

Some description here.
      `;
      const features = extractFeaturesFromReadme(readme);
      expect(features.length).toBe(3);
      expect(features[0]).toContain('Fast start');
    });

    it('returns empty array if no features or bullets exist', () => {
      const readme = '# Just a Title\n\nOnly a paragraph of prose without any list items.';
      const features = extractFeaturesFromReadme(readme);
      expect(features).toEqual([]);
    });
  });

  describe('extractOverviewExplanation', () => {
    it('extracts the first substantial paragraph from markdown', () => {
      const readme = `
# AwesomeTool

[![Badge](https://img.shields.io)](https://example.com)

AwesomeTool is a high-performance HTTP reverse proxy and load balancer designed for mission-critical cloud infrastructure.

## Getting Started
Run the container.
      `;
      const overview = extractOverviewExplanation(readme, 'Fallback text');
      expect(overview).toContain('AwesomeTool is a high-performance HTTP reverse proxy');
    });

    it('falls back to default description when no substantial paragraph exists', () => {
      const overview = extractOverviewExplanation('# Short\n\nHi.', 'A reliable CLI utility.');
      expect(overview).toBe('A reliable CLI utility.');
    });
  });

  describe('classifyProjectType', () => {
    it('classifies monorepo workspace when packages dir and workspace manifest exist', () => {
      const result = classifyProjectType({
        contents: [
          { name: 'packages', type: 'dir' },
          { name: 'pnpm-workspace.yaml', type: 'file' },
        ],
        metadata: { description: 'Monorepo' },
      });
      expect(result.id).toBe('monorepo');
      expect(result.label).toBe('Monorepo Workspace');
      expect(result.badge).toBe('[TYPE: MONOREPO_WORKSPACE]');
    });

    it('classifies CLI tool when pkg.bin or cmd directory is present', () => {
      const result = classifyProjectType({
        contents: [{ name: 'cmd', type: 'dir' }],
        metadata: { description: 'Terminal command-line utility' },
      });
      expect(result.id).toBe('cli');
      expect(result.label).toBe('Command-Line Interface (CLI)');
      expect(result.badge).toBe('[TYPE: CLI_TOOL]');
    });

    it('classifies Web Framework / App when config or description indicates it', () => {
      const result = classifyProjectType({
        contents: [{ name: 'next.config.js', type: 'file' }],
        metadata: { description: 'React framework' },
      });
      expect(result.id).toBe('framework');
      expect(result.badge).toBe('[TYPE: WEB_FRAMEWORK_OR_APP]');
    });

    it('classifies Software Library / SDK when src/lib exist and designed for import', () => {
      const result = classifyProjectType({
        contents: [{ name: 'src', type: 'dir' }],
        metadata: { description: 'Utility library for math' },
        pkg: { main: 'dist/index.js' },
      });
      expect(result.id).toBe('library');
      expect(result.badge).toBe('[TYPE: SOFTWARE_LIBRARY_SDK]');
    });

    it('classifies Backend Service when Dockerfile is present', () => {
      const result = classifyProjectType({
        contents: [{ name: 'Dockerfile', type: 'file' }],
        metadata: { description: 'Microservice' },
      });
      expect(result.id).toBe('service');
      expect(result.badge).toBe('[TYPE: BACKEND_SERVICE]');
    });
  });

  describe('identifyEntryPoint', () => {
    it('prefers package.json main or module when specified', () => {
      const entry = identifyEntryPoint({
        contents: [{ name: 'src', type: 'dir' }],
        owner: 'acme',
        repo: 'tool',
        defaultBranch: 'main',
        pkg: { main: './src/index.ts' },
      });
      expect(entry.path).toBe('src/index.ts');
      expect(entry.url).toBe('https://github.com/acme/tool/blob/main/src/index.ts');
    });

    it('identifies packages directory for monorepos', () => {
      const entry = identifyEntryPoint({
        contents: [{ name: 'packages', type: 'dir' }],
        owner: 'facebook',
        repo: 'react',
        defaultBranch: 'main',
      });
      expect(entry.path).toBe('packages/');
      expect(entry.url).toBe('https://github.com/facebook/react/tree/main/packages');
    });

    it('identifies cmd/ directory or main.go for Go projects', () => {
      const entry = identifyEntryPoint({
        contents: [{ name: 'cmd', type: 'dir' }],
        owner: 'golang',
        repo: 'go',
        defaultBranch: 'master',
      });
      expect(entry.path).toBe('cmd/');
      expect(entry.url).toBe('https://github.com/golang/go/tree/master/cmd');
    });

    it('identifies src/ directory when present', () => {
      const entry = identifyEntryPoint({
        contents: [{ name: 'src', type: 'dir' }],
        owner: 'acme',
        repo: 'app',
        defaultBranch: 'main',
      });
      expect(entry.path).toBe('src/');
    });

    it('falls back to README.md when no standard entry points are found', () => {
      const entry = identifyEntryPoint({
        contents: [{ name: 'README.md', type: 'file' }],
        owner: 'acme',
        repo: 'notes',
        defaultBranch: 'main',
      });
      expect(entry.path).toBe('README.md');
    });
  });

  describe('buildDirectoryAnatomy', () => {
    it('maps known directories to their architectural roles', () => {
      const contents = [
        { name: 'src', type: 'dir' },
        { name: 'test', type: 'dir' },
        { name: 'docs', type: 'dir' },
        { name: 'scripts', type: 'dir' },
        { name: '.github', type: 'dir' },
        { name: 'package.json', type: 'file' },
      ];
      const anatomy = buildDirectoryAnatomy(contents, 'acme', 'core', 'main');
      expect(anatomy.length).toBe(5);

      const srcDir = anatomy.find((d) => d.name === 'src');
      expect(srcDir.badge).toBe('[LOGIC]');
      expect(srcDir.label).toBe('Core Source Code');

      const testDir = anatomy.find((d) => d.name === 'test');
      expect(testDir.badge).toBe('[TESTS]');

      const docsDir = anatomy.find((d) => d.name === 'docs');
      expect(docsDir.badge).toBe('[DOCS]');

      const githubDir = anatomy.find((d) => d.name === '.github');
      expect(githubDir.badge).toBe('[CI_CD]');
    });
  });

  describe('extractDependenciesOverview', () => {
    it('extracts runtime and development dependencies from parsed package.json', () => {
      const pkg = {
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
        devDependencies: {
          vite: '^5.0.0',
          vitest: '^1.0.0',
          typescript: '^5.0.0',
        },
      };
      const { runtimeDeps, devToolchain } = extractDependenciesOverview(pkg);
      expect(runtimeDeps).toEqual(['react', 'react-dom']);
      expect(devToolchain).toEqual(['vite', 'vitest', 'typescript']);
    });

    it('handles null package.json gracefully', () => {
      const { runtimeDeps, devToolchain } = extractDependenciesOverview(null);
      expect(runtimeDeps).toEqual([]);
      expect(devToolchain).toEqual([]);
    });
  });

  describe('explainRepository', () => {
    it('synthesizes complete explainer telemetry for a repository', () => {
      const metadata = {
        name: 'vite',
        description: "Next generation frontend tooling. It's fast!",
      };
      const readme = `
# Vite ⚡
> Next Generation Frontend Tooling

- Instant Server Start
- Lightning Fast HMR

Vite is a modern build tool providing leaner web development.
      `;
      const contents = [
        { name: 'packages', type: 'dir' },
        { name: 'docs', type: 'dir' },
        { name: 'pnpm-workspace.yaml', type: 'file' },
      ];

      const res = explainRepository({
        metadata,
        readmeText: readme,
        contents,
        owner: 'vitejs',
        repo: 'vite',
        defaultBranch: 'main',
      });

      expect(res.elevatorPitch).toBe("Next generation frontend tooling. It's fast!");
      expect(res.overviewExplanation).toContain('Vite is a modern build tool');
      expect(res.features.length).toBe(2);
      expect(res.projectType.id).toBe('monorepo');
      expect(res.entryPoint.path).toBe('packages/');
      expect(res.directoryAnatomy.length).toBe(2);
    });
  });
});
