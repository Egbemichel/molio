/**
 * Custom dual-layer cursor
 * Dot: instant tracking | Ring: lerp trail via RAF loop
 */

export function initCustomCursor() {
  console.log('🖱️ Initializing custom cursor...')

  if (window.matchMedia('(hover: none)').matches) {
    console.log('⚠️ Touch device, cursor disabled')
    return
  }

  injectCursorStyles()

  document.documentElement.style.cursor = 'none'

  const dot = document.createElement('div')
  dot.className = 'custom-cursor-dot'
  document.body.appendChild(dot)

  const ring = document.createElement('div')
  ring.className = 'custom-cursor-ring'
  document.body.appendChild(ring)

  let mouseX = window.innerWidth / 2
  let mouseY = window.innerHeight / 2
  let ringX = mouseX
  let ringY = mouseY
  let isVisible = false
  let rafId = null

  function loop() {
    ringX += (mouseX - ringX) * 0.12
    ringY += (mouseY - ringY) * 0.12

    dot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`
    ring.style.transform = `translate(${ringX - 14}px, ${ringY - 14}px)`

    rafId = requestAnimationFrame(loop)
  }

  loop()

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY

    if (!isVisible) {
      isVisible = true
      dot.style.opacity = '1'
      ring.style.opacity = '1'
    }
  })

  document.addEventListener('mouseleave', () => {
    isVisible = false
    dot.style.opacity = '0'
    ring.style.opacity = '0'
  })

  document.addEventListener('mouseenter', () => {
    isVisible = true
    dot.style.opacity = '1'
    ring.style.opacity = '1'
  })

  document.addEventListener('mousedown', () => ring.classList.add('active'))
  document.addEventListener('mouseup', () => ring.classList.remove('active'))

  document.addEventListener('mouseover', (e) => {
    const t = e.target
    if (t.closest('a, button, [role="button"], [data-cursor="pointer"]')) {
      ring.classList.add('pointer')
      dot.classList.add('dot-hidden')
    } else if (t.closest('input, textarea, [data-cursor="text"]')) {
      ring.classList.add('text')
    }
  })

  document.addEventListener('mouseout', (e) => {
    const t = e.target
    if (t.closest('a, button, [role="button"], [data-cursor="pointer"], input, textarea, [data-cursor="text"]')) {
      ring.classList.remove('pointer', 'text')
      dot.classList.remove('dot-hidden')
    }
  })

  console.log('✅ Custom cursor initialized')
}

function injectCursorStyles() {
  if (document.getElementById('custom-cursor-styles')) return

  const style = document.createElement('style')
  style.id = 'custom-cursor-styles'
  style.textContent = `
    *,
    a, button, input, textarea, [role="button"] {
      cursor: none !important;
    }

    .custom-cursor-dot {
      position: fixed;
      top: 0;
      left: 0;
      width: 6px;
      height: 6px;
      background: #8B1E1E;
      border-radius: 50%;
      pointer-events: none;
      z-index: 999999;
      opacity: 0;
      transition: opacity 200ms ease, width 200ms ease, height 200ms ease;
      will-change: transform;
    }

    .custom-cursor-dot.dot-hidden {
      opacity: 0 !important;
    }

    .custom-cursor-ring {
      position: fixed;
      top: 0;
      left: 0;
      width: 28px;
      height: 28px;
      border: 1.5px solid #8B1E1E;
      border-radius: 50%;
      pointer-events: none;
      z-index: 999998;
      opacity: 0;
      transition: opacity 200ms ease, width 300ms cubic-bezier(0.34,1.56,0.64,1), height 300ms cubic-bezier(0.34,1.56,0.64,1), background 300ms ease, border-radius 300ms ease;
      will-change: transform;
    }

    .custom-cursor-ring.pointer {
      width: 44px;
      height: 44px;
      background: rgba(139, 30, 30, 0.12);
    }

    .custom-cursor-ring.text {
      width: 2px;
      height: 22px;
      border-radius: 1px;
      background: #8B1E1E;
      border: none;
    }

    .custom-cursor-ring.active {
      transform: scale(0.85) !important;
    }

    @media (prefers-reduced-motion: reduce) {
      .custom-cursor-dot,
      .custom-cursor-ring {
        transition: opacity 200ms ease;
      }
    }
  `
  document.head.appendChild(style)
}