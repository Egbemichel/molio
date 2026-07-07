/**
 * state_ui.js
 *
 * One on-brand system for the async UI states: LOADING, EMPTY, ERROR.
 * (SUCCESS is handled inline by the button/toast helpers in page_loader.js.)
 *
 * Self-contained injected CSS — no Tailwind rebuild required. Palette matches
 * the site: accent #8B1E1E, ink #3F3F3F, HagiaPro type. Entrance + retry
 * micro-interactions are pure CSS so they work without GSAP, and are disabled
 * under prefers-reduced-motion.
 *
 *   renderState(container, {
 *     variant: 'loading' | 'empty' | 'error',
 *     title, message,                 // empty / error
 *     actionLabel, onAction,          // error → retry button
 *     minHeight,                      // optional, e.g. '16rem'
 *   })
 *   clearState(container)
 */

export function renderState(container, opts = {}) {
  if (!container) return null
  injectStateStyles()

  const {
    variant = 'empty',
    title = '',
    message = '',
    actionLabel,
    onAction,
    minHeight = '16rem',
  } = opts

  clearState(container)

  const block = document.createElement('div')
  block.className = 'state-block'
  block.dataset.stateBlock = variant
  block.style.minHeight = minHeight

  if (variant === 'loading') {
    block.setAttribute('aria-busy', 'true')
    block.innerHTML = skeletonCardHTML()
  } else {
    block.setAttribute('role', variant === 'error' ? 'alert' : 'status')
    block.innerHTML = `
      <span class="state-visual state-visual--${variant}" aria-hidden="true">
        ${variant === 'error' ? errorIcon() : emptyIcon()}
      </span>
      ${title ? `<h3 class="state-title">${escapeHtml(title)}</h3>` : ''}
      ${message ? `<p class="state-message">${escapeHtml(message)}</p>` : ''}
    `

    if (variant === 'error' && actionLabel && typeof onAction === 'function') {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'state-retry'
      btn.innerHTML = `
        <span class="state-retry__fill" aria-hidden="true"></span>
        <span class="state-retry__label">${escapeHtml(actionLabel)}</span>
      `
      btn.addEventListener('click', async () => {
        if (btn.disabled) return
        btn.disabled = true
        btn.classList.add('is-loading')
        btn.querySelector('.state-retry__label').innerHTML = '<span class="state-spinner"></span>'
        try {
          await onAction()
        } catch (_) {
          // onAction is expected to re-render its own error state; nothing to do.
        }
      })
      block.appendChild(btn)
    }
  }

  container.appendChild(block)
  return block
}

export function clearState(container) {
  if (!container) return
  container.querySelectorAll('[data-state-block]').forEach((el) => el.remove())
}


/* ── visuals ─────────────────────────────────────────────────── */

function emptyIcon() {
  // Soft speech-bubble — "nothing here yet"
  return `
    <svg viewBox="0 0 48 48" fill="none" stroke="#8B1E1E" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 12h32a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H20l-8 7v-7H8a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2Z"/>
      <path d="M17 23h.01M24 23h.01M31 23h.01" opacity="0.6"/>
    </svg>`
}

function errorIcon() {
  // Unplugged connector — "couldn't reach the server"
  return `
    <svg viewBox="0 0 48 48" fill="none" stroke="#8B1E1E" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 6v10M18 16h12M20 16v6a4 4 0 0 0 8 0v-6"/>
      <path d="M24 30v6a6 6 0 0 1-6 6" opacity="0.6"/>
      <path d="M9 9l30 30" stroke-width="2.4"/>
    </svg>`
}

function skeletonCardHTML() {
  // Mirrors a testimonial slide: avatar + name/email/stars + message lines.
  return `
    <div class="state-skel">
      <div class="state-skel__avatar shimmer"></div>
      <div class="state-skel__body">
        <div class="state-skel__line shimmer" style="width:52%"></div>
        <div class="state-skel__line shimmer" style="width:38%"></div>
        <div class="state-skel__stars">
          <span class="shimmer"></span><span class="shimmer"></span>
          <span class="shimmer"></span><span class="shimmer"></span>
          <span class="shimmer"></span>
        </div>
        <div class="state-skel__line shimmer" style="width:92%"></div>
        <div class="state-skel__line shimmer" style="width:74%"></div>
      </div>
    </div>`
}


/* ── helpers ─────────────────────────────────────────────────── */

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = String(text)
  return div.innerHTML
}


/* ── styles ──────────────────────────────────────────────────── */

