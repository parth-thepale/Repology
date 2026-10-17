/**
 * INDUSTRIAL MODERNIST STATES
 * Terminal radar loading stream, telemetry exception cards, and hairline banners.
 */

/**
 * @param {HTMLElement} container
 * @param {Object} params
 * @param {import('../services/github-api.js').ApiError} params.error
 * @param {() => void} [params.onRetry]
 * @param {() => void} [params.onReset]
 */
export function renderErrorState(container, { error, onRetry, onReset }) {
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'radar-telemetry-error';
  card.setAttribute('role', 'alert');

  let codeBadge = 'ERR_API_EXCEPTION';
  let isRateLimit = false;

  if (error.kind === 'not-found') {
    codeBadge = '404_REPOSITORY_NOT_FOUND_OR_PRIVATE';
  } else if (error.kind === 'rate-limit') {
    codeBadge = '403_IP_RATE_LIMIT_EXCEEDED';
    isRateLimit = true;
  } else if (error.kind === 'network') {
    codeBadge = 'NET_CONNECTION_FAILURE';
  }

  const badgeRow = document.createElement('div');
  badgeRow.className = 'error-badge-row';
  badgeRow.innerHTML = `<span class="badge-tag badge-tag-critical">[${codeBadge}]</span>`;
  card.appendChild(badgeRow);

  const headline = document.createElement('h3');
  headline.className = 'error-headline';
  headline.textContent = 'TELEMETRY EXCEPTION DETECTED';
  card.appendChild(headline);

  const logBox = document.createElement('div');
  logBox.className = 'error-log-stream';
  logBox.innerHTML = `
    <div>&gt; STATUS_CODE: ${error.status || 0}</div>
    <div>&gt; MESSAGE: ${error.message}</div>
    ${error.resetTimeFormatted ? `<div>&gt; RATE_LIMIT_RESET: ~${error.resetTimeFormatted} (Unauthenticated IP quota: 60/hr)</div>` : ''}
  `;
  card.appendChild(logBox);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'center';
  actions.style.gap = '0.5rem';

  if (onRetry && !isRateLimit) {
    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn-primary btn-sm';
    retryBtn.textContent = 'RETRY_STREAM ↵';
    retryBtn.addEventListener('click', onRetry);
    actions.appendChild(retryBtn);
  }

  if (onReset) {
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn-secondary btn-sm';
    resetBtn.textContent = 'RESET_TARGET <ESC>';
    resetBtn.addEventListener('click', onReset);
    actions.appendChild(resetBtn);
  }

  card.appendChild(actions);
  container.appendChild(card);
}

/**
 * @param {HTMLElement} container
 * @param {string} [statusMessage='STREAMING_GITHUB_API_TELEMETRY...']
 */
export function renderLoadingSkeleton(container, statusMessage = 'STREAMING_GITHUB_API_TELEMETRY...') {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'skeleton-terminal';
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-live', 'polite');

  const liveText = document.createElement('span');
  liveText.className = 'sr-only';
  liveText.textContent = statusMessage;
  wrapper.appendChild(liveText);

  // Status stream bar
  const streamBar = document.createElement('div');
  streamBar.className = 'skeleton-stream-bar';
  streamBar.innerHTML = `
    <span class="radar-blip"></span>
    <span class="loading-status-text">&gt; ${statusMessage}</span>
  `;
  wrapper.appendChild(streamBar);

  // Scanline body
  const body = document.createElement('div');
  body.className = 'skeleton-grid-body';
  body.innerHTML = `
    <div class="skeleton-bar" style="width: 45%;"></div>
    <div class="skeleton-bar" style="width: 80%;"></div>
    <div class="skeleton-bar" style="width: 60%;"></div>
    <div class="skeleton-bar" style="width: 70%;"></div>
    <div class="skeleton-bar" style="width: 35%;"></div>
  `;
  wrapper.appendChild(body);

  container.appendChild(wrapper);
}

/**
 * @param {HTMLElement} container
 * @param {string} message
 */
export function renderPartialAlert(container, message) {
  const alert = document.createElement('div');
  alert.className = 'partial-telemetry-banner';
  alert.setAttribute('role', 'status');
  alert.innerHTML = `
    <span class="badge-tag badge-tag-warning">[ALERT]</span>
    <span>${message}</span>
  `;
  container.prepend(alert);
}
