/**
 * details.js — the small interactions: scroll reveals, the portrait sticker,
 * Mich saying hello, and the contact form.
 */

export function initReveals(reducedMotion) {
  const items = document.querySelectorAll('.reveal')
  if (reducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'))
    return
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in')
        io.unobserve(e.target)
      }
    }
  }, { rootMargin: '0px 0px -12% 0px' })
  items.forEach((el) => io.observe(el))
}

/** The portrait flips between composed and laughing Mich (tap on touch). */
export function initSticker() {
  document.querySelectorAll('[data-sticker]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true')
    })
  })
}

/** Mich's own "hello", in English or French. Plain <audio>, no library. */
export function initHello() {
  let audio = null
  const play = (src, trigger) => {
    if (audio) { audio.pause(); audio.currentTime = 0 }
    audio = new Audio(src)
    const big = document.querySelector('[data-hello]')
    big?.classList.add('is-playing')
    trigger?.setAttribute('aria-busy', 'true')
    audio.addEventListener('ended', () => {
      big?.classList.remove('is-playing')
      trigger?.removeAttribute('aria-busy')
    })
    audio.play().catch(() => big?.classList.remove('is-playing'))
  }
  document.querySelectorAll('[data-audio]').forEach((btn) => {
    btn.addEventListener('click', () => play(btn.dataset.audio, btn))
  })
  const hello = document.querySelector('[data-hello]')
  const first = document.querySelector('[data-audio]')
  if (hello && first) {
    hello.addEventListener('click', () => {
      // "hello" speaks English; the French version is one link away.
      play(first.dataset.audio, hello)
    })
  }
}

/** Contact form → Pages Function at /api/contact (Resend). */
export function initContact() {
  const form = document.getElementById('contact-form')
  if (!form) return
  const button = form.querySelector('button[type="submit"]')
  const status = form.querySelector('#contact-status')
  const say = (msg, isError) => {
    status.textContent = msg
    status.classList.toggle('text-red', !!isError)
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!form.reportValidity()) return
    say('', false)
    const label = button.textContent
    button.disabled = true
    button.textContent = 'Sending…'
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      })
      const payload = await res.json().catch(() => ({}))
      if (res.ok) {
        say(payload.message || "Sent. I'll get back to you soon.", false)
        form.reset()
        button.textContent = 'Sent'
        setTimeout(() => { button.textContent = label; button.disabled = false }, 2500)
        return
      }
      say(payload.error || "That didn't go through. Try again, or email me directly.", true)
    } catch {
      say("Couldn't reach the server. Email me directly instead.", true)
    }
    button.textContent = label
    button.disabled = false
  })
}
