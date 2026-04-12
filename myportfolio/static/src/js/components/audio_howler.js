/**
 * Audio player — pill button with equalizer animation while playing
 * Uses Howler.js for cross-browser audio
 * Usage: <button data-audio-player data-audio-src="{% static 'audio/hello_en.mp3' %}">Hear me say hello</button>
 */

export function initAudioPlayers() {
  console.log('🔊 Initializing audio players...')

  if (!window.Howl) {
    console.error('❌ Howler.js not loaded — check CDN in base.html')
    return
  }

  injectAudioStyles()

  const buttons = document.querySelectorAll('[data-audio-player]')
  console.log(`Found ${buttons.length} audio player(s)`)

  if (buttons.length === 0) {
    console.warn('⚠️ No [data-audio-player] elements found in DOM')
    return
  }

  let currentSound = null
  let currentButton = null

  buttons.forEach((button) => {
    const src = button.getAttribute('data-audio-src')
    if (!src) {
      console.warn('⚠️ [data-audio-player] missing data-audio-src')
      return
    }

    // Rebuild button inner HTML to match pill design
    button.classList.add('audio-pill')
    button.setAttribute('role', 'button')
    button.setAttribute('tabindex', '0')
    button.setAttribute('aria-label', 'Play audio greeting')
 
    // Get custom label or use default
    const customLabel = button.getAttribute('data-audio-label') || 'Hear me say hello'

    button.innerHTML = `
      <span class="audio-pill-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </span>
      <span class="audio-pill-bars" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
      <span class="audio-pill-label">${customLabel}</span>
    `

    const icon = button.querySelector('.audio-pill-icon')
    const bars = button.querySelector('.audio-pill-bars')
    const label = button.querySelector('.audio-pill-label')

    function setPlaying(playing) {
      if (playing) {
        button.classList.add('is-playing')
        label.textContent = 'Playing...'
        icon.style.display = 'none'
        bars.style.display = 'flex'
      } else {
        button.classList.remove('is-playing')
        label.textContent = customLabel
        icon.style.display = 'flex'
        bars.style.display = 'none'
      }
    }

    function stopCurrent() {
      if (currentSound && currentSound.playing()) {
        currentSound.stop()
      }
      if (currentButton && currentButton !== button) {
        currentButton.classList.remove('is-playing')
        const prevLabel = currentButton.querySelector('.audio-pill-label')
        const prevIcon = currentButton.querySelector('.audio-pill-icon')
        const prevBars = currentButton.querySelector('.audio-pill-bars')
        const prevCustomLabel = currentButton.getAttribute('data-audio-label') || 'Hear me say hello'
        if (prevLabel) prevLabel.textContent = prevCustomLabel
        if (prevIcon) prevIcon.style.display = 'flex'
        if (prevBars) prevBars.style.display = 'none'
      }
    }

    function toggle() {
      if (currentButton === button && currentSound && currentSound.playing()) {
        currentSound.stop()
        setPlaying(false)
        currentSound = null
        currentButton = null
        return
      }

      stopCurrent()

      const sound = new Howl({
        src: [src],
        html5: true,
        onplay: () => setPlaying(true),
        onstop: () => { setPlaying(false); currentSound = null; currentButton = null },
        onend: () => { setPlaying(false); currentSound = null; currentButton = null },
        onerror: (id, err) => {
          console.error('Audio error:', err)
          setPlaying(false)
          label.textContent = 'Could not load audio'
          setTimeout(() => { label.textContent = customLabel }, 2500)
          currentSound = null
          currentButton = null
        },
      })

      currentSound = sound
      currentButton = button
      sound.play()
    }

    button.addEventListener('click', (e) => { e.preventDefault(); toggle() })
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() }
    })
  })

  console.log('✅ Audio players initialized')
}

function injectAudioStyles() {
  if (document.getElementById('audio-player-styles')) return

  const style = document.createElement('style')
  style.id = 'audio-player-styles'
  style.textContent = `
    .audio-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: transparent;
      border: 1px solid #8B1E1E;
      border-radius: 999px;
      color: #8B1E1E;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: background 250ms ease, transform 200ms ease, color 250ms ease;
      white-space: nowrap;
    }

    .audio-pill:hover {
      background: rgba(139, 30, 30, 0.08);
    }

    .audio-pill:active {
      transform: scale(0.97);
    }

    .audio-pill:focus-visible {
      outline: 2px solid #8B1E1E;
      outline-offset: 3px;
    }

    .audio-pill.is-playing {
      background: rgba(139, 30, 30, 0.1);
    }

    .audio-pill-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .audio-pill-bars {
      display: none;
      align-items: flex-end;
      gap: 2px;
      height: 14px;
      flex-shrink: 0;
    }

    .audio-pill-bars span {
      display: block;
      width: 3px;
      background: #8B1E1E;
      border-radius: 2px;
      animation: audioBar 0.8s ease-in-out infinite alternate;
    }

    .audio-pill-bars span:nth-child(1) { animation-delay: 0s;    height: 6px; }
    .audio-pill-bars span:nth-child(2) { animation-delay: 0.15s; height: 10px; }
    .audio-pill-bars span:nth-child(3) { animation-delay: 0.3s;  height: 4px; }

    @keyframes audioBar {
      from { transform: scaleY(0.4); }
      to   { transform: scaleY(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .audio-pill-bars span {
        animation: none;
        height: 8px;
      }
      .audio-pill {
        transition: none;
      }
    }
  `
  document.head.appendChild(style)
}