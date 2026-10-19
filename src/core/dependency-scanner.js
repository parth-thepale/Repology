/**
 * Deterministic Dependency & Supply Chain Auditor
 * Parses package manifests, computes dependency metrics, categorizes libraries
 * into standard engineering domains, and flags framework signatures with zero API cost.
 */

/**
 * Ecosystem categorization definitions for known open-source libraries.
 */
const CATEGORY_MAP = {
  frameworks: {
    label: 'CORE_FRAMEWORKS & RUNTIMES',
    badge: 'badge-tag-nominal',
    patterns: [
      /^react(?:-dom)?$/,
      /^vue$/,
      /^@vue\//,
      /^svelte(?:-kit)?$/,
      /^next$/,
      /^nuxt$/,
      /^astro$/,
      /^@remix-run\//,
      /^solid-js$/,
      /^express$/,
      /^fastify$/,
      /^koa$/,
      /^hono$/,
      /^@nestjs\//,
      /^electron$/,
      /^react-native$/,
    ],
  },
  build: {
    label: 'BUILD, BUNDLERS & COMPILERS',
    badge: 'badge-tag-info',
    patterns: [
      /^vite$/,
      /^webpack(?:-cli)?$/,
      /^rollup$/,
      /^esbuild$/,
      /^tsup$/,
      /^swc$/,
      /^@swc\//,
      /^babel/,
      /^@babel\//,
      /^typescript$/,
      /^turbo$/,
      /^nx$/,
      /^postcss$/,
      /^autoprefixer$/,
    ],
  },
  testing: {
    label: 'TESTING & QA HARNESSES',
    badge: 'badge-tag-warning',
    patterns: [
      /^vitest$/,
      /^jest$/,
      /^@jest\//,
      /^playwright$/,
      /^@playwright\/test$/,
      /^cypress$/,
      /^mocha$/,
      /^chai$/,
      /^supertest$/,
      /^@testing-library\//,
    ],
  },
  data: {
    label: 'STATE, ORM & VALIDATION',
    badge: 'badge-tag',
    patterns: [
      /^zustand$/,
      /^@reduxjs\/toolkit$/,
      /^redux$/,
      /^mobx/,
      /^recoil$/,
      /^jotai$/,
      /^pinia$/,
      /^vuex$/,
      /^@tanstack\/(?:react|vue|svelte)-query$/,
      /^swr$/,
      /^prisma$/,
      /^@prisma\/client$/,
      /^drizzle-orm$/,
      /^drizzle-kit$/,
      /^typeorm$/,
      /^mongoose$/,
      /^zod$/,
      /^yup$/,
      /^valibot$/,
    ],
  },
  styling: {
    label: 'STYLING, DESIGN & ICONS',
    badge: 'badge-tag',
    patterns: [
      /^tailwindcss$/,
      /^@tailwindcss\//,
      /^sass$/,
      /^less$/,
      /^styled-components$/,
      /^@emotion\//,
      /^lucide-react$/,
      /^@heroicons\/react$/,
      /^@radix-ui\//,
      /^@shadcn\/ui$/,
      /^@mui\//,
      /^antd$/,
    ],
  },
};

/**
 * Scan raw package.json content and return categorized dependencies and metrics.
 * @param {string|object} packageJsonInput
 * @returns {{
 *   hasManifest: boolean,
 *   manifestType: string,
 *   totalCount: number,
 *   prodCount: number,
 *   devCount: number,
 *   peerCount: number,
 *   signatures: {
 *     framework: string|null,
 *     bundler: string|null,
 *     testRunner: string|null,
 *     styling: string|null,
 *   },
 *   categories: Record<string, { label: string, badge: string, packages: Array<{ name: string, version: string, isDev: boolean }> }>,
 *   allDependencies: Array<{ name: string, version: string, type: 'prod'|'dev'|'peer', npmUrl: string }>
 * }}
 */
