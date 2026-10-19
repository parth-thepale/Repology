/**
 * Deterministic Environment Variable & Secrets Decoder
 * Scans, parses, and infers telemetry types for project configuration templates
 * (.env.example, .env.sample, .env.template, docker-compose.yml).
 * Generates ready-to-use .env.local boilerplate files.
 */

/**
 * Standard configuration candidate filenames in order of preference.
 */
export const ENV_FILE_CANDIDATES = [
  '.env.example',
  '.env.sample',
  '.env.template',
  '.env.local.example',
  '.env.dist',
  '.env.defaults',
  '.env.dev.example',
  'env.example',
];

/**
 * Infer the semantic telemetry type of an environment variable.
 * @param {string} key
 * @param {string} value
 * @returns {{ typeId: string, label: string, isSecret: boolean, badgeClass: string }}
 */
export function inferEnvType(key, value = '') {
  const upperKey = key.toUpperCase();

  // 1. Secrets & Sensitive Tokens
  if (
    upperKey.includes('SECRET') ||
    upperKey.includes('TOKEN') ||
    upperKey.includes('PASSWORD') ||
    upperKey.includes('PASS') ||
    upperKey.includes('PRIVATE_KEY') ||
    upperKey.includes('API_KEY') ||
    upperKey.includes('AUTH_KEY') ||
    upperKey.includes('JWT') ||
    upperKey.includes('CREDENTIAL') ||
    upperKey.includes('ENCRYPTION')
  ) {
    return {
      typeId: 'secret',
      label: 'SENSITIVE_SECRET',
      isSecret: true,
      badgeClass: 'badge-tag-critical',
    };
  }

  // 2. Network URLs & URIs
  if (
    upperKey.includes('URL') ||
    upperKey.includes('URI') ||
    upperKey.includes('ENDPOINT') ||
    upperKey.includes('HOST') ||
    upperKey.includes('DOMAIN') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('postgres://') ||
    value.startsWith('mongodb://') ||
    value.startsWith('redis://') ||
    value.startsWith('mysql://')
  ) {
    return {
      typeId: 'url',
      label: 'NETWORK_ENDPOINT',
      isSecret: false,
      badgeClass: 'badge-tag-info',
    };
  }

  // 3. Port Numbers
  if (
    upperKey === 'PORT' ||
    upperKey.endsWith('_PORT') ||
    /^\d{2,5}$/.test(value.trim())
  ) {
    return {
      typeId: 'port',
      label: 'NETWORK_PORT',
      isSecret: false,
      badgeClass: 'badge-tag-nominal',
    };
  }

  // 4. Boolean Flags
  if (
    ['TRUE', 'FALSE', '1', '0'].includes(value.trim().toUpperCase()) ||
    upperKey.startsWith('ENABLE_') ||
    upperKey.startsWith('DISABLE_') ||
    upperKey.startsWith('IS_') ||
    upperKey.startsWith('HAS_') ||
    upperKey.endsWith('_ENABLED')
  ) {
    return {
      typeId: 'boolean',
      label: 'BOOLEAN_FLAG',
      isSecret: false,
      badgeClass: 'badge-tag-nominal',
    };
  }

  // 5. Environment Enums
  if (
    upperKey === 'NODE_ENV' ||
    upperKey === 'APP_ENV' ||
    upperKey === 'ENVIRONMENT' ||
    upperKey === 'STAGE'
  ) {
    return {
      typeId: 'enum',
      label: 'ENVIRONMENT_ENUM',
      isSecret: false,
      badgeClass: 'badge-tag-warning',
    };
  }

  // 6. Generic Configuration String
  return {
    typeId: 'string',
    label: 'CONFIG_STRING',
    isSecret: false,
    badgeClass: 'badge-tag',
  };
}

/**
 * Parses raw text from an environment template file into structured telemetry entries.
 * @param {string} rawContent
 * @param {string} fileName
 * @returns {{
 *   hasEnvFile: boolean,
 *   fileName: string,
 *   entries: Array<{
 *     key: string,
 *     value: string,
 *     comment: string,
 *     type: { typeId: string, label: string, isSecret: boolean, badgeClass: string },
 *     required: boolean
 *   }>,
 *   secretCount: number,
 *   totalCount: number
 * }}
 */
export function parseEnvFile(rawContent, fileName = '.env.example') {
  if (!rawContent || typeof rawContent !== 'string') {
    return {
      hasEnvFile: false,
      fileName,
      entries: [],
      secretCount: 0,
      totalCount: 0,
    };
  }

  const lines = rawContent.split(/\r?\n/);
  const entries = [];
  let pendingComment = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Empty line resets pending comment
    if (!line) {
      pendingComment = '';
      continue;
    }

    // Comment line
    if (line.startsWith('#') || line.startsWith('//')) {
      const cleaned = line.replace(/^[#/]+/, '').trim();
      pendingComment = pendingComment ? `${pendingComment} ${cleaned}` : cleaned;
      continue;
    }

    // Match KEY=VALUE or export KEY=VALUE
    const match = line.match(/^(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();

      // Inline comment detection (e.g. KEY=VAL # comment)
      let inlineComment = '';
      const inlineCommentIdx = value.indexOf('#');
      if (inlineCommentIdx !== -1) {
        inlineComment = value.slice(inlineCommentIdx + 1).trim();
        value = value.slice(0, inlineCommentIdx).trim();
      }

      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      const type = inferEnvType(key, value);
      const isRequired = !value || value.includes('your_') || value.includes('change_me') || value.includes('xxx');

      entries.push({
        key,
        value,
        comment: inlineComment || pendingComment,
        type,
        required: isRequired,
      });

      pendingComment = '';
    }
  }

  const secretCount = entries.filter((e) => e.type.isSecret).length;

  return {
    hasEnvFile: entries.length > 0,
    fileName,
    entries,
    secretCount,
    totalCount: entries.length,
  };
}

/**
 * Scans code or package.json for environment variable references when no template file is available.
 * @param {string} [packageJsonContent]
 * @param {string} [readmeText]
 * @returns {string[]}
 */
export function extractReferencedEnvKeys(packageJsonContent = '', readmeText = '') {
  const found = new Set();

  const regexes = [
    /process\.env\.([A-Z0-9_]{3,})/g,
    /import\.meta\.env\.([A-Z0-9_]{3,})/g,
    /os\.environ(?:\.get)?\(['"]([A-Z0-9_]{3,})['"]\)/g,
    /os\.Getenv\(['"]([A-Z0-9_]{3,})['"]\)/g,
    /\$([A-Z0-9_]{3,})/g,
  ];

  const corpus = `${packageJsonContent}\n${readmeText}`;

  for (const re of regexes) {
    let match;
    while ((match = re.exec(corpus)) !== null) {
      const key = match[1];
      // Filter out common bash or build variables
      if (!['PATH', 'HOME', 'USER', 'PWD', 'SHELL', 'PORT'].includes(key) && key.length > 2) {
        found.add(key);
      }
    }
  }

  return Array.from(found).slice(0, 15);
}

/**
 * Generates clean, ready-to-use .env.local file content.
 * @param {Array<{ key: string, value: string, comment?: string, type?: object }>} entries
 * @param {string} [repoFullName='']
 * @returns {string}
 */
export function generateEnvLocalBoilerplate(entries = [], repoFullName = '') {
  const header = [
    '# =====================================================================',
    `# REPOLOGY CONFIG GENERATOR: .env.local`,
    repoFullName ? `# TARGET: ${repoFullName}` : null,
    `# GENERATED: ${new Date().toISOString()}`,
    '# AIRGAPPED REPOSITORY ORIENTATION CONTROL PLANE',
    '# Replace placeholder tokens below before running your development server',
    '# =====================================================================',
    '',
  ].filter(Boolean).join('\n');

  const lines = entries.map((e) => {
    const commentPart = e.comment ? `# ${e.comment}\n` : '';
    let val = e.value || '';
    if (!val && e.type?.isSecret) {
      val = 'your_secret_key_here';
    } else if (!val && e.type?.typeId === 'url') {
      val = 'http://localhost:3000';
    } else if (!val && e.type?.typeId === 'port') {
      val = '3000';
    }
    return `${commentPart}${e.key}=${val}`;
  });

  return `${header}\n${lines.join('\n')}\n`;
}
