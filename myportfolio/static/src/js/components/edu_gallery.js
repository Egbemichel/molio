/**
 * Education hover image gallery
 * Reads data-images='["/path/img1.jpg", ...]' from [data-edu-card]
 * On hover: images fan in like a peacock tail with stagger
 * Per-image hover: rises and scales to front
 */

export function initEduGallery() {
  console.log('🖼️ Initializing education gallery...')

  injectGalleryStyles()

  const cards = document.querySelectorAll('[data-edu-card]')
  console.log(`Found ${cards.length} education card(s)`)

  if (cards.length === 0) {
    console.warn('⚠️ No [data-edu-card] elements found')
    return
  }

  cards.forEach((card) => {
    let rawImages = card.getAttribute('data-images')
    if (!rawImages) return

    let images = []
    try {
      images = JSON.parse(rawImages).slice(0, 5)
    } catch (e) {
      console.warn('⚠️ Invalid data-images JSON on card:', card)
      return
    }

    if (images.length === 0) return

    // Make card position:relative so the fan is anchored to it
    const existingPosition = window.getComputedStyle(card).position
    if (existingPosition === 'static') {
      card.style.position = 'relative'
    }

    // Build fan container
    const fan = document.createElement('div')
    fan.className = 'edu-fan'

    // Fan rotation/offset per image (front to back)
    const rotations = [0, -7, -15, 7, 15]
    const offsetsX  = [0, -40, -70, 40, 70]

    images.forEach((src, i) => {
      const img = document.createElement('img')
      img.src = src
      img.alt = `Photo ${i + 1}`
      img.className = 'edu-fan-img'
      img.loading = 'lazy'

      // Base resting transform (after animation in)
      const rot = rotations[i] || 0
      const ox  = offsetsX[i]  || 0
      img.dataset.rot = rot
      img.dataset.ox  = ox
      img.style.zIndex = images.length - i

      // Set initial (hidden) state
      img.style.transform = `translateX(${ox}px) rotate(${rot}deg) translateY(40px)`
      img.style.opacity = '0'

      // Hover: bring to front
      img.addEventListener('mouseenter', () => {
        img.style.zIndex = 100
        img.style.transform = `translateX(${ox}px) rotate(0deg) translateY(-12px) scale(1.08)`
        img.style.boxShadow = '0 20px 48px rgba(0,0,0,0.35)'
      })
      img.addEventListener('mouseleave', () => {
        img.style.zIndex = images.length - i
        img.style.transform = `translateX(${ox}px) rotate(${rot}deg) translateY(0px) scale(1)`
        img.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'
      })

      fan.appendChild(img)
    })

    card.appendChild(fan)

    // --- Show fan on card hover ---
    let showTimeout = null
    let hideTimeout = null

    card.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout)
      showTimeout = setTimeout(() => animateIn(fan), 80)
    })

    card.addEventListener('mouseleave', () => {
      clearTimeout(showTimeout)
      hideTimeout = setTimeout(() => animateOut(fan), 60)
    })
  })

  console.log('✅ Education gallery initialized')
}

function animateIn(fan) {
  const imgs = fan.querySelectorAll('.edu-fan-img')
  imgs.forEach((img, i) => {
    const rot = parseFloat(img.dataset.rot) || 0
    const ox  = parseFloat(img.dataset.ox)  || 0
    setTimeout(() => {
      img.style.transition = `transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 350ms ease, box-shadow 300ms ease`
      img.style.opacity = '1'
      img.style.transform = `translateX(${ox}px) rotate(${rot}deg) translateY(0px) scale(1)`
      img.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'
    }, i * 60)
  })
}

function animateOut(fan) {
  const imgs = Array.from(fan.querySelectorAll('.edu-fan-img')).reverse()
  imgs.forEach((img, i) => {
    const rot = parseFloat(img.dataset.rot) || 0
    const ox  = parseFloat(img.dataset.ox)  || 0
    setTimeout(() => {
      img.style.transition = `transform 280ms ease-in, opacity 220ms ease-in`
      img.style.opacity = '0'
      img.style.transform = `translateX(${ox}px) rotate(${rot}deg) translateY(40px)`
      img.style.boxShadow = 'none'
    }, i * 40)
  })
}

function injectGalleryStyles() {
  if (document.getElementById('edu-gallery-styles')) return

  const style = document.createElement('style')
  style.id = 'edu-gallery-styles'
  style.textContent = `
    .edu-fan {
      position: absolute;
      bottom: calc(100% + 12px);
      left: 50%;
      transform: translateX(-50%);
      width: 180px;
      height: 220px;
      pointer-events: none;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .edu-fan-img {
      position: absolute;
      width: 140px;
      height: 180px;
      object-fit: cover;
      border-radius: 10px;
      pointer-events: all;
      user-select: none;
      transform-origin: bottom center;
      will-change: transform, opacity;
      cursor: zoom-in;
    }

    @media (prefers-reduced-motion: reduce) {
      .edu-fan-img {
        transition: none !important;
      }
    }
  `
  document.head.appendChild(style)
}