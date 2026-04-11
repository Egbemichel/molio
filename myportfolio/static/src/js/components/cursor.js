/**
 * Custom dual-layer cursor
 * Layer 1: 6px precision dot (no easing)
 * Layer 2: 28px ring (slight easing, lerp factor 0.12)
 * 
 * Behaviors:
 * - Hover links/buttons: ring scales to 44px with fill, dot disappears
 * - Hover text elements: ring becomes I-beam
 * - Click: ring pulses
 * - Touch devices: disabled
 * - prefers-reduced-motion: respects user preference
 */

export function initCursor() {
  console.log('🖱️ Initializing custom cursor...')
  
  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) {
    console.log('⚠️ Touch device detected, cursor disabled')
    return
  }

  // Skip if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    console.log('⚠️ Reduced motion preference detected, cursor disabled')
    return
  }

  const cursor = {
    dot: null,
    ring: null,
    x: 0,
    y: 0,
    ringX: 0,
    ringY: 0,
    isVisible: true,
    isPointer: false,
    isText: false,
    scale: 1,
    ringScale: 1,

    init() {
      this.createElements()
      this.attachEvents()
      this.startAnimation()
    },

    createElements() {
      // Precision dot (6px)
      this.dot = document.createElement('div')
      this.dot.className = 'cursor-dot'
      this.dot.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background-color: #8B1E1E;
        border-radius: 50%;
        pointer-events: none;
        z-index: 99999;
        top: 0;
        left: 0;
        will-change: transform;
        box-shadow: 0 0 4px rgba(139, 30, 30, 0.8), 0 0 8px rgba(139, 30, 30, 0.4);
        display: block;
      `
      document.body.appendChild(this.dot)

      // Tracer ring (28px)
      this.ring = document.createElement('div')
      this.ring.className = 'cursor-ring'
      this.ring.style.cssText = `
        position: fixed;
        width: 28px;
        height: 28px;
        border: 2px solid #8B1E1E;
        border-radius: 50%;
        pointer-events: none;
        z-index: 99998;
        top: 0;
        left: 0;
        will-change: transform;
        box-shadow: 0 0 0 rgba(139, 30, 30, 0.2);
        display: block;
      `
      document.body.appendChild(this.ring)
    },

    attachEvents() {
      // Mouse move - update position
      document.addEventListener('mousemove', (e) => {
        this.x = e.clientX
        this.y = e.clientY

        if (!this.isVisible) {
          this.show()
        }
      })

      // Mouse leave window - hide cursor
      document.addEventListener('mouseleave', () => {
        this.hide()
      })

      // Mouse enter window - show cursor
      document.addEventListener('mouseenter', () => {
        this.show()
      })

      // Click - pulse effect
      document.addEventListener('mousedown', () => {
        this.pulse()
      })

      // Hover detection
      document.addEventListener('mouseover', (e) => {
        const target = e.target

        // Check for pointer cursor
        if (
          target.tagName === 'A' ||
          target.tagName === 'BUTTON' ||
          target.closest('[data-cursor="pointer"]') ||
          window.getComputedStyle(target).cursor === 'pointer'
        ) {
          this.setPointer(true)
        }
        // Check for text cursor
        else if (
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.closest('[data-cursor="text"]') ||
          window.getComputedStyle(target).cursor === 'text'
        ) {
          this.setText(true)
        } else {
          this.setNormal()
        }
      })

      document.addEventListener('mouseout', (e) => {
        const target = e.target

        if (
          target.tagName === 'A' ||
          target.tagName === 'BUTTON' ||
          target.closest('[data-cursor="pointer"]') ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.closest('[data-cursor="text"]')
        ) {
          this.setNormal()
        }
      })
    },

    startAnimation() {
      const animate = () => {
        // Precision dot follows exactly (no easing)
        this.updateDot()

        // Ring follows with lerp (easing)
        this.updateRing()

        requestAnimationFrame(animate)
      }

      animate()
    },

    updateDot() {
      if (!this.isVisible) return

      const translateX = this.x - 3 // Center the 6px dot
      const translateY = this.y - 3

      this.dot.style.transform = `translate(${translateX}px, ${translateY}px) scale(${this.scale})`
    },

    updateRing() {
      if (!this.isVisible) return

      // Lerp factor
      const lerpFactor = 0.12
      this.ringX += (this.x - this.ringX) * lerpFactor
      this.ringY += (this.y - this.ringY) * lerpFactor

      const translateX = this.ringX - 14 // Center the 28px ring
      const translateY = this.ringY - 14

      this.ring.style.transform = `translate(${translateX}px, ${translateY}px) scale(${this.ringScale})`
    },

    setPointer(active) {
      this.isPointer = active

      if (active) {
        this.ring.style.display = 'block'
        this.ringScale = 1.57 // 44px / 28px
        this.ring.style.backgroundColor = 'rgba(139, 30, 30, 0.15)'
        this.ring.style.borderColor = '#8B1E1E'
        this.ring.style.borderWidth = '2px'
      } else {
        this.setNormal()
      }
    },

    setText(active) {
      this.isText = active

      if (active) {
        this.ring.style.display = 'block'
        // I-beam morphing - use clip-path or just show as vertical line
        this.ring.style.borderRadius = '0'
        this.ring.style.width = '2px'
        this.ring.style.height = '20px'
        this.ring.style.borderColor = '#8B1E1E'
      } else {
        this.setNormal()
      }
    },

    setNormal() {
      this.isPointer = false
      this.isText = false
      this.ringScale = 1

      this.dot.style.display = 'block'
      this.ring.style.display = 'block'
      this.ring.style.borderRadius = '50%'
      this.ring.style.width = '28px'
      this.ring.style.height = '28px'
      this.ring.style.backgroundColor = 'transparent'
      this.ring.style.borderColor = '#8B1E1E'
      this.ring.style.borderWidth = '2px'
    },

    pulse() {
      // Spring pulse animation - scale down then back
      this.ringScale = 0.7

      setTimeout(() => {
        this.ringScale = 1
      }, 100)
    },

    show() {
      this.isVisible = true
      this.dot.style.display = 'block'
      this.ring.style.display = 'block'
    },

    hide() {
      this.isVisible = false
      this.dot.style.display = 'none'
      this.ring.style.display = 'none'
    },
  }

  // Hide default cursor - apply to all elements
  const style = document.createElement('style')
  style.textContent = `
    * {
      cursor: none !important;
    }
    a, button, label, [role="button"] {
      cursor: none !important;
    }
    textarea, input {
      cursor: none !important;
    }
  `
  document.head.appendChild(style)

  cursor.init()
  console.log('✅ Custom cursor initialized successfully')
}
