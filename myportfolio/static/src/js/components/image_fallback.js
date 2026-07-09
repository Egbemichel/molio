/**
 * image_fallback.js
 *
 * App-wide graceful image failure. If ANY <img> fails to load — a deleted
 * Cloudinary asset, a failed upload, a flaky network — we swap in a small
 * on-brand placeholder instead of the browser's broken-image icon. Works for
 * images added later (Alpine/JS) because we listen in the capture phase, which
 * catches resource-load errors from elements that don't bubble.
 */

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
      "<rect width='100' height='100' rx='6' fill='#efe9e9'/>" +
      "<g fill='none' stroke='#8B1E1E' stroke-opacity='0.45' stroke-width='3' " +
      "stroke-linecap='round' stroke-linejoin='round'>" +
      "<rect x='27' y='31' width='46' height='38' rx='4'/>" +
      "<circle cx='40' cy='45' r='4'/>" +
      "<path d='M29 63l13-13 10 8 7-6 12 11'/>" +
      '</g></svg>'
  )

export function initImageFallback() {
  document.addEventListener(
    'error',
    (e) => {
      const el = e.target
      if (!(el instanceof HTMLImageElement)) return
      if (el.dataset.imgFallback) return // already swapped — avoid loops
      const src = el.getAttribute('src') || ''
      // An empty src isn't a real failure (e.g. an optional, unset image that
      // is hidden anyway) — leave it be.
      if (!src || src.startsWith('data:')) return

      el.dataset.imgFallback = '1'
      el.classList.add('img-broken')
      el.removeAttribute('srcset')
      el.src = PLACEHOLDER
    },
    true // capture phase — required to hear <img> load errors globally
  )
}
