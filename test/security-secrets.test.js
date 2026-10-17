import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('SEC-05: Secret and credential leakage check', () => {
  it('ensures no hardcoded personal access tokens or keys exist in source files', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const files = fs.readdirSync(srcDir, { recursive: true });

    const forbiddenPatterns = [
      /ghp_[a-zA-Z0-9]{36}/,
      /github_pat_[a-zA-Z0-9_]{82}/,
      /AIza[0-9A-Za-z-_]{35}/,
      /Bearer\s+ghp_/,
    ];

    for (const file of files) {
      const fullPath = path.join(srcDir, file);
      if (fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of forbiddenPatterns) {
          expect(pattern.test(content)).toBe(false);
        }
      }
    }
  });
});
