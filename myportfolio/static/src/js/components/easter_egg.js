/**
 * Konami-style easter egg system
 * Hidden keyboard combos to reveal secret overlays
 * 
 * Combo patterns:
 * ↑ + F → Favorite film
 * ↑ + M → Favorite music artist  
 * ↑ + S → Favorite sport/team
 * ↑ + G → Favorite game/hobby
 */

export function initEasterEgg() {
  const keyTracker = {
    keys: [],
    maxKeys: 10, // Track last 10 keys to avoid memory leak
  }

  const easterEggs = {
    film: {
      combo: ['ArrowUp', 'f'],
      title: 'Inception',
      quote: '"You're waiting for a train..."',
      icon: '🎬',
    },
    music: {
      combo: ['ArrowUp', 'm'],
      title: 'The Weeknd',
      genre: 'Hip-Hop / R&B',
      icon: '♪',
    },
    sport: {
      combo: ['ArrowUp', 's'],
      title: 'Basketball',
      statement: 'The beautiful game of precision and athleticism.',
      icon: '🏀',
    },
    game: {
      combo: ['ArrowUp', 'g'],
      title: 'Dark Souls',
      statement: 'Masterclass in game design and difficulty curves.',
      icon: '⚔️',
    },
  }

  document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input
    if (
      document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA'
    ) {
      return
    }

    // Track key (case-insensitive for letters)
    const key = e.key === ' ' ? ' ' : e.key.toLowerCase()
    keyTracker.keys.push(key)

    // Keep array size manageable
    if (keyTracker.keys.length > keyTracker.maxKeys) {
      keyTracker.keys.shift()
    }

    // Check for combos
    for (const [eggType, eggData] of Object.entries(easterEggs)) {
      const comboToMatch = eggData.combo.map((k) => k.toLowerCase())

      // Check if last N keys match combo
      if (
        keyTracker.keys.length >= comboToMatch.length &&
        keyTracker.keys
          .slice(-comboToMatch.length)
          .every((k, i) => k === comboToMatch[i])
      ) {
        triggerEasterEgg(eggType, eggData)
        keyTracker.keys = [] // Reset tracker after trigger
      }
    }
  })
}

function triggerEasterEgg(type, eggData) {
  // Play unlock sound
  playUnlockSound()

  // Create overlay
  const overlay = createEasterEggOverlay(type, eggData)
  document.body.appendChild(overlay)

  // Animate in with scale + fade
  requestAnimationFrame(() => {
    overlay.classList.add('easter-egg-active')
  })

  // Close button
  const closeBtn = overlay.querySelector('[data-easter-egg-close]')
  closeBtn?.addEventListener('click', () => {
    closeEasterEgg(overlay)
  })

  // Close on escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeEasterEgg(overlay)
      document.removeEventListener('keydown', handleEscape)
    }
  }
  document.addEventListener('keydown', handleEscape)

  // Close on outside click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeEasterEgg(overlay)
      document.removeEventListener('keydown', handleEscape)
    }
  })
}

function createEasterEggOverlay(type, eggData) {
  const overlay = document.createElement('div')
  overlay.className = 'easter-egg-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
  `

  const card = document.createElement('div')
  card.className = 'easter-egg-card'
  card.style.cssText = `
    background: white;
    border-radius: 2rem;
    padding: 3rem;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    transform: scale(0.8) translateY(20px);
    opacity: 0;
    transition: all 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
  `

  // Icon
  const icon = document.createElement('div')
  icon.style.cssText = `
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: eggIconBounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
  `
  icon.textContent = eggData.icon
  card.appendChild(icon)

  // Title
  const title = document.createElement('h2')
  title.style.cssText = `
    font-family: 'HagiaPro', sans-serif;
    font-size: 2.5rem;
    font-weight: 500;
    color: #3F3F3F;
    margin-bottom: 1rem;
    letter-spacing: -0.5px;
  `
  title.textContent = eggData.title
  card.appendChild(title)

  // Content based on type
  if (eggData.genre) {
    const genre = document.createElement('p')
    genre.style.cssText = `
      font-size: 1.1rem;
      color: #8B1E1E;
      font-weight: 600;
      margin-bottom: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    `
    genre.textContent = eggData.genre
    card.appendChild(genre)
  }

  if (eggData.quote) {
    const quote = document.createElement('p')
    quote.style.cssText = `
      font-size: 1.2rem;
      color: #3F3F3F;
      font-style: italic;
      margin-bottom: 1.5rem;
      opacity: 0.8;
      line-height: 1.6;
    `
    quote.textContent = eggData.quote
    card.appendChild(quote)
  }

  if (eggData.statement) {
    const statement = document.createElement('p')
    statement.style.cssText = `
      font-size: 1.1rem;
      color: #3F3F3F;
      margin-bottom: 1.5rem;
      opacity: 0.8;
      line-height: 1.6;
    `
    statement.textContent = eggData.statement
    card.appendChild(statement)
  }

  // Hint text
  const hint = document.createElement('p')
  hint.style.cssText = `
    font-size: 0.85rem;
    color: #3F3F3F;
    opacity: 0.5;
    margin-top: 2rem;
    border-top: 1px solid rgba(63, 63, 63, 0.1);
    padding-top: 1.5rem;
  `
  hint.textContent = '✨ You found a secret. Press Escape to close.'
  card.appendChild(hint)

  // Close button
  const closeBtn = document.createElement('button')
  closeBtn.setAttribute('data-easter-egg-close', 'true')
  closeBtn.style.cssText = `
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #3F3F3F;
    opacity: 0.6;
    transition: opacity 300ms;
    padding: 0;
  `
  closeBtn.textContent = '×'
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.opacity = '1'
  })
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.opacity = '0.6'
  })
  card.appendChild(closeBtn)

  overlay.appendChild(card)

  // Inject keyframes
  if (!document.getElementById('easter-egg-keyframes')) {
    const style = document.createElement('style')
    style.id = 'easter-egg-keyframes'
    style.textContent = `
      @keyframes eggIconBounce {
        0% {
          transform: scale(0) rotate(-180deg);
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1) rotate(0);
        }
      }

      .easter-egg-card {
        animation: eggCardEnter 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms forwards;
      }

      @keyframes eggCardEnter {
        to {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        @keyframes eggIconBounce {
          to {
            transform: scale(1) rotate(0);
          }
        }
        @keyframes eggCardEnter {
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
      }
    `
    document.head.appendChild(style)
  }

  return overlay
}

function closeEasterEgg(overlay) {
  overlay.classList.remove('easter-egg-active')
  overlay.style.animation = 'eggFadeOut 400ms cubic-bezier(0.4, 0, 1, 1) forwards'

  setTimeout(() => {
    overlay.remove()
  }, 400)

  // Inject fade-out keyframe
  if (!document.getElementById('easter-egg-fadeout')) {
    const style = document.createElement('style')
    style.id = 'easter-egg-fadeout'
    style.textContent = `
      @keyframes eggFadeOut {
        to {
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }
}

function playUnlockSound() {
  // Generate synthetic click sound using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const now = audioContext.currentTime

  // Create oscillator for a pleasant "unlock" tone
  const osc = audioContext.createOscillator()
  const gain = audioContext.createGain()

  osc.connect(gain)
  gain.connect(audioContext.destination)

  // Pitch sweep: C5 to G5
  osc.frequency.setValueAtTime(523.25, now) // C5
  osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2) // G5

  gain.gain.setValueAtTime(0.1, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

  osc.start(now)
  osc.stop(now + 0.2)
}
