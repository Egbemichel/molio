export function initContact() {
  const form = document.getElementById('contact-form')
  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(form))
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1]

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
        form.innerHTML = '<p class="text-accent font-semibold">Message sent! I\'ll be in touch.</p>'
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
  })
}
