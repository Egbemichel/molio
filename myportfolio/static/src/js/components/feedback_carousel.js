/**
 * feedback_carousel.js
 * Displays feedback in an interactive carousel with profile images, names, and ratings
 * Updates in real-time when new feedback is submitted
 */

export function initFeedbackCarousel() {
  console.log('🎠 Initializing feedback carousel...')
  
  const carousel = document.querySelector('[data-feedback-carousel]')
  if (!carousel) {
    console.warn('⚠️ Feedback carousel container not found')
    return
  }

  // Initial load
  loadFeedback()

  // Reload feedback after form submission
  document.addEventListener('feedbackSubmitted', () => {
    console.log('🔄 Refreshing carousel after feedback submission...')
    loadFeedback()
  })
}

async function loadFeedback() {
  try {
    const response = await fetch('/api/feedback/get/')
    
    if (!response.ok) {
      throw new Error('Failed to fetch feedback')
    }

    const data = await response.json()
    const feedback = data.feedback || []

    if (feedback.length === 0) {
      console.log('ℹ️ No feedback yet')
      populateCarousel([])
      return
    }

    console.log(`📊 Loaded ${feedback.length} feedback entries`)
    populateCarousel(feedback)
  } catch (err) {
    console.error('❌ Error loading feedback:', err)
  }
}

