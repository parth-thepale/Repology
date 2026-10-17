/**
 * Error, loading skeletons, and partial-data state rendering.
 * Strictly uses documented error copy from PRD section 13.
 */

/**
 * Renders an accessible full-page error state.
 * @param {HTMLElement} container
 * @param {Object} params
 * @param {import('../services/github-api.js').ApiError} params.error
 * @param {() => void} [params.onRetry]
 * @param {() => void} [params.onReset]
 */
export function renderErrorState(container, { error, onRetry, onReset }) {
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'state-card state-card-error';
  card.setAttribute('role', 'alert');

  let icon = '⚠️';
  let title = 'Unable to Load Repository';
  let isRateLimit = false;

  if (error.kind === 'not-found') {
    icon = '🔍';
    title = 'Repository Not Found or Private';
  } else if (error.kind === 'rate-limit') {
    icon = '⏳';
    title = 'Rate Limit Reached';
    isRateLimit = true;
  } else if (error.kind === 'network') {
    icon = '📡';
    title = 'Connection Problem';
  }

  const iconEl = document.createElement('div');
  iconEl.className = 'state-icon';
  iconEl.textContent = icon;
  card.appendChild(iconEl);

  const titleEl = document.createElement('h3');
  titleEl.className = 'state-title';
  titleEl.textContent = title;
  card.appendChild(titleEl);

  const msgEl = document.createElement('p');
  msgEl.className = 'state-message';
  msgEl.textContent = error.message;
  card.appendChild(msgEl);

  if (isRateLimit && error.resetTimeFormatted) {
    const tip = document.createElement('div');
    tip.className = 'state-subnote';
    tip.textContent = `GitHub unauthenticated requests are limited to 60/hr per IP address. Your window resets around ${error.resetTimeFormatted}.`;
    card.appendChild(tip);
  }

  const actions = document.createElement('div');
  actions.className = 'state-actions';

  if (onRetry && !isRateLimit) {
    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn-primary';
    retryBtn.textContent = 'Retry Request';
    retryBtn.addEventListener('click', onRetry);
    actions.appendChild(retryBtn);
  }

  if (onReset) {
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = 'Change Repository';
    backBtn.addEventListener('click', onReset);
    actions.appendChild(backBtn);
  }

  card.appendChild(actions);
  container.appendChild(card);
}

/**
 * Renders an animated skeleton placeholder while loading repository data.
 * @param {HTMLElement} container
 * @param {string} [statusMessage='Fetching repository from GitHub...']
 */
export function renderLoadingSkeleton(container, statusMessage = 'Fetching repository from GitHub...') {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'loading-wrapper';
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-live', 'polite');

  const liveText = document.createElement('span');
  liveText.className = 'sr-only';
  liveText.textContent = statusMessage;
  wrapper.appendChild(liveText);

  // Status progress header
  const progressBox = document.createElement('div');
  progressBox.className = 'loading-progress-box';
  progressBox.innerHTML = `
    <div class="loading-spinner" aria-hidden="true"></div>
    <div class="loading-status-text">${statusMessage}</div>
  `;
  wrapper.appendChild(progressBox);

  // Skeleton header card
  const headerSkeleton = document.createElement('div');
  headerSkeleton.className = 'skeleton-card skeleton-header-card';
  headerSkeleton.innerHTML = `
    <div class="skeleton-line skeleton-title"></div>
    <div class="skeleton-line skeleton-desc"></div>
    <div class="skeleton-pills-row">
      <div class="skeleton-pill"></div>
      <div class="skeleton-pill"></div>
      <div class="skeleton-pill"></div>
      <div class="skeleton-pill"></div>
    </div>
  `;
  wrapper.appendChild(headerSkeleton);

  // Skeleton grid
  const gridSkeleton = document.createElement('div');
  gridSkeleton.className = 'skeleton-grid';
  gridSkeleton.innerHTML = `
    <div class="skeleton-card skeleton-panel">
      <div class="skeleton-line skeleton-subheading"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
    <div class="skeleton-card skeleton-panel">
      <div class="skeleton-line skeleton-subheading"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
  `;
  wrapper.appendChild(gridSkeleton);

  container.appendChild(wrapper);
}

/**
 * Renders a dismissible partial failure alert banner if optional data failed to load.
 * @param {HTMLElement} container
 * @param {string} message
 */
export function renderPartialAlert(container, message) {
  const alert = document.createElement('div');
  alert.className = 'partial-alert-banner';
  alert.setAttribute('role', 'status');
  alert.innerHTML = `
    <span class="partial-alert-icon" aria-hidden="true">ℹ️</span>
    <span class="partial-alert-text">${message}</span>
  `;
  container.prepend(alert);
}
