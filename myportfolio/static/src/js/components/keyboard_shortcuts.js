/**
 * Easter egg keyboard shortcuts
 * Combos: Shift+F, Shift+M, Shift+S, Shift+G
 *
 * Design direction: editorial luxury — dark canvas, large type,
 * accent red, no clutter. Feels like opening a private dossier.
 *
 * Hint system: a ghost toast appears once on first visit,
 * barely visible, that reads like ambient UI — not an instruction.
 */

export function initKeyboardShortcuts() {
  console.log('⌨️ Initializing keyboard shortcuts...')

  injectStyles()

  const easterEggs = {
    f: {
      label:  'Film',
      title:  'Inception',
      meta:   'Christopher Nolan — 2010',
      quote:  'You are waiting for a train.',
      detail: 'A film that rewired how I think about storytelling, time, and the architecture of dreams. I have watched it more times than I will admit.',
    },
    m: {
      label:  'Music',
      title:  'The Weeknd',
      meta:   'R&B · Electronic · Cinematic',
      quote:  'Dawn FM changed the game.',
      detail: 'The production, the concept, the execution. Abel does not make albums — he builds worlds. Few artists make me feel this kind of thing.',
    },
    s: {
      label:  'Sport',
      title:  'Basketball',
      meta:   'NBA · EuroLeague',
      quote:  'Every possession is a decision.',
      detail: 'Chess at full speed. The geometry of movement, the split-second reads, the beauty when five players think as one. Nothing else like it.',
    },
    g: {
      label:  'Game',
      title:  'Dark Souls',
      meta:   'FromSoftware — 2011',
      quote:  'Praise the Sun.',
      detail: 'The game that proved difficulty is a design language. Every death teaches. Every bonfire is earned. It changed what I expect from interactive work.',
    },
  }

  let activeModal = null

  // Ambient hint — shows once per session, fades away on its own
  showHintToast()

  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return

    if (e.key === 'Escape' && activeModal) {
      closeModal(activeModal)
      activeModal = null
      return
    }

    if (e.shiftKey && ['f', 'm', 's', 'g'].includes(e.key.toLowerCase())) {
      e.preventDefault()
      const egg = easterEggs[e.key.toLowerCase()]
      if (!egg) return
      if (activeModal) closeModal(activeModal)
      activeModal = showEasterEgg(egg)
    }
  })

  console.log('✅ Easter eggs ready: Shift+F · Shift+M · Shift+S · Shift+G')
}

// ── Hint toast ────────────────────────────────────────────────
// Appears once, barely there, no explanation — just enough to
// make a curious visitor wonder and try something.
function showHintToast() {
  const toast = document.createElement('div')
  toast.className = 'egg-hint-toast'
  toast.innerHTML = `
    <div class="egg-hint-header">
      <span class="egg-hint-dot"></span>
      <span class="egg-hint-title">Shortcuts</span>
    </div>
    <ul class="egg-hint-list">
      <li><span class="egg-hint-keys"><kbd>↑</kbd><kbd>⇧</kbd><kbd>F</kbd></span><span class="egg-hint-desc">Film</span></li>
      <li><span class="egg-hint-keys"><kbd>↑</kbd><kbd>⇧</kbd><kbd>M</kbd></span><span class="egg-hint-desc">Music</span></li>
      <li><span class="egg-hint-keys"><kbd>↑</kbd><kbd>⇧</kbd><kbd>S</kbd></span><span class="egg-hint-desc">Sport</span></li>
      <li><span class="egg-hint-keys"><kbd>↑</kbd><kbd>⇧</kbd><kbd>G</kbd></span><span class="egg-hint-desc">Game</span></li>
    </ul>
  `
  document.body.appendChild(toast)

  setTimeout(() => toast.classList.add('visible'), 4200)
  setTimeout(() => {
    toast.classList.remove('visible')
    setTimeout(() => toast.remove(), 600)
  }, 9000)

}

