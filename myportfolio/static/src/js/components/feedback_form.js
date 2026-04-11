/**
 * Animated feedback form with reacting smiley face
 * Star rating with cascade animation
 * Auto-expanding textarea with character counter
 * Smooth submit with spinner-to-checkmark animation
 * 
 * Form submits via fetch() to /api/feedback/
 */

export function initFeedbackForm() {
  const form = document.querySelector('[data-feedback-form]')
  if (!form) return

  const smiley = form.querySelector('[data-smiley-face]')
  const ratingDiv = form.querySelector('[data-star-rating]')
  const ratingInputs = form.querySelectorAll('[data-star-rating] input')
  const textarea = form.querySelector('[data-feedback-textarea]')
  const submitBtn = form.querySelector('[data-feedback-submit]')
  const characterCounter = form.querySelector('[data-character-counter]')

  let currentRating = 0
  const maxChars = 500

  console.log('🎯 Initializing feedback form...')
  console.log('Found', ratingInputs.length, 'rating inputs')

  // Smiley face setup
  if (smiley) {
    updateSmileyState(smiley, 0)
  }

  // Textarea cleanup - remove any default text on load
  if (textarea) {
    textarea.value = ''
  }

  // Star rating setup with click delegation
  if (ratingDiv) {
    ratingDiv.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'radio') {
        const input = e.target
        const rating = parseInt(input.value)
        currentRating = rating
        console.log('⭐ Rating selected:', rating)
        
        updateSmileyState(smiley, rating)
        populateStars(ratingInputs, rating)
      }
    })
  }

  // Direct input change listeners as backup
  ratingInputs.forEach((input, index) => {
    const rating = index + 1

    input.addEventListener('change', () => {
      currentRating = rating
      console.log('📌 Change event fired for rating:', rating)
      updateSmileyState(smiley, rating)
      populateStars(ratingInputs, rating)
    })

    // Hover preview of stars
    input.addEventListener('mouseenter', () => {
      cascadeStars(ratingInputs, rating, true)
    })

    input.addEventListener('mouseleave', () => {
      cascadeStars(ratingInputs, currentRating, false)
    })
  })

  // Textarea auto-expand and smiley interaction
  if (textarea) {
    textarea.addEventListener('input', () => {
      // Auto-expand
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'

      // Update character counter
      const remaining = maxChars - textarea.value.length
      if (characterCounter) {
        characterCounter.textContent = `${textarea.value.length}/${maxChars}`

        if (remaining < 20) {
          characterCounter.style.color = '#8B1E1E'
        } else {
          characterCounter.style.color = 'rgba(63, 63, 63, 0.5)'
        }
      }

      // Update smiley based on typing - move from neutral/sad to happy
      if (textarea.value.length > 0 && currentRating <= 3) {
        // If typing and rating is low, bump smiley toward happy
        updateSmileyState(smiley, 4)
      } else if (textarea.value.length === 0 && currentRating === 0) {
        // If nothing typed and no rating, show neutral
        updateSmileyState(smiley, currentRating)
      }
    })
  }

  // Form submit
  if (submitBtn) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault()

      const message = textarea?.value || ''

      if (!currentRating) {
        alert('Please select a rating')
        return
      }

      if (!message.trim()) {
        alert('Please provide feedback')
        return
      }

      // Disable button and show spinner
      submitBtn.disabled = true
      const originalText = submitBtn.innerHTML
      showSubmitSpinner(submitBtn)

      try {
        // Submit form
        const response = await fetch('/api/feedback/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          body: JSON.stringify({
            rating: currentRating,
            message: message,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to submit feedback')
        }

        // Show success
        showSubmitSuccess(submitBtn, smiley)

        // Reset form
        setTimeout(() => {
          form.reset()
          currentRating = 0
          if (textarea) {
            textarea.style.height = 'auto'
          }
          if (characterCounter) {
            characterCounter.textContent = '0/500'
          }
          populateStars(ratingInputs, 0)
          updateSmileyState(smiley, 0)
          submitBtn.disabled = false
          submitBtn.innerHTML = originalText
        }, 2000)
      } catch (error) {
        console.error('Feedback submission error:', error)
        alert('Failed to submit feedback. Please try again.')
        submitBtn.disabled = false
        submitBtn.innerHTML = originalText
      }
    })
  }

  injectFeedbackStyles()
}

