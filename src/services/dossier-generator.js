/**
 * STANDALONE OFFLINE HTML DOSSIER GENERATOR
 * Serializes repository telemetry into an airgapped, single-file HTML document
 * with embedded dark-mode styling for offline architecture reviews and archiving.
 */

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates self-contained HTML document.
 * @param {object} data - Full telemetry dataset
 * @returns {string} Complete HTML string
 */
export function generateHtmlDossier(data) {
  const {
    owner,
    repo,
    metadata = {},
    defaultBranch = 'main',
    detection = {},
    setupGuides = [],
    pulse = {},
    explainer = {},
    envData = {},
    depData = {},
  } = data;

  const generatedIso = new Date().toISOString();
  const repoName = `${owner}/${repo}`;

  const featuresHtml = (explainer.features || [])
    .map((f) => `<li>${escapeHtml(f)}</li>`)
    .join('');

  const setupHtml = setupGuides
    .map(
      (g, idx) => `
    <div class="guide-box">
      <div class="guide-header">
        <span class="guide-title">${idx + 1}. ${escapeHtml(g.title)}</span>
        <span class="badge">[${escapeHtml(g.confidence.toUpperCase())}]</span>
      </div>
      ${g.command ? `<pre><code>${escapeHtml(g.command)}</code></pre>` : ''}
      <div class="guide-meta">Evidence: ${escapeHtml(g.evidence)}</div>
      ${g.note ? `<div class="guide-note">${escapeHtml(g.note)}</div>` : ''}
    </div>
  `
    )
    .join('');

  const envHtml = (envData.entries || [])
    .map(
      (e) => `
    <tr>
      <td><code>${escapeHtml(e.key)}</code></td>
      <td><span class="badge ${e.type?.isSecret ? 'badge-warn' : ''}">${escapeHtml(e.type?.label || 'CONFIG')}</span></td>
      <td>${escapeHtml(e.comment || '—')}</td>
    </tr>
  `
    )
    .join('');

  const depHtml = (depData.allDependencies || [])
    .slice(0, 30)
    .map(
      (d) => `
    <tr>
      <td><code>${escapeHtml(d.name)}</code></td>
      <td>${escapeHtml(d.version)}</td>
      <td><span class="badge">${escapeHtml(d.type.toUpperCase())}</span></td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REPOLOGY DOSSIER // ${escapeHtml(repoName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #000000;
      color: #E0E0E0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      padding: 2rem 1.5rem;
      line-height: 1.6;
    }
    .container { max-width: 960px; margin: 0 auto; }
    header {
      border-bottom: 1px solid #222222;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    .eyebrow {
      font-family: monospace;
      font-size: 11px;
      color: #10B981;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #F5F5F5;
      font-family: monospace;
    }
    .desc {
      color: #9E9E9E;
      font-size: 0.95rem;
      margin-top: 0.5rem;
      max-width: 800px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1px;
      background-color: #222222;
      margin: 1.5rem 0;
      border: 1px solid #222222;
    }
    .meta-card {
      background-color: #080808;
      padding: 0.75rem 1rem;
      font-family: monospace;
      font-size: 11px;
    }
    .meta-label { color: #666666; font-size: 10px; display: block; }
    .meta-val { color: #FFFFFF; font-weight: 600; font-size: 13px; margin-top: 0.25rem; }
    section {
      border: 1px solid #222222;
      background-color: #060606;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    h2 {
      font-size: 0.9rem;
      font-family: monospace;
      color: #F5F5F5;
      letter-spacing: 0.06em;
      border-bottom: 1px solid #161616;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    ul { padding-left: 1.25rem; margin-top: 0.5rem; }
    li { margin-bottom: 0.35rem; color: #CCCCCC; }
    pre {
      background-color: #030303;
      border: 1px solid #1A1A1A;
      padding: 0.75rem 1rem;
      overflow-x: auto;
      font-family: monospace;
      font-size: 12px;
      color: #10B981;
      margin: 0.5rem 0;
    }
    code { font-family: monospace; font-size: 12px; }
    .guide-box { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #141414; }
    .guide-box:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .guide-header { display: flex; justify-content: space-between; align-items: center; }
    .guide-title { font-weight: 600; font-family: monospace; font-size: 13px; color: #FFFFFF; }
    .guide-meta { font-size: 11px; color: #777777; margin-top: 0.25rem; font-family: monospace; }
    .badge {
      font-family: monospace;
      font-size: 10px;
      padding: 0.1rem 0.4rem;
      background-color: #141414;
      border: 1px solid #282828;
      color: #A0A0A0;
    }
    .badge-warn { border-color: rgba(239, 68, 68, 0.4); color: #EF4444; }
    table { width: 100%; border-collapse: collapse; font-family: monospace; font-size: 11px; }
    th { text-align: left; padding: 0.5rem; border-bottom: 1px solid #222222; color: #777; }
    td { padding: 0.5rem; border-bottom: 1px solid #141414; }
    footer {
      text-align: center;
      font-family: monospace;
      font-size: 11px;
      color: #555555;
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #161616;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="eyebrow">REPOLOGY // AIRGAPPED_TELEMETRY_DOSSIER</div>
      <h1>${escapeHtml(repoName)}</h1>
      <p class="desc">${escapeHtml(metadata.description || 'No description declared.')}</p>
      <div class="meta-grid">
        <div class="meta-card">
          <span class="meta-label">PRIMARY_LANGUAGE</span>
          <span class="meta-val">${escapeHtml(metadata.language || 'Unknown')}</span>
        </div>
        <div class="meta-card">
          <span class="meta-label">STARS / FORKS</span>
          <span class="meta-val">${metadata.stargazers_count || 0} ⭐ / ${metadata.forks_count || 0} 🍴</span>
        </div>
        <div class="meta-card">
          <span class="meta-label">MAINTENANCE_CADENCE</span>
          <span class="meta-val">${escapeHtml(pulse.label || 'ACTIVE')}</span>
        </div>
        <div class="meta-card">
          <span class="meta-label">SPDX_LICENSE</span>
          <span class="meta-val">${escapeHtml(metadata.license?.spdx_id || 'None declared')}</span>
        </div>
      </div>
    </header>

    <section>
      <h2>01 // FUNCTIONALITY_OVERVIEW</h2>
      <p style="color: #CCCCCC;">${escapeHtml(explainer.overviewExplanation || explainer.elevatorPitch || metadata.description || 'Open-source repository.')}</p>
      ${featuresHtml ? `<h3 style="font-size: 12px; font-family: monospace; margin-top: 1rem; color: #888;">KEY_CAPABILITIES</h3><ul>${featuresHtml}</ul>` : ''}
    </section>

    <section>
      <h2>02 // CODEBASE_ANATOMY & WHERE_TO_START</h2>
      <p style="font-family: monospace; font-size: 12px; color: #10B981;">
        Entry Point: ${escapeHtml(explainer.entryPoint?.path || 'README.md')}
      </p>
      <p style="color: #888888; font-size: 12px; margin-top: 0.25rem;">
        ${escapeHtml(explainer.entryPoint?.reason || 'Primary repository entry point')}
      </p>
    </section>

    <section>
      <h2>03 // VERIFIED_SETUP_COMMANDS</h2>
      ${setupHtml || '<p style="color: #777;">No verified setup scripts detected.</p>'}
    </section>

    ${envHtml ? `
    <section>
      <h2>04 // ENVIRONMENT_&_CONFIGURATION_PARAMETERS</h2>
      <table>
        <thead>
          <tr><th>VARIABLE</th><th>TYPE</th><th>PURPOSE</th></tr>
        </thead>
        <tbody>
          ${envHtml}
        </tbody>
      </table>
    </section>
    ` : ''}

    ${depHtml ? `
    <section>
      <h2>05 // DEPENDENCY_MANIFEST_SNAPSHOT</h2>
      <table>
        <thead>
          <tr><th>PACKAGE</th><th>VERSION</th><th>SCOPE</th></tr>
        </thead>
        <tbody>
          ${depHtml}
        </tbody>
      </table>
    </section>
    ` : ''}

    <footer>
      Generated at ${escapeHtml(generatedIso)} by Repology Control Plane (repology.vercel.app)<br>
      Airgapped static telemetry dossier. Zero code execution.
    </footer>
  </div>
</body>
</html>`;
}