// ── Easter egg panel ──────────────────────────────────────────
function showEasterEgg(egg) {
  playUnlockSound()

  const overlay = document.createElement('div')
  overlay.className = 'egg-overlay'

  overlay.innerHTML = `
    <div class="egg-panel">
      <div class="egg-panel-header">
        <span class="egg-label">${egg.label}</span>
        <button class="egg-close" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="egg-panel-body">
        <p class="egg-quote">${egg.quote}</p>
        <h2 class="egg-title">${egg.title}</h2>
        <p class="egg-meta">${egg.meta}</p>
        <p class="egg-detail">${egg.detail}</p>
      </div>

      <div class="egg-panel-footer">
        <span class="egg-secret-label">— secret found</span>
        <span class="egg-esc-hint">esc to close</span>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  document.body.style.overflow = 'hidden'

  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('active')))

  const close = () => {
    overlay.classList.remove('active')
    document.body.style.overflow = ''
    setTimeout(() => overlay.remove(), 500)
    if (overlay._onClose) overlay._onClose()
  }

  overlay._close = close
  overlay.addEventListener('click', e => { if (e.target === overlay) close() })
  overlay.querySelector('.egg-close').addEventListener('click', close)

  return overlay
}

function closeModal(overlay) {
  if (overlay && overlay._close) overlay._close()
}

// ── Sound ─────────────────────────────────────────────────────
function playUnlockSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[523, 659].forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
      osc.start(t)
      osc.stop(t + 0.5)
    })
  } catch (_) {}
}

// ── Styles ────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('easter-egg-styles')) return

  const style = document.createElement('style')
  style.id = 'easter-egg-styles'
  style.textContent = `

    /* Overlay — full screen, dark scrim */
    .egg-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding: 40px;
      background: rgba(8, 8, 8, 0);
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(0px);
      transition: background 450ms ease, backdrop-filter 450ms ease;
      pointer-events: none;
    }
    .egg-overlay.active {
      background: rgba(8, 8, 8, 0.6);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      pointer-events: all;
    }

    /* Panel — dark editorial card, bottom-right */
    .egg-panel {
      background: #0c0c0c;
      border: 0.5px solid rgba(139, 30, 30, 0.2);
      border-radius: 18px;
      width: min(460px, 100%);
      display: flex;
      flex-direction: column;
      transform: translateY(28px) scale(0.96);
      opacity: 0;
      transition:
        transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1),
        opacity 350ms ease;
    }
    .egg-overlay.active .egg-panel {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    /* Header */
    .egg-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 22px 26px 0;
    }
    .egg-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #8B1E1E;
    }
    .egg-close {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 0.5px solid rgba(255,255,255,0.08);
      background: transparent;
      color: rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 200ms ease, color 200ms ease, border-color 200ms ease;
      flex-shrink: 0;
    }
    .egg-close:hover {
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.8);
      border-color: rgba(255,255,255,0.15);
    }

    /* Body */
    .egg-panel-body {
      padding: 24px 32px 20px;
    }
    .egg-quote {
      font-family: HagiaPro, Georgia, serif;
      font-size: 12px;
      font-style: italic;
      color: rgba(139, 30, 30, 0.75);
      letter-spacing: 0.03em;
      margin: 0 0 16px;
    }
    .egg-title {
      font-family: HagiaPro, Georgia, serif;
      font-size: clamp(3rem, 8vw, 5rem);
      font-weight: 400;
      color: #f2ede8;
      line-height: 0.92;
      letter-spacing: -0.025em;
      margin: 0 0 14px;
    }
    .egg-meta {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.2);
      margin: 0 0 18px;
    }
    .egg-detail {
      font-family: 'DM Sans', sans-serif;
      font-size: 13.5px;
      line-height: 1.8;
      color: rgba(255,255,255,0.42);
      margin: 0;
    }

    /* Footer */
    .egg-panel-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 32px 22px;
      border-top: 0.5px solid rgba(255,255,255,0.05);
    }
    .egg-secret-label,
    .egg-esc-hint {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px;
      color: rgba(255,255,255,0.12);
      letter-spacing: 0.06em;
    }

    /* Hint toast — bottom-left card with full shortcut list */
    .egg-hint-toast {
      position: fixed;
      bottom: 32px;
      left: 32px;
      z-index: 88888;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px 24px 22px;
      background: rgba(10, 10, 10, 0.82);
      border: 0.5px solid rgba(139, 30, 30, 0.22);
      border-radius: 16px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 550ms ease, transform 550ms ease;
      pointer-events: none;
      min-width: 220px;
    }
    .egg-hint-toast.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .egg-hint-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .egg-hint-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #8B1E1E;
      flex-shrink: 0;
      animation: hintPulse 2.4s ease-in-out infinite;
    }
    .egg-hint-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.2);
    }
    .egg-hint-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .egg-hint-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .egg-hint-keys {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .egg-hint-keys kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 7px;
      background: rgba(255,255,255,0.05);
      border: 0.5px solid rgba(255,255,255,0.12);
      border-bottom-width: 1.5px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 13px;
      color: rgba(255,255,255,0.45);
      line-height: 1;
    }
    .egg-hint-desc {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: rgba(255,255,255,0.25);
      letter-spacing: 0.02em;
    }

    @keyframes hintPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.25; }
    }

    /* Mobile — panel slides up from bottom edge */
    @media (max-width: 600px) {
      .egg-overlay {
        align-items: flex-end;
        justify-content: center;
        padding: 0;
      }
      .egg-panel {
        border-radius: 18px 18px 0 0;
        width: 100%;
        border-left: none;
        border-right: none;
        border-bottom: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .egg-overlay,
      .egg-panel,
      .egg-hint-toast { transition: opacity 200ms ease; }
      .egg-panel       { transform: none !important; }
      .egg-hint-dot    { animation: none; }
    }
  `
  document.head.appendChild(style)
}