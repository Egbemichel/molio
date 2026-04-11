/**
 * Reusable audio player component
 * Playable audio snippets with animated button states
 * Only one audio plays at a time
 * 
 * Usage: <button data-audio-player data-audio-src="/static/audio/hello_en.mp3">Hear me say hello</button>
 */

const audioPlayers = new Map()
let currentlyPlaying = null

export function initAudioPlayer() {
  const buttons = document.querySelectorAll('[data-audio-player]')

  buttons.forEach((btn) => {
    const audioSrc = btn.getAttribute('data-audio-src')
    if (!audioSrc) return

    const player = new AudioPlayer(btn, audioSrc)
    audioPlayers.set(btn, player)

    // Make keyboard accessible
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        player.toggle()
      }
    })
  })

  injectAudioPlayerStyles()
}

class AudioPlayer {
  constructor(buttonElement, audioSrc) {
    this.button = buttonElement
    this.audioSrc = audioSrc
    this.audio = new Audio(audioSrc)
    this.isPlaying = false

    // Setup button style
    this.button.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      border: 2px solid #8B1E1E;
      background-color: transparent;
      color: #3F3F3F;
      border-radius: 9999px;
      font-family: 'HagiaPro', sans-serif;
      font-size: 1rem;
      cursor: pointer;
      transition: all 300ms;
      position: relative;
      overflow: hidden;
    `

    // Icon span
    if (!this.button.querySelector('[data-audio-icon]')) {
      const icon = document.createElement('span')
      icon.setAttribute('data-audio-icon', 'true')
      icon.textContent = '▶'
      icon.style.cssText = `
        display: inline-block;
        transition: all 300ms;
        font-size: 0.9rem;
      `
      this.button.insertBefore(icon, this.button.firstChild)
    }

    // Label span
    if (!this.button.querySelector('[data-audio-label]')) {
      const label = document.createElement('span')
      label.setAttribute('data-audio-label', 'true')
      label.textContent = 'Hear me say hello'
      label.style.cssText = `
        display: inline-block;
        transition: all 300ms;
      `
      this.button.appendChild(label)
    }

    // Hover state
    this.button.addEventListener('mouseenter', () => {
      if (!this.isPlaying) {
        this.button.style.backgroundColor = 'rgba(139, 30, 30, 0.1)'
      }
    })

    this.button.addEventListener('mouseleave', () => {
      if (!this.isPlaying) {
        this.button.style.backgroundColor = 'transparent'
      }
    })

    // Click to play/stop
    this.button.addEventListener('click', () => {
      this.toggle()
    })

    // Audio events
    this.audio.addEventListener('ended', () => {
      this.stop()
    })

    this.audio.addEventListener('play', () => {
      // Stop any other playing audio
      currentlyPlaying?.audio.pause()
      currentlyPlaying = this
      this.isPlaying = true
      this.updateUI()
    })

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false
      this.updateUI()
    })
  }

  toggle() {
    if (this.isPlaying) {
      this.stop()
    } else {
      this.play()
    }
  }

  play() {
    // Stop other audio
    if (currentlyPlaying && currentlyPlaying !== this) {
      currentlyPlaying.audio.pause()
      currentlyPlaying.isPlaying = false
      currentlyPlaying.updateUI()
    }

    this.audio.play()
  }

  stop() {
    this.audio.pause()
    this.audio.currentTime = 0
    this.isPlaying = false
    this.updateUI()
  }

  updateUI() {
    const icon = this.button.querySelector('[data-audio-icon]')
    const label = this.button.querySelector('[data-audio-label]')

    if (this.isPlaying) {
      // Show equalizer animation
      icon.style.cssText = `
        display: inline-block;
        transition: all 300ms;
        font-size: 0.9rem;
        animation: audioEqualizerBounce 600ms ease-in-out infinite;
      `
      label.textContent = 'Playing...'
      this.button.style.backgroundColor = 'rgba(139, 30, 30, 0.12)'
      this.button.style.borderColor = '#8B1E1E'
    } else {
      icon.style.cssText = `
        display: inline-block;
        transition: all 300ms;
        font-size: 0.9rem;
        animation: none;
      `
      icon.textContent = '▶'
      label.textContent = 'Hear me say hello'
      this.button.style.backgroundColor = 'transparent'
    }
  }
}

function injectAudioPlayerStyles() {
  if (document.getElementById('audio-player-keyframes')) return

  const style = document.createElement('style')
  style.id = 'audio-player-keyframes'
  style.textContent = `
    @keyframes audioEqualizerBounce {
      0%, 100% {
        content: '▮ ▮ ▮';
      }
    }

    [data-audio-player] {
      outline: none;
    }

    [data-audio-player]:focus-visible {
      box-shadow: 0 0 0 3px rgba(139, 30, 30, 0.2);
    }

    @media (prefers-reduced-motion: reduce) {
      [data-audio-icon] {
        animation: none !important;
      }

      [data-audio-player] {
        transition: none !important;
      }

      [data-audio-label] {
        transition: none !important;
      }
    }

    /* Simple equalizer bar animation */
    @keyframes audioBar1 {
      0%, 100% { height: 4px; }
      50% { height: 12px; }
    }

    @keyframes audioBar2 {
      0%, 100% { height: 8px; }
      50% { height: 14px; }
    }

    @keyframes audioBar3 {
      0%, 100% { height: 6px; }
      50% { height: 12px; }
    }
  `
  document.head.appendChild(style)
}