function updateSmileyState(smiley, rating) {
  if (!smiley) return

  const mouth = smiley.querySelector('[data-mouth]')
  const eyes = smiley.querySelectorAll('[data-eye]')
  const eyebrows = smiley.querySelectorAll('[data-eyebrow]')

  const states = {
    0: {
      mouth: 'M 30 45 Q 50 45 70 45', // Neutral line
      eyeScale: 1,
      eyebrowRotate: 0,
    },
    1: {
      mouth: 'M 30 50 Q 50 35 70 50', // Very sad frown
      eyeScale: 0.7,
      eyebrowRotate: -15,
    },
    2: {
      mouth: 'M 30 48 Q 50 43 70 48', // Sad
      eyeScale: 0.85,
      eyebrowRotate: -10,
    },
    3: {
      mouth: 'M 30 45 Q 50 45 70 45', // Neutral
      eyeScale: 1,
      eyebrowRotate: 0,
    },
    4: {
      mouth: 'M 30 40 Q 50 55 70 40', // Happy smile
      eyeScale: 1.1,
      eyebrowRotate: 10,
    },
    5: {
      mouth: 'M 30 38 Q 50 58 70 38', // Very happy big smile
      eyeScale: 1.2,
      eyebrowRotate: 15,
    },
  }

  const state = states[rating] || states[0]

  if (mouth) {
    mouth.setAttribute(
      'd',
      state.mouth
    )
    mouth.style.transition = 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
  }

  eyes.forEach((eye) => {
    eye.style.transform = `scale(${state.eyeScale})`
    eye.style.transition = 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
  })

  eyebrows.forEach((brow) => {
    brow.style.transform = `rotate(${state.eyebrowRotate}deg)`
    brow.style.transition = 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
  })

  // At 5 stars, eyes become stars
  if (rating === 5) {
    eyes.forEach((eye) => {
      eye.innerHTML = '★'
      eye.style.fontSize = '1.5rem'
      eye.style.color = '#8B1E1E'
      eye.style.animation = 'smileyBounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
    })
  } else {
    eyes.forEach((eye) => {
      eye.innerHTML = '<circle cx="50%" cy="50%" r="4" fill="currentColor"/>'
      eye.style.animation = 'none'
    })
  }
}

function cascadeStars(inputs, upToRating, isHovering) {
  inputs.forEach((input, index) => {
    const starNum = index + 1
    const label = input.closest('label')
    const star = label ? label.querySelector('.star') : null

    if (!star) {
      console.warn(`⚠️ Star ${starNum} not found`)
      return
    }

    if (starNum <= upToRating) {
      star.style.transform = 'scale(1.15)'
      star.style.color = '#8B1E1E'
    } else {
      star.style.transform = 'scale(1)'
      star.style.color = 'rgba(63, 63, 63, 0.3)'
    }

    // Stagger animation on hover
    if (isHovering && starNum <= upToRating) {
      const delay = (index * 20) // 20ms stagger
      star.style.transitionDelay = `${delay}ms`
    } else {
      star.style.transitionDelay = '0ms'
    }
  })
}

function populateStars(inputs, rating) {
  console.log('🎨 Populating stars up to rating:', rating)
  
  inputs.forEach((input, index) => {
    const starNum = index + 1
    const label = input.closest('label')
    const star = label ? label.querySelector('.star') : null

    if (!star) {
      console.warn(`⚠️ Could not find star ${starNum}`)
      return
    }

    if (starNum <= rating) {
      star.style.color = '#8B1E1E'
      star.style.transform = 'scale(1.1)'
      console.log(`✅ Star ${starNum} colored`)
    } else {
      star.style.color = 'rgba(63, 63, 63, 0.3)'
      star.style.transform = 'scale(1)'
      console.log(`⭕ Star ${starNum} reset`)
    }
  })
}

function showSubmitSpinner(button) {
  button.innerHTML = `
    <span class="inline-block" style="
      width: 20px;
      height: 20px;
      border: 3px solid rgba(139, 30, 30, 0.3);
      border-top-color: #8B1E1E;
      border-radius: 50%;
      animation: feedbackSpinner 1s linear infinite;
    "></span>
  `
}

function showSubmitSuccess(button, smiley) {
  button.innerHTML = `
    <span style="font-size: 1.5rem;">✓</span>
  `
  button.style.backgroundColor = '#8B1E1E'
  button.style.color = 'white'

  // Smiley bounce on success
  if (smiley) {
    smiley.style.animation = 'smileyBounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
}

function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

function injectFeedbackStyles() {
  if (document.getElementById('feedback-form-keyframes')) return

  const style = document.createElement('style')
  style.id = 'feedback-form-keyframes'
  style.textContent = `
    @keyframes feedbackSpinner {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes smileyBounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-4px);
      }
    }

    [data-feedback-textarea] {
      resize: none;
      field-sizing: content;
    }

    [data-feedback-textarea]:focus {
      border-color: #8B1E1E;
      box-shadow: 0 0 0 3px rgba(139, 30, 30, 0.2);
      outline: none;
    }

    [data-character-counter] {
      transition: color 300ms;
    }

    @media (prefers-reduced-motion: reduce) {
      @keyframes feedbackSpinner {
        to {
          transform: rotate(0);
        }
      }

      @keyframes smileyBounce {
        to {
          transform: translateY(0);
        }
      }

      [data-smiley-face] * {
        transition: none !important;
      }

      .star {
        transition: none !important;
      }
    }
  `
  document.head.appendChild(style)
}