function injectStateStyles() {
  if (document.getElementById('state-ui-styles')) return

  const style = document.createElement('style')
  style.id = 'state-ui-styles'
  style.textContent = `
    .state-block {
      flex: 0 0 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 12px;
      padding: 40px 24px;
      font-family: 'HagiaPro', system-ui, sans-serif;
      animation: stateIn 0.55s cubic-bezier(.22,1,.36,1) both;
    }

    .state-visual {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 74px;
      height: 74px;
      border-radius: 50%;
      border: 2px solid rgba(139, 30, 30, 0.18);
      background: rgba(139, 30, 30, 0.04);
      margin-bottom: 4px;
    }
    .state-visual svg { width: 34px; height: 34px; }
    .state-visual--empty { animation: stateFloat 4s ease-in-out infinite; }
    .state-visual--error { animation: stateShake 0.5s cubic-bezier(.36,.07,.19,.97) both; }

    .state-title {
      font-size: clamp(22px, 3vw, 30px);
      font-weight: 500;
      color: #3F3F3F;
      letter-spacing: -0.01em;
      margin: 0;
    }
    .state-message {
      font-size: clamp(15px, 1.6vw, 19px);
      color: rgba(63, 63, 63, 0.55);
      max-width: 30rem;
      line-height: 1.5;
      margin: 0;
    }

    /* Retry button — the site's fill-from-bottom CTA move */
    .state-retry {
      position: relative;
      overflow: hidden;
      margin-top: 10px;
      padding: 12px 30px;
      border: none;
      border-radius: 999px;
      background: #1c1c1c;
      color: #E8E8E8;
      font-family: inherit;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.25s cubic-bezier(.34,1.56,.64,1);
    }
    .state-retry__fill {
      position: absolute; inset: 0; z-index: 0;
      background: #8B1E1E;
      transform: translateY(101%);
      transition: transform 0.4s cubic-bezier(.4,0,.2,1);
    }
    .state-retry__label { position: relative; z-index: 1; display: inline-flex; }
    @media (hover: hover) {
      .state-retry:hover { transform: translateY(-2px); }
      .state-retry:hover .state-retry__fill { transform: translateY(0); }
    }
    .state-retry:active { transform: scale(0.96); }
    .state-retry:disabled { cursor: default; }

    .state-spinner {
      display: inline-block;
      width: 17px; height: 17px;
      border: 2px solid rgba(232, 232, 232, 0.35);
      border-top-color: #E8E8E8;
      border-radius: 50%;
      animation: stateSpin 0.65s linear infinite;
    }

    /* Loading skeleton card */
    .state-skel {
      width: 100%;
      max-width: 44rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 22px;
      padding: 8px;
    }
    @media (min-width: 768px) { .state-skel { flex-direction: row; align-items: center; gap: 34px; } }
    .state-skel__avatar {
      flex-shrink: 0;
      width: 96px; height: 96px;
      border-radius: 50%;
    }
    @media (min-width: 768px) { .state-skel__avatar { width: 128px; height: 128px; } }
    .state-skel__body {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
    @media (min-width: 768px) { .state-skel__body { align-items: flex-start; } }
    .state-skel__line { height: 15px; border-radius: 7px; }
    .state-skel__stars { display: flex; gap: 8px; margin: 4px 0; }
    .state-skel__stars span { width: 20px; height: 20px; border-radius: 5px; }

    .shimmer {
      background: linear-gradient(90deg,
        rgba(63,63,63,0.06) 25%,
        rgba(63,63,63,0.14) 50%,
        rgba(63,63,63,0.06) 75%);
      background-size: 200% 100%;
      animation: stateShimmer 1.5s ease-in-out infinite;
    }

    @keyframes stateIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes stateFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes stateShake { 10%,90%{transform:translateX(-1px)} 20%,80%{transform:translateX(2px)} 30%,50%,70%{transform:translateX(-4px)} 40%,60%{transform:translateX(4px)} }
    @keyframes stateSpin { to { transform: rotate(360deg); } }
    @keyframes stateShimmer { from { background-position: 200% center; } to { background-position: -200% center; } }

    @media (prefers-reduced-motion: reduce) {
      .state-block,
      .state-visual--empty,
      .state-visual--error { animation: none; }
      .shimmer { animation: none; background: rgba(63,63,63,0.1); }
      .state-spinner { animation-duration: 1.2s; }
      .state-retry, .state-retry__fill { transition: none; }
    }
  `
  document.head.appendChild(style)
}
