/**
 * Animated feedback form with reacting smiley face
 * Star rating with cascade animation
 * Auto-expanding textarea with character counter
 * Smooth submit with spinner-to-checkmark animation
 *
 * Form submits via fetch() to /api/feedback/
 */

import { showButtonLoader, showButtonSuccess, showButtonError } from './page_loader.js'
import { toast } from './toast.js'

export function initFeedbackForm() {
  const form = document.querySelector('[data-feedback-form]')
  if (!form) return

  // Match the HTML's data attributes exactly
  const smiley          = form.querySelector('[data-smiley-face]')
  const ratingDiv       = form.querySelector('[data-star-rating]')
  const ratingInputs    = form.querySelectorAll('[data-star-rating] input')
  const stars           = form.querySelectorAll('.rating-star')
  const nameInput       = form.querySelector('[data-feedback-name]')
  const emailInput      = form.querySelector('[data-feedback-email]')
  const imageInput      = form.querySelector('[data-feedback-image]')
  const textarea        = form.querySelector('[data-feedback-textarea]')
  const submitBtn       = form.querySelector('[data-feedback-submit]')
  const characterCounter = form.querySelector('[data-character-counter]')

  let currentRating = 0
  const maxChars = 500

  console.log('🎯 Initializing feedback form...')

  if (textarea) textarea.value = ''
  updateSmileyState(smiley, 0)

  // ── Star rating ──────────────────────────────────────────────
  stars.forEach((star, idx) => {
    const val = idx + 1

    star.addEventListener('mouseenter', () => {
      stars.forEach((s, i) => {
        s.classList.remove('is-filled', 'is-hovered')
        if (i < val) {
          s.classList.add('is-hovered')
        } else if (i < currentRating) {
          s.classList.add('is-filled')
        }
        setTimeout(() => {
          s.style.transform = i < val ? 'scale(1.2)' : 'scale(1)'
        }, i * 18)
      })
      updateSmileyState(smiley, val)
    })

    star.addEventListener('mouseleave', () => {
      stars.forEach((s, i) => {
        s.classList.remove('is-hovered')
        s.style.transform = 'scale(1)'
        if (i < currentRating) {
          s.classList.add('is-filled')
        } else {
          s.classList.remove('is-filled')
        }
      })
      // Only reset face if nothing has been clicked — otherwise freeze it
      if (currentRating === 0) updateSmileyState(smiley, 0)
    })

    star.addEventListener('click', () => {
      currentRating = val

      const label = star.closest('label')
      if (label) {
        const radio = label.querySelector('input[type="radio"]')
        if (radio) radio.checked = true
      }

      stars.forEach((s, i) => {
        s.classList.remove('is-hovered')
        if (i < val) {
          s.classList.add('is-filled')
          if (window.gsap) {
            gsap.fromTo(s,
              { scale: 0.75 },
              { scale: 1, duration: 0.4, delay: i * 0.045, ease: 'back.out(2.5)' }
            )
          }
        } else {
          s.classList.remove('is-filled')
          s.style.transform = 'scale(1)'
        }
      })
      // Face stays exactly as it was during hover — no updateSmileyState here
    })
  })

  // ── Textarea ─────────────────────────────────────────────────
  if (textarea) {
    textarea.addEventListener('input', () => {
      const len = textarea.value.length
      const remaining = maxChars - len

      if (characterCounter) {
        characterCounter.textContent = `${len}/${maxChars}`
        characterCounter.style.color   = remaining < 20 ? '#8B1E1E' : ''
        characterCounter.style.opacity = remaining < 20 ? '1' : '0.5'
      }

      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    })
  }

  // ── Submit ────────────────────────────────────────────────────
  if (submitBtn) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault()

      // Validate name
      const name = nameInput?.value?.trim()
      if (!name) {
        toast.warning('Please enter your name')
        return
      }

      // Validate email
      const email = emailInput?.value?.trim()
      if (!email) {
        toast.warning('Please enter your email')
        return
      }

      // Validate rating
      if (!currentRating) {
        toast.warning('Please select a rating')
        return
      }

      // Validate message
      const message = textarea?.value?.trim() || ''
      if (!message) {
        toast.warning('Please provide feedback')
        return
      }

      const resetBtn = showButtonLoader(submitBtn)

      try {
        // Use FormData to support file upload
        const formData = new FormData()
        formData.append('name', name)
        formData.append('email', email)
        formData.append('rating', currentRating)
        formData.append('message', message)
        if (imageInput?.files[0]) {
          formData.append('image', imageInput.files[0])
        }
        formData.append('csrfmiddlewaretoken', getCookie('csrftoken'))

        const response = await fetch('/api/feedback/', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Failed to submit feedback')

        showButtonSuccess(submitBtn, 2500)
        toast.success('Thank you! Your feedback has been received')
        updateSmileyState(smiley, 5) // 5★ = biggest smile — celebrate on success

        // Animate smiley face with pop and wiggle
        if (window.gsap) {
          gsap.timeline()
            .fromTo(smiley,
              { scale: 1, rotate: 0 },
              { scale: 1.15, duration: 0.3, ease: 'back.out(2.5)' },
              0
            )
            .to(smiley,
              { rotate: -5, duration: 0.1 },
              0.15
            )
            .to(smiley,
              { rotate: 5, duration: 0.1 },
              0.25
            )
            .to(smiley,
              { rotate: -5, duration: 0.1 },
              0.35
            )
            .to(smiley,
              { rotate: 0, scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.5)' },
              0.45
            )
        }

        // Dispatch custom event for carousel to refresh
        document.dispatchEvent(new CustomEvent('feedbackSubmitted', {
          detail: { name, email, message, rating: currentRating }
        }))

        setTimeout(() => {
          form.reset()
          currentRating = 0
          if (textarea) textarea.style.height = 'auto'
          if (characterCounter) {
            characterCounter.textContent = '0/500'
            characterCounter.style.color   = ''
            characterCounter.style.opacity = '0.5'
          }
          stars.forEach(s => s.classList.remove('is-filled', 'is-hovered'))
          updateSmileyState(smiley, 0)
          resetBtn()
        }, 1500)

      } catch (error) {
        console.error('Feedback submission error:', error)
        showButtonError(submitBtn, 'Feedback failed. Try again', 2500)
        toast.error('Something went wrong. Please try again')
        resetBtn()
      }
    })
  }

  injectFeedbackStyles()
}

