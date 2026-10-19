import { describe, it, expect } from 'vitest';
import {
  parseEnvFile,
  inferEnvType,
  generateEnvLocalBoilerplate,
  extractReferencedEnvKeys,
  ENV_FILE_CANDIDATES,
} from '../src/core/env-decoder.js';
import { scanDependencies } from '../src/core/dependency-scanner.js';
import { generateMarkdownReport, generateJsonReport } from '../src/services/repository-service.js';
import { DEMO_SNAPSHOT } from '../src/services/demo-snapshot.js';

describe('Phase 1: Environment Variables & Secrets Radar', () => {
  it('correctly classifies variable types and flags sensitive secrets', () => {
    expect(inferEnvType('GITHUB_API_KEY').isSecret).toBe(true);
    expect(inferEnvType('DATABASE_SECRET').isSecret).toBe(true);
    expect(inferEnvType('JWT_AUTH_TOKEN').isSecret).toBe(true);
    expect(inferEnvType('PORT', '3000').typeId).toBe('port');
    expect(inferEnvType('API_BASE_URL', 'https://api.example.com').typeId).toBe('url');
    expect(inferEnvType('ENABLE_TELEMETRY', 'true').typeId).toBe('boolean');
    expect(inferEnvType('NODE_ENV', 'production').typeId).toBe('enum');
    expect(inferEnvType('APP_NAME', 'Repology').typeId).toBe('string');
  });

  it('parses .env.example files with comments, quotes, and inline annotations', () => {
    const rawEnv = `
# Production Database Connection
DATABASE_URL=postgres://user:pass@localhost:5432/db # Primary DB
# Application Security Keys
APP_SECRET="super-secret-hex-key-9988"
PORT=8080
ENABLE_LOGGING=true
NODE_ENV=development
`;
    const result = parseEnvFile(rawEnv, '.env.example');
    expect(result.hasEnvFile).toBe(true);
    expect(result.totalCount).toBe(5);
    expect(result.secretCount).toBe(1);

    const dbEntry = result.entries.find((e) => e.key === 'DATABASE_URL');
    expect(dbEntry).toBeDefined();
    expect(dbEntry.value).toBe('postgres://user:pass@localhost:5432/db');
    expect(dbEntry.comment).toBe('Primary DB');
    expect(dbEntry.type.typeId).toBe('url');

    const secretEntry = result.entries.find((e) => e.key === 'APP_SECRET');
    expect(secretEntry.value).toBe('super-secret-hex-key-9988');
    expect(secretEntry.type.isSecret).toBe(true);
  });

  it('generates a clean, ready-to-use .env.local file', () => {
    const entries = [
      { key: 'PORT', value: '4000', comment: 'Port number', type: { typeId: 'port' } },
      { key: 'SECRET_TOKEN', value: '', comment: 'Auth token', type: { isSecret: true, typeId: 'secret' } },
    ];
    const boilerplate = generateEnvLocalBoilerplate(entries, 'owner/repo');
    expect(boilerplate).toContain('# REPOLOGY CONFIG GENERATOR: .env.local');
    expect(boilerplate).toContain('# TARGET: owner/repo');
    expect(boilerplate).toContain('PORT=4000');
    expect(boilerplate).toContain('SECRET_TOKEN=your_secret_key_here');
  });

  it('scans code references when no template is available', () => {
    const pkg = JSON.stringify({ scripts: { start: 'cross-env PORT=3000 node server.js' } });
    const readme = 'Make sure to configure process.env.STRIPE_PUBLIC_KEY and import.meta.env.VITE_BACKEND_URL.';
    const keys = extractReferencedEnvKeys(pkg, readme);
    expect(keys).toContain('STRIPE_PUBLIC_KEY');
    expect(keys).toContain('VITE_BACKEND_URL');
  });

  it('handles empty or malformed env files gracefully', () => {
    const emptyResult = parseEnvFile('');
    expect(emptyResult.hasEnvFile).toBe(false);
    expect(emptyResult.entries).toEqual([]);
    expect(emptyResult.totalCount).toBe(0);
  });
});

describe('Phase 1: Dependency & Supply Chain Auditor', () => {
  it('parses dependencies, devDependencies, and identifies technology signatures', () => {
    const packageJson = {
      name: 'test-app',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        zustand: '^4.4.1',
        tailwindcss: '^3.4.0',
      },
      devDependencies: {
        vite: '^5.0.0',
        typescript: '^5.2.0',
        vitest: '^1.0.0',
      },
    };

    const result = scanDependencies(packageJson);
    expect(result.hasManifest).toBe(true);
    expect(result.totalCount).toBe(7);
    expect(result.prodCount).toBe(4);
    expect(result.devCount).toBe(3);

    // Signatures
    expect(result.signatures.framework).toContain('React');
    expect(result.signatures.bundler).toContain('Vite');
    expect(result.signatures.testRunner).toContain('Vitest');
    expect(result.signatures.styling).toContain('Tailwind CSS');

    // Categorization
    expect(result.categories.frameworks.packages.map((p) => p.name)).toContain('react');
    expect(result.categories.build.packages.map((p) => p.name)).toContain('vite');
    expect(result.categories.testing.packages.map((p) => p.name)).toContain('vitest');
    expect(result.categories.data.packages.map((p) => p.name)).toContain('zustand');
    expect(result.categories.styling.packages.map((p) => p.name)).toContain('tailwindcss');
  });

  it('handles missing or malformed package.json gracefully', () => {
    const nullResult = scanDependencies(null);
    expect(nullResult.hasManifest).toBe(false);
    expect(nullResult.totalCount).toBe(0);

    const malformedResult = scanDependencies('this is not json {]');
    expect(malformedResult.hasManifest).toBe(false);
    expect(malformedResult.manifestType).toBe('malformed_package.json');
  });
});

describe('Phase 1: Telemetry Export & Demo Snapshot Verification', () => {
  it('verifies DEMO_SNAPSHOT includes valid envData and depData', () => {
    expect(DEMO_SNAPSHOT.envData).toBeDefined();
    expect(DEMO_SNAPSHOT.envData.hasEnvFile).toBe(true);
    expect(DEMO_SNAPSHOT.envData.entries.length).toBeGreaterThan(0);

    expect(DEMO_SNAPSHOT.depData).toBeDefined();
    expect(DEMO_SNAPSHOT.depData.hasManifest).toBe(true);
    expect(DEMO_SNAPSHOT.depData.signatures.testRunner).toContain('Vitest');
  });

  it('generates markdown report with configuration and dependency sections', () => {
    const md = generateMarkdownReport(DEMO_SNAPSHOT);
    expect(md).toContain('Configuration & Environment Variables');
    expect(md).toContain('Dependency Architecture & Supply Chain');
    expect(md).toContain('Vitest');
  });

  it('generates json report with structured env and dependencies properties', () => {
    const jsonStr = generateJsonReport(DEMO_SNAPSHOT);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.env).toBeDefined();
    expect(parsed.dependencies).toBeDefined();
    expect(parsed.dependencies.totalCount).toBe(16);
  });
});
