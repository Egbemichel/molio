import { showButtonLoader, showButtonSuccess, showButtonError } from './page_loader.js'

export function initContact() {
  const form = document.getElementById('contact-form')
  if (!form) return

  const submitBtn = form.querySelector('button[type="submit"]')
  const status = form.querySelector('#contact-status')

  function setStatus(message, isError) {
    if (!status) return
    status.textContent = message
    status.classList.toggle('text-accent', !!isError)
    status.classList.toggle('opacity-60', !isError)
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    setStatus('', false)

    const data = Object.fromEntries(new FormData(form))
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1]
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

      const payload = await res.json().catch(() => ({}))

      if (res.ok) {
        showButtonSuccess(submitBtn, 3000)
        setStatus(payload.message || "Message sent — I'll get back to you soon.", false)
        setTimeout(() => {
          form.reset()
          resetBtn()
        }, 1500)
      } else {
        // Surface the server's specific reason (e.g. "Please enter a valid email")
        const reason = payload.error || 'Message failed. Please try again.'
        showButtonError(submitBtn, 'Try again', 3000)
        resetBtn()
        setStatus(reason, true)
      }
    } catch (err) {
      console.error('Contact form error:', err)
      showButtonError(submitBtn, 'Try again', 3000)
      resetBtn()
      setStatus('Network error — please check your connection or email me directly.', true)
    }
  })
}
