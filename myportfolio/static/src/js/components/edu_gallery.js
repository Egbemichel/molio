/**
 * Education image gallery with arrow key navigation
 * Reads data-images='["/path/img1.jpg", ...]' from [data-edu-card]
 * On hover: shows prompt to press Enter
 * On Enter: opens modal with first image
 * Left/Right arrows: shuffle through images like a deck of cards
 * ESC to close modal
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
      images = JSON.parse(rawImages).slice(0, 10)
    } catch (e) {
      console.warn('⚠️ Invalid data-images JSON on card:', card)
      return
    }

    if (images.length === 0) return

    // Handle Enter key to open modal
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && card.matches(':hover')) {
        e.preventDefault()
        openGalleryModal(images, card)
        document.removeEventListener('keydown', handleKeyPress)
        // Re-add listener after modal closes
        setTimeout(() => {
          document.addEventListener('keydown', handleKeyPress)
        }, 500)
      }
    }

    document.addEventListener('keydown', handleKeyPress)

    // Handle hover to show/hide prompt in bottom-left
    let promptElement = null

    card.addEventListener('mouseenter', () => {
      // Create prompt indicator in bottom-left
      promptElement = document.createElement('div')
      promptElement.className = 'edu-hover-prompt'
      promptElement.innerHTML = `
        <div class="edu-hover-prompt-content">
          <div class="edu-hover-prompt-header">
            <span class="edu-hover-prompt-dot"></span>
            <span class="edu-hover-prompt-title">Memories</span>
          </div>
          <div class="edu-hover-prompt-text">Explore my memories from this time</div>
          <div class="edu-hover-prompt-key">Enter</div>
        </div>
      `
      document.body.appendChild(promptElement)

      // Trigger animation
      setTimeout(() => {
        promptElement.classList.add('visible')
      }, 5)
    })

    card.addEventListener('mouseleave', () => {
      // Remove prompt with fade animation
      if (promptElement) {
        promptElement.classList.remove('visible')
        setTimeout(() => {
          if (promptElement) {
            promptElement.remove()
            promptElement = null
          }
        }, 550)
      }
    })
  })

  console.log('✅ Education gallery initialized')
}

function openGalleryModal(images, sourceCard) {
  let currentIndex = 0

  // Create overlay
  const overlay = document.createElement('div')
  overlay.className = 'edu-modal-overlay'

  // Create modal container
  const modal = document.createElement('div')
  modal.className = 'edu-modal'

  // Create gallery container with single image display
  const gallery = document.createElement('div')
  gallery.className = 'edu-modal-gallery'
  gallery.style.display = 'flex'
  gallery.style.alignItems = 'center'
  gallery.style.justifyContent = 'center'
  gallery.style.height = '100%'

  // Create image element
  const img = document.createElement('img')
  img.src = images[0]
  img.alt = 'Memory 1'
  img.className = 'edu-modal-img-single'
  img.style.opacity = '0'
  gallery.appendChild(img)

  // Create counter display
  const counter = document.createElement('div')
  counter.className = 'edu-image-counter'
  counter.textContent = `1 / ${images.length}`
  modal.appendChild(counter)

  modal.appendChild(gallery)

  // Handle arrow key navigation
  const handleArrowKey = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      navigateImage(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      navigateImage(-1)
    } else if (e.key === 'Escape') {
      closeGalleryModal(overlay, handleArrowKey, handleOverlayClick)
    }
  }

  function navigateImage(direction) {
    const oldIndex = currentIndex
    currentIndex = (currentIndex + direction + images.length) % images.length

    // Animate out in one direction
    img.style.transform = `translateX(${direction > 0 ? 400 : -400}px) rotateY(${direction > 0 ? 15 : -15}deg)`
    img.style.opacity = '0'

    setTimeout(() => {
      // Change image
      img.src = images[currentIndex]
      counter.textContent = `${currentIndex + 1} / ${images.length}`

      // Reset position off-screen in opposite direction
      img.style.transform = `translateX(${direction > 0 ? -400 : 400}px) rotateY(${direction > 0 ? -15 : 15}deg)`
      img.style.opacity = '0'

      // Animate in from opposite direction
      setTimeout(() => {
        img.style.transition = `transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease`
        img.style.transform = 'translateX(0) rotateY(0deg)'
        img.style.opacity = '1'
      }, 10)
    }, 300)
  }

  // Close on overlay click (outside modal)
  const handleOverlayClick = (e) => {
    if (e.target === overlay) {
      closeGalleryModal(overlay, handleArrowKey, handleOverlayClick)
    }
  }

  overlay.addEventListener('click', handleOverlayClick)
  document.addEventListener('keydown', handleArrowKey)

  // Create navigation hint toast (bottom-left)
  const navHint = document.createElement('div')
  navHint.className = 'edu-nav-hint'
  navHint.innerHTML = `
    <div class="edu-nav-hint-content">
      <div class="edu-nav-hint-header">
        <span class="edu-nav-hint-dot"></span>
        <span class="edu-nav-hint-title">Navigate</span>
      </div>
      <div class="edu-nav-hint-controls">
        <div class="edu-nav-hint-item">
          <span class="edu-nav-hint-key">←</span>
          <span class="edu-nav-hint-label">Previous</span>
        </div>
        <div class="edu-nav-hint-item">
          <span class="edu-nav-hint-key">→</span>
          <span class="edu-nav-hint-label">Next</span>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(navHint)

  // Show the hint with animation
  setTimeout(() => {
    navHint.classList.add('visible')
  }, 50)

  // Create arrow navigation hints
  const leftArrow = document.createElement('div')
  leftArrow.className = 'edu-nav-arrow edu-nav-arrow-left'
  leftArrow.innerHTML = '‹'
  leftArrow.addEventListener('click', () => navigateImage(-1))

  const rightArrow = document.createElement('div')
  rightArrow.className = 'edu-nav-arrow edu-nav-arrow-right'
  rightArrow.innerHTML = '›'
  rightArrow.addEventListener('click', () => navigateImage(1))

  overlay.appendChild(leftArrow)
  overlay.appendChild(rightArrow)

  // Create ESC close indicator
  const closePrompt = document.createElement('div')
  closePrompt.className = 'edu-close-prompt'
  closePrompt.innerHTML = `
    <div class="edu-close-prompt-content">
      <div class="edu-close-prompt-text">Press to close</div>
      <div class="edu-close-prompt-key">ESC</div>
    </div>
  `
  overlay.appendChild(closePrompt)

  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  // Animate first image in
  setTimeout(() => {
    overlay.style.opacity = '1'
    closePrompt.style.opacity = '1'
    img.style.transition = `transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 500ms ease`
    img.style.transform = 'translateX(0) rotateY(0deg)'
    img.style.opacity = '1'
  }, 10)

  // Store reference to navHint and overlay for cleanup
  overlay._navHint = navHint
}

function closeGalleryModal(overlay, handleArrowKey, handleOverlayClick) {
  // Remove event listeners
  document.removeEventListener('keydown', handleArrowKey)
  overlay.removeEventListener('click', handleOverlayClick)

  // Fade out and remove navigation hint
  if (overlay._navHint) {
    overlay._navHint.classList.remove('visible')
    setTimeout(() => {
      overlay._navHint.remove()
    }, 550)
  }

  // Fade out overlay
  overlay.style.opacity = '0'

  // Fade out close prompt
  const closePrompt = overlay.querySelector('.edu-close-prompt')
  if (closePrompt) {
    closePrompt.style.opacity = '0'
  }

  // Fade out image
  const img = overlay.querySelector('.edu-modal-img-single')
  if (img) {
    img.style.opacity = '0'
    img.style.transform = 'translateX(400px) scale(0.8)'
  }

  // Remove overlay after animation
  setTimeout(() => {
    overlay.remove()
  }, 500)
}

function injectGalleryStyles() {
  if (document.getElementById('edu-gallery-styles')) return

  const style = document.createElement('style')
  style.id = 'edu-gallery-styles'
  style.textContent = `
    /* Hover Prompt - Bottom-left, matches keyboard shortcuts style */
    .edu-hover-prompt {
      position: fixed;
      bottom: 32px;
      left: 32px;
      z-index: 88888;
      display: flex;
      flex-direction: column;
      gap: 12px;
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

    .edu-hover-prompt.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .edu-hover-prompt-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .edu-hover-prompt-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .edu-hover-prompt-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #8B1E1E;
      flex-shrink: 0;
      animation: hoverPromptPulse 2.4s ease-in-out infinite;
    }

    .edu-hover-prompt-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.2);
    }

    .edu-hover-prompt-text {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.02em;
      line-height: 1.5;
    }

    .edu-hover-prompt-key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: fit-content;
      gap: 4px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      background: rgba(255,255,255,0.05);
      padding: 6px 12px;
      border-radius: 6px;
      color: rgba(255,255,255,0.45);
      font-weight: 600;
      letter-spacing: 0.8px;
      border: 0.5px solid rgba(255,255,255,0.12);
      text-transform: uppercase;
    }

    .edu-hover-prompt-key::before {
      content: '↵';
      font-size: 10px;
      margin-right: 2px;
      opacity: 0.7;
    }

    @keyframes hoverPromptPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.25; }
    }

    /* ESC Close Prompt - Premium */
    .edu-close-prompt {
      position: fixed;
      top: 40px;
      right: 40px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 1001;
    }

    .edu-close-prompt-content {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      backdrop-filter: blur(20px);
      padding: 16px 24px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(139, 30, 30, 0.3);
      position: relative;
      overflow: hidden;
    }

    .edu-close-prompt-content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(139, 30, 30, 0.5), transparent);
    }

    .edu-close-prompt-text {
      font-family: 'Hagia', sans-serif;
      font-size: 13px;
      color: #e8e8e8;
      font-weight: 400;
      letter-spacing: 0.5px;
      text-align: center;
      line-height: 1.4;
    }

    .edu-close-prompt-key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      background: linear-gradient(135deg, rgba(139, 30, 30, 0.4), rgba(139, 30, 30, 0.2));
      padding: 6px 12px;
      border-radius: 6px;
      color: #FFB19A;
      font-weight: 600;
      letter-spacing: 0.8px;
      border: 1px solid rgba(139, 30, 30, 0.4);
      box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.05);
      text-transform: uppercase;
      transition: all 300ms ease;
    }

    /* Modal Overlay */
    .edu-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      transition: opacity 300ms ease;
    }

    /* Modal Container */
    .edu-modal {
      position: relative;
      width: 90%;
      height: 80vh;
      max-width: 1000px;
      max-height: 600px;
    }

    /* Gallery Grid */
    .edu-modal-gallery {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Single Image Display */
    .edu-modal-img-single {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
      user-select: none;
      will-change: transform, opacity;
      transform-style: preserve-3d;
    }

    /* Image Counter */
    .edu-image-counter {
      position: absolute;
      bottom: -60px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: rgba(232, 232, 232, 0.7);
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      pointer-events: none;
    }

    /* Navigation Hint Toast — bottom-left, matches keyboard shortcuts style */
    .edu-nav-hint {
      position: fixed;
      bottom: 32px;
      left: 32px;
      z-index: 88888;
      display: flex;
      flex-direction: column;
      gap: 12px;
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
      min-width: 200px;
    }

    .edu-nav-hint.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .edu-nav-hint-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .edu-nav-hint-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .edu-nav-hint-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #8B1E1E;
      flex-shrink: 0;
      animation: navHintPulse 2.4s ease-in-out infinite;
    }

    .edu-nav-hint-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.2);
    }

    .edu-nav-hint-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .edu-nav-hint-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .edu-nav-hint-key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 6px;
      background: rgba(255,255,255,0.05);
      border: 0.5px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      font-family: monospace;
      font-size: 14px;
      color: rgba(255,255,255,0.45);
      font-weight: 600;
      line-height: 1;
    }

    .edu-nav-hint-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: rgba(255,255,255,0.25);
      letter-spacing: 0.02em;
    }

    @keyframes navHintPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.25; }
    }

    /* Navigation Arrows */
    .edu-nav-arrow {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      user-select: none;
      transition: all 300ms ease;
      z-index: 10000;
      font-weight: 300;
      letter-spacing: -2px;
    }

    .edu-nav-arrow:hover {
      color: rgba(255, 255, 255, 1);
      transform: translateY(-50%) scale(1.2);
    }

    .edu-nav-arrow-left {
      left: 40px;
    }

    .edu-nav-arrow-right {
      right: 40px;
    }

    /* Image Wrapper - Remove old styles */
    .edu-modal-img-wrapper {
      position: absolute;
      width: 320px;
      height: 400px;
      display: none;
    }

    /* Modal Images - Remove old styles */
    .edu-modal-img {
      display: none;
    }

    @media (max-width: 768px) {
      .edu-modal {
        width: 95%;
        height: 70vh;
        max-width: 500px;
        max-height: 400px;
      }

      .edu-nav-arrow {
        width: 40px;
        height: 40px;
        font-size: 28px;
      }

      .edu-nav-arrow-left {
        left: 15px;
      }

      .edu-nav-arrow-right {
        right: 15px;
      }

      .edu-image-counter {
        font-size: 12px;
        bottom: -50px;
      }

      .edu-prompt-content {
        flex-direction: column;
        gap: 8px;
        padding: 10px 16px;
      }

      .edu-prompt-text {
        font-size: 12px;
      }

      .edu-close-prompt {
        top: 20px;
        right: 20px;
      }

      .edu-nav-hint {
        bottom: 20px;
        left: 20px;
        min-width: 160px;
        padding: 16px 20px 18px;
        font-size: 12px;
      }

      .edu-nav-hint-key {
        min-width: 28px;
        height: 28px;
        font-size: 12px;
      }

      .edu-nav-hint-label {
        font-size: 12px;
      }

      .edu-hover-prompt {
        bottom: 20px;
        left: 20px;
        min-width: 160px;
        padding: 16px 20px 18px;
        font-size: 12px;
      }

      .edu-hover-prompt-key {
        font-size: 10px;
      }

      .edu-hover-prompt-text {
        font-size: 12px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .edu-modal-overlay,
      .edu-nav-hint,
      .edu-hover-prompt,
      .edu-modal-img {
        transition: none !important;
      }
    }
  `
  document.head.appendChild(style)
}