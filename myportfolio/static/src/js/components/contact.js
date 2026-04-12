import { showButtonLoader, showButtonSuccess, showButtonError } from './page_loader.js'

export function initContact() {
  const form = document.getElementById('contact-form')
  if (!form) return

  const submitBtn = form.querySelector('button[type="submit"]')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(form))
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1]

    // Show loader on button
    const resetBtn = showButtonLoader(submitBtn)

    try {
      const res = await fetch('/contact/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        // Show success state
        showButtonSuccess(submitBtn, 3000)
        
        // Clear form after success animation
        setTimeout(() => {
          form.reset()
          resetBtn()
        }, 1500)
      } else {
        throw new Error('Server error')
      }
    } catch (err) {
      console.error('Contact form error:', err)
      showButtonError(submitBtn, 'Message failed. Try again', 3000)
      resetBtn()
    }
  })
}
