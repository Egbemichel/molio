/**
 * Education section image hover gallery
 * Images fan out on hover with staggered entrance
 * Individual image hover effects with lift animation
 * 
 * Usage: Add data-images='[...]' to education entry elements
 */

export function initEduGallery() {
  const educationCards = document.querySelectorAll('[data-edu-card]')

  educationCards.forEach((card) => {
    const imagesJson = card.getAttribute('data-images')
    if (!imagesJson) return

    try {
      const images = JSON.parse(imagesJson)
      createImageFan(card, images)
    } catch (e) {
      console.error('Invalid education images data:', e)
    }
  })

  // Inject styles
  injectEduGalleryStyles()
}

function createImageFan(container, images) {
  // Create fan container
  const fanContainer = document.createElement('div')
  fanContainer.className = 'edu-image-fan'
  fanContainer.style.cssText = `
    position: absolute;
    bottom: -200px;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    height: 200px;
    perspective: 1000px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 300ms ease-out;
  `

  // Create images with fan arrangement
  const rotations = [-15, -7, 0, 7, 15]
  const offsetX = [-60, -30, 0, 30, 60]

  images.forEach((imageSrc, index) => {
    if (index >= 5) return // Max 5 images in fan

    const img = document.createElement('img')
    img.src = imageSrc
    img.alt = `Education moment ${index + 1}`
    img.className = 'edu-fan-image'
    img.style.cssText = `
      position: absolute;
      width: 80px;
      height: 100px;
      object-fit: cover;
      border-radius: 0.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transform: translateX(${offsetX[index]}px) rotate(${rotations[index]}deg) scale(0.8) translateY(20px);
      opacity: 0;
      transition: all 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: ${5 - index};
    `

    // Hover effect on individual image
    img.addEventListener('mouseenter', () => {
      img.style.transform = `translateX(${offsetX[index]}px) rotate(${rotations[index]}deg) translateY(-12px) scale(1.08)`
      img.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.2)'
      img.style.zIndex = '100'
    })

    img.addEventListener('mouseleave', () => {
      img.style.transform = `translateX(${offsetX[index]}px) rotate(${rotations[index]}deg) scale(1) translateY(0)`
      img.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)'
      img.style.zIndex = `${5 - index}`
    })

    // Add delay for staggered entrance
    const delay = index * 60 // 60ms stagger
    img.style.animationDelay = `${delay}ms`

    fanContainer.appendChild(img)
  })

  // Insert fan after the education entry card
  const insertPoint = container.querySelector('[data-edu-content]') || container
  insertPoint.parentNode.insertBefore(fanContainer, insertPoint.nextSibling)

  // On hover of education card, show fan
  container.addEventListener('mouseenter', () => {
    fanContainer.style.opacity = '1'
    fanContainer.style.pointerEvents = 'auto'

    // Animate images in
    const eduImages = fanContainer.querySelectorAll('.edu-fan-image')
    eduImages.forEach((img, index) => {
      setTimeout(() => {
        img.style.opacity = '1'
        img.style.transform = `translateX(${offsetX[index]}px) rotate(${rotations[index]}deg) scale(1) translateY(0)`
      }, index * 60)
    })
  })

  // On leave, hide fan
  container.addEventListener('mouseleave', () => {
    fanContainer.style.opacity = '0'
    fanContainer.style.pointerEvents = 'none'

    // Animate images out
    const eduImages = fanContainer.querySelectorAll('.edu-fan-image')
    eduImages.forEach((img, index) => {
      img.style.opacity = '0'
      img.style.transform = `translateX(${offsetX[index]}px) rotate(${rotations[index]}deg) scale(0.8) translateY(20px)`
    })
  })

  // Allow hover over fan itself
  fanContainer.addEventListener('mouseenter', () => {
    fanContainer.style.opacity = '1'
    fanContainer.style.pointerEvents = 'auto'
  })

  fanContainer.addEventListener('mouseleave', () => {
    fanContainer.style.opacity = '0'
    fanContainer.style.pointerEvents = 'none'

    const eduImages = fanContainer.querySelectorAll('.edu-fan-image')
    eduImages.forEach((img, index) => {
      img.style.opacity = '0'
      img.style.transform = `translateX(${offsetX[index]}px) rotate(${rotations[index]}deg) scale(0.8) translateY(20px)`
    })
  })
}

function injectEduGalleryStyles() {
  if (document.getElementById('edu-gallery-styles')) return

  const style = document.createElement('style')
  style.id = 'edu-gallery-styles'
  style.textContent = `
    @media (prefers-reduced-motion: reduce) {
      .edu-image-fan {
        opacity: 1 !important;
        pointer-events: auto !important;
      }

      .edu-fan-image {
        opacity: 1 !important;
        transform: translateX(0) rotate(0) scale(1) translateY(0) !important;
      }
    }
  `
  document.head.appendChild(style)
}