export function scanDependencies(packageJsonInput) {
  if (!packageJsonInput) {
    return {
      hasManifest: false,
      manifestType: 'none',
      totalCount: 0,
      prodCount: 0,
      devCount: 0,
      peerCount: 0,
      signatures: { framework: null, bundler: null, testRunner: null, styling: null },
      categories: {},
      allDependencies: [],
    };
  }

  let pkg = {};
  if (typeof packageJsonInput === 'string') {
    try {
      pkg = JSON.parse(packageJsonInput);
    } catch {
      return {
        hasManifest: false,
        manifestType: 'malformed_package.json',
        totalCount: 0,
        prodCount: 0,
        devCount: 0,
        peerCount: 0,
        signatures: { framework: null, bundler: null, testRunner: null, styling: null },
        categories: {},
        allDependencies: [],
      };
    }
  } else if (typeof packageJsonInput === 'object') {
    pkg = packageJsonInput;
  }

  const prodDeps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  const peerDeps = pkg.peerDependencies || {};

  const allList = [];

  Object.entries(prodDeps).forEach(([name, version]) => {
    allList.push({ name, version: String(version), type: 'prod', npmUrl: `https://www.npmjs.com/package/${name}` });
  });

  Object.entries(devDeps).forEach(([name, version]) => {
    allList.push({ name, version: String(version), type: 'dev', npmUrl: `https://www.npmjs.com/package/${name}` });
  });

  Object.entries(peerDeps).forEach(([name, version]) => {
    allList.push({ name, version: String(version), type: 'peer', npmUrl: `https://www.npmjs.com/package/${name}` });
  });

  // Categorize
  const categorized = {
    frameworks: { label: CATEGORY_MAP.frameworks.label, badge: CATEGORY_MAP.frameworks.badge, packages: [] },
    build: { label: CATEGORY_MAP.build.label, badge: CATEGORY_MAP.build.badge, packages: [] },
    testing: { label: CATEGORY_MAP.testing.label, badge: CATEGORY_MAP.testing.badge, packages: [] },
    data: { label: CATEGORY_MAP.data.label, badge: CATEGORY_MAP.data.badge, packages: [] },
    styling: { label: CATEGORY_MAP.styling.label, badge: CATEGORY_MAP.styling.badge, packages: [] },
    other: { label: 'GENERAL_UTILITIES & ECOSYSTEM', badge: 'badge-tag', packages: [] },
  };

  const allMap = { ...prodDeps, ...devDeps, ...peerDeps };

  // Detect key technology signatures
  let detectedFramework = null;
  let detectedBundler = null;
  let detectedTestRunner = null;
  let detectedStyling = null;

  Object.entries(allMap).forEach(([name, version]) => {
    const isDev = Boolean(devDeps[name]);
    const pkgObj = { name, version: String(version), isDev };

    let matchedCategory = null;

    for (const [catKey, catDef] of Object.entries(CATEGORY_MAP)) {
      if (catDef.patterns.some((re) => re.test(name))) {
        matchedCategory = catKey;
        break;
      }
    }

    if (matchedCategory) {
      categorized[matchedCategory].packages.push(pkgObj);
    } else {
      categorized.other.packages.push(pkgObj);
    }

    // Signatures
    if (!detectedFramework) {
      if (name === 'next') detectedFramework = `Next.js (${version})`;
      else if (name === 'nuxt') detectedFramework = `Nuxt (${version})`;
      else if (name === 'astro') detectedFramework = `Astro (${version})`;
      else if (name === 'react') detectedFramework = `React (${version})`;
      else if (name === 'vue') detectedFramework = `Vue (${version})`;
      else if (name === 'svelte') detectedFramework = `Svelte (${version})`;
      else if (name === 'express') detectedFramework = `Express (${version})`;
      else if (name === 'fastify') detectedFramework = `Fastify (${version})`;
      else if (name === 'hono') detectedFramework = `Hono (${version})`;
    }

    if (!detectedBundler) {
      if (name === 'vite') detectedBundler = `Vite (${version})`;
      else if (name === 'webpack') detectedBundler = `Webpack (${version})`;
      else if (name === 'rollup') detectedBundler = `Rollup (${version})`;
      else if (name === 'esbuild') detectedBundler = `esbuild (${version})`;
      else if (name === 'tsup') detectedBundler = `tsup (${version})`;
    }

    if (!detectedTestRunner) {
      if (name === 'vitest') detectedTestRunner = `Vitest (${version})`;
      else if (name === 'jest') detectedTestRunner = `Jest (${version})`;
      else if (name === 'playwright' || name === '@playwright/test') detectedTestRunner = `Playwright (${version})`;
      else if (name === 'cypress') detectedTestRunner = `Cypress (${version})`;
    }

    if (!detectedStyling) {
      if (name === 'tailwindcss') detectedStyling = `Tailwind CSS (${version})`;
      else if (name === 'styled-components') detectedStyling = `Styled Components (${version})`;
      else if (name.startsWith('@radix-ui/')) detectedStyling = `Radix UI Primitives`;
    }
  });

  return {
    hasManifest: true,
    manifestType: 'package.json',
    totalCount: allList.length,
    prodCount: Object.keys(prodDeps).length,
    devCount: Object.keys(devDeps).length,
    peerCount: Object.keys(peerDeps).length,
    signatures: {
      framework: detectedFramework,
      bundler: detectedBundler,
      testRunner: detectedTestRunner,
      styling: detectedStyling,
    },
    categories: categorized,
    allDependencies: allList,
  };
}