function populateCarousel(feedbackList) {
  const carousel = document.querySelector('[data-feedback-carousel]')
  const track = carousel?.querySelector('[data-carousel-track]')
  const dots = carousel?.querySelector('[data-carousel-dots]')
  
  if (!carousel || !track || !dots) return

  // Clear existing items
  track.innerHTML = ''
  dots.innerHTML = ''

  if (feedbackList.length === 0) {
    track.innerHTML = `
      <div class="flex-shrink-0 w-full flex items-center justify-center min-h-64">
        <p class="text-dark/40 font-hagia text-lg">No feedback yet. Be the first!</p>
      </div>
    `
    return
  }

  // Create carousel items
  feedbackList.forEach((item, index) => {
    const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating)
    
    // Carousel slide
    const slide = document.createElement('div')
    slide.className = 'flex-shrink-0 w-full px-6'
    slide.innerHTML = `
      <div class="bg-gradient-to-br from-dark/5 to-dark/10 border border-dark/10 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center min-h-64">
        <!-- Profile Image -->
        <div class="flex-shrink-0">
          ${item.image 
            ? `<img src="${item.image}" alt="${item.name}" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-accent shadow-lg">`
            : `<div class="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center border-2 border-accent">
                <span class="text-4xl"><svg xmlns="http://www.w3.org/2000/svg" width="52px" height="52px" viewBox="0 0 24 24" fill="none">
<circle cx="12" cy="6" r="4" stroke="#1C274C" stroke-width="1.5"/>
<path d="M19.9975 18C20 17.8358 20 17.669 20 17.5C20 15.0147 16.4183 13 12 13C7.58172 13 4 15.0147 4 17.5C4 19.9853 4 22 12 22C14.231 22 15.8398 21.8433 17 21.5634" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
</svg></span>
              </div>`
          }
        </div>

        <!-- Content -->
        <div class="flex-1 text-center md:text-left">
          <!-- Name -->
          <h3 class="font-hagia text-2xl md:text-4xl font-medium text-dark mb-2">${item.name}</h3>
          
          <!-- Email -->
          <p class="font-hagia text-2xl text-dark/60 mb-4">${item.email}</p>
          
          <!-- Stars -->
          <div class="flex justify-center md:justify-start gap-1 mb-4">
            ${Array.from(stars).map((star, i) => `
              <span data-star="${i}" class="feedback-star text-xl cursor-pointer transition-transform hover:scale-125" title="${i + 1}/5">
                ${star}
              </span>
            `).join('')}
          </div>
          
          <!-- Message -->
          <p class="font-hagia text-xl text-dark leading-relaxed max-w-md">"${item.message}"</p>
          
          <!-- Date -->
          <p class="font-hagia text-md text-dark/40 mt-6">${new Date(item.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    `
    track.appendChild(slide)

    // Carousel dot
    const dot = document.createElement('button')
    dot.type = 'button'
    dot.className = `carousel-dot ${index === 0 ? 'is-active' : ''}`
    dot.setAttribute('data-slide', index)
    dot.setAttribute('aria-label', `Go to feedback ${index + 1}`)
    dot.addEventListener('click', () => goToSlide(index))
    dots.appendChild(dot)
  })

  // Initialize carousel
  initCarousel()
}

function initCarousel() {
  const carousel = document.querySelector('[data-feedback-carousel]')
  const track = carousel?.querySelector('[data-carousel-track]')
  const dots = carousel?.querySelectorAll('.carousel-dot')
  const prevBtn = carousel?.querySelector('[data-carousel-prev]')
  const nextBtn = carousel?.querySelector('[data-carousel-next]')
  
  if (!track) return

  let currentIndex = 0
  const slides = track.querySelectorAll('[class*="flex-shrink-0"]')
  const totalSlides = slides.length

  if (totalSlides === 0) return

  function goToSlide(index) {
    currentIndex = (index + totalSlides) % totalSlides
    const offset = -currentIndex * 100
    
    track.style.transition = 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)'
    track.style.transform = `translateX(${offset}%)`

    // Update dots
    dots?.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === currentIndex)
    })
  }

  function nextSlide() {
    goToSlide(currentIndex + 1)
  }

  function prevSlide() {
    goToSlide(currentIndex - 1)
  }

  // Button events
  nextBtn?.addEventListener('click', nextSlide)
  prevBtn?.addEventListener('click', prevSlide)

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextSlide()
    if (e.key === 'ArrowLeft') prevSlide()
  })

  // Store functions for dot interaction
  window.carouselGoToSlide = goToSlide
}

function goToSlide(index) {
  const carousel = document.querySelector('[data-feedback-carousel]')
  const track = carousel?.querySelector('[data-carousel-track]')
  
  if (!track) return

  const offset = -index * 100
  track.style.transform = `translateX(${offset}%)`

  // Update dots
  carousel?.querySelectorAll('.carousel-dot')?.forEach((dot, i) => {
    dot.classList.toggle('is-active', i === index)
  })
}

// Inject carousel CSS
function injectCarouselStyles() {
  if (document.getElementById('feedback-carousel-styles')) return

  const style = document.createElement('style')
  style.id = 'feedback-carousel-styles'
  style.textContent = `
    [data-carousel-track] {
      display: flex;
      width: 100%;
      transition: transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
      will-change: transform;
      overflow: visible;
    }

    [data-feedback-carousel] {
      overflow: hidden;
      width: 100%;
    }

    .feedback-star {
      display: inline-block;
      color: #8B1E1E;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
    }

    .carousel-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid #8B1E1E;
      background: transparent;
      cursor: pointer;
      transition: all 300ms ease;
      padding: 0;
    }

    .carousel-dot.is-active {
      background: #8B1E1E;
      transform: scale(1.3);
    }

    .carousel-dot:hover:not(.is-active) {
      border-color: #8B1E1E;
      background: rgba(139, 30, 30, 0.3);
    }

    [data-carousel-prev],
    [data-carousel-next] {
      background: #E8E8E8;
      color: #3F3F3F;
      border: border-1px solid #3F3F3F;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 300ms ease;
      flex-shrink: 0;
    }

    [data-carousel-prev]:hover,
    [data-carousel-next]:hover {
      color: #8B1E1E;
    }

    [data-carousel-prev]:active,
    [data-carousel-next]:active {
      transform: scale(0.95);
    }

    @media (prefers-reduced-motion: reduce) {
      [data-carousel-track] {
        transition: none;
      }

      .carousel-dot {
        transition: none;
      }

      [data-carousel-prev],
      [data-carousel-next] {
        transition: none;
      }
    }
  `
  document.head.appendChild(style)
}

// Initialize styles on module load
injectCarouselStyles()