function updateSmileyState(smiley, rating) {
  if (!smiley) return

  const mouth     = smiley.querySelector('[data-mouth]')
  const browL     = smiley.querySelector('[data-eyebrow="left"]')
  const browR     = smiley.querySelector('[data-eyebrow="right"]')
  const pupils    = smiley.querySelectorAll('[data-pupil]')
  const starEyeL  = smiley.querySelector('[data-star-eye="left"]')
  const starEyeR  = smiley.querySelector('[data-star-eye="right"]')
  const eyeWhites = smiley.querySelectorAll('.eye-white-l, .eye-white-r')

  // SVG Y axis goes DOWN.
  // mouthCy < 60 → curve bows UP   → SMILE
  // mouthCy > 60 → curve bows DOWN → FROWN
  // mouthCy = 60 → straight line   → NEUTRAL
  const states = {
    0: { mouthCy: 60, browLY: 30, browRY: 30, pupilDy: 0    }, // neutral flat
    1: { mouthCy: 42, browLY: 24, browRY: 24, pupilDy: -1.5 }, // 1★ = biggest smile
    2: { mouthCy: 50, browLY: 27, browRY: 27, pupilDy: -1   }, // 2★ = happy smile
    3: { mouthCy: 60, browLY: 30, browRY: 30, pupilDy: 0    }, // 3★ = neutral
    4: { mouthCy: 67, browLY: 33, browRY: 33, pupilDy: 1    }, // 4★ = sad
    5: { mouthCy: 72, browLY: 36, browRY: 36, pupilDy: 1.5  }, // 5★ = biggest frown
  }

  const s = states[rating] ?? states[0]

  if (mouth) mouth.setAttribute('d', `M 32 60 Q 50 ${s.mouthCy} 68 60`)
  if (browL)  browL.setAttribute('d', `M 28 ${s.browLY + 3} Q 34 ${s.browLY} 40 ${s.browLY + 3}`)
  if (browR)  browR.setAttribute('d', `M 60 ${s.browRY} Q 66 ${s.browRY - 3} 72 ${s.browRY}`)
  pupils.forEach(p => p.setAttribute('cy', 43 + s.pupilDy))

  // Star eyes trigger at rating 1 (biggest smile)
  const isStarred = rating === 1
  eyeWhites.forEach(e => e.style.opacity = isStarred ? '0' : '1')
  pupils.forEach(p    => p.style.opacity  = isStarred ? '0' : '1')
  if (starEyeL) starEyeL.style.opacity = isStarred ? '1' : '0'
  if (starEyeR) starEyeR.style.opacity = isStarred ? '1' : '0'

  if (isStarred && window.gsap) {
    gsap.fromTo(smiley,
      { scale: 1 },
      { scale: 1.1, yoyo: true, repeat: 1, duration: 0.18, ease: 'power2.out' }
    )
  }
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : ''
}

function injectFeedbackStyles() {
  if (document.getElementById('feedback-form-keyframes')) return

  const style = document.createElement('style')
  style.id = 'feedback-form-keyframes'
  style.textContent = `
    [data-feedback-textarea] {
      resize: none;
    }

    [data-feedback-textarea]:focus {
      border-color: #8B1E1E !important;
      box-shadow: 0 0 0 3px rgba(139, 30, 30, 0.2);
      outline: none;
    }

    [data-character-counter] {
      transition: color 300ms ease, opacity 300ms ease;
    }

    svg[data-smiley-face] path,
    svg[data-smiley-face] circle,
    svg[data-smiley-face] text {
      transition: all 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    svg[data-smiley-face] {
      transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @media (prefers-reduced-motion: reduce) {
      svg[data-smiley-face] *,
      svg[data-smiley-face],
      .rating-star {
        transition: none !important;
        animation: none !important;
      }
    }
  `
  document.head.appendChild(style)
}