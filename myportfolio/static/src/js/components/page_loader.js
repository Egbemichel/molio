/**
 * page_loader.js
 *
 * 1. FULL PAGE LOADER — runs on every page load (no sessionStorage gate)
 *    - Dark overlay, "EGBE" in font-geisha written letter by letter with GSAP
 *    - Accent color #8B1E1E, subtle grain texture, clean wipe-out exit
 *
 * 2. MICRO LOADERS — utility helpers exported for use in fetch/submit flows
 *    - showButtonLoader(btn)   / resetButton(btn)
 *    - showButtonSuccess(btn)
 *    - showButtonError(btn)
 *    - showSectionSkeleton(el) / hideSkeleton(el)
 *    - showInlineSpinner(el)   / hideInlineSpinner(el)
 */

export function initPageLoader() {
  console.log('⏳ Initializing page loader...')

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('⚠️ Reduced motion: loader skipped')
    return
  }

  if (!window.gsap) {
    console.error('❌ GSAP not loaded — add it to base.html before main.js')
    return
  }

  injectLoaderStyles()

  const loader = buildLoader()
  document.body.appendChild(loader)
  document.body.style.overflow = 'hidden'

  const letters   = loader.querySelectorAll('.loader-letter')
  const underline = loader.querySelector('.loader-underline')

  const tl = gsap.timeline({ onComplete: () => exitLoader(loader) })

  // 1. Bg fades in
  tl.fromTo(loader,
    { opacity: 0 },
    { opacity: 1, duration: 0.2, ease: 'none' }
  )

  // 2. Letters write in left to right — each drops in with a 3D flip
  tl.fromTo(letters,
    {
      opacity: 0,
      y: 48,
      rotationX: -70,
      transformOrigin: '50% 100%',
    },
    {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 0.6,
      ease: 'back.out(1.6)',
      stagger: 0.13,
    },
    '-=0.05'
  )

  // 3. Underline sweeps left → right after last letter settles
  tl.fromTo(underline,
    { scaleX: 0, transformOrigin: 'left center' },
    { scaleX: 1, duration: 0.5, ease: 'power3.out' },
    '-=0.15'
  )

  // 4. Hold so the name is readable
  tl.to({}, { duration: 0.5 })

  // 5. Letters exit upward with stagger
  tl.to(letters, {
    opacity: 0,
    y: -36,
    duration: 0.3,
    ease: 'power2.in',
    stagger: 0.055,
  })

  tl.to(underline, {
    scaleX: 0,
    transformOrigin: 'right center',
    duration: 0.28,
    ease: 'power2.in',
  }, '<')
}

function exitLoader(loader) {
  gsap.to(loader, {
    clipPath: 'inset(0 0 100% 0)',
    duration: 0.7,
    ease: 'power4.inOut',
    onComplete: () => {
      document.body.style.overflow = ''
      if (loader.parentNode) loader.parentNode.removeChild(loader)
      console.log('✅ Loader done')
    },
  })
}

function buildLoader() {
  const el = document.createElement('div')
  el.id = 'page-loader'

  const letterSpans = 'EGBE'
    .split('')
    .map(ch => `<span class="loader-letter font-geisha">${ch}</span>`)
    .join('')

  el.innerHTML = `
    <div class="loader-grain"></div>
    <div class="loader-inner">
      <div class="loader-name" aria-label="EGBE">${letterSpans}</div>
      <div class="loader-underline"></div>
    </div>
  `

  return el
}

function injectLoaderStyles() {
  if (document.getElementById('page-loader-styles')) return

  const style = document.createElement('style')
  style.id = 'page-loader-styles'
  style.textContent = `
    #page-loader {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: #0c0c0c;
      display: flex;
      align-items: center;
      justify-content: center;
      clip-path: inset(0 0 0 0);
      perspective: 900px;
    }

    .loader-grain {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E");
      background-size: 200px 200px;
      pointer-events: none;
      opacity: 0.55;
    }

    .loader-inner {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loader-name {
      display: flex;
      align-items: baseline;
      font-family: font-geisha;
      font-size: clamp(80px, 14vw, 148px);
      font-weight: 400;
      color: #8B1E1E;
      letter-spacing: 0.06em;
      line-height: 1;
      transform-style: preserve-3d;
    }

    .loader-letter {
      display: inline-block;
      will-change: transform, opacity;
    }

    .loader-underline {
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, transparent, #8B1E1E 30%, #8B1E1E 70%, transparent);
      will-change: transform;
    }
  `
  document.head.appendChild(style)
}


/* ─────────────────────────────────────────────────────────────
   MICRO LOADERS — import and use anywhere async work happens
   ───────────────────────────────────────────────────────────── */

/**
 * showButtonLoader(btn) → returns a reset function
 *
 * const reset = showButtonLoader(myBtn)
 * await doWork()
 * reset()
 */
export function showButtonLoader(btn) {
  if (!btn) return () => {}
  injectMicroStyles()

  const original = btn.innerHTML
  const w = btn.offsetWidth

  btn.style.width    = w + 'px'
  btn.style.minWidth = w + 'px'
  btn.disabled = true
  btn.classList.add('btn-loading')
  btn.innerHTML = `<span class="micro-spinner"></span>`

  return () => resetButton(btn, original)
}

export function resetButton(btn, originalHTML) {
  if (!btn) return
  btn.disabled = false
  btn.classList.remove('btn-loading', 'btn-success', 'btn-error')
  if (originalHTML !== undefined) btn.innerHTML = originalHTML
  btn.style.width    = ''
  btn.style.minWidth = ''
}

export function showButtonSuccess(btn, delay = 2000) {
  if (!btn) return
  injectMicroStyles()

  btn.innerHTML = `
    <svg class="micro-check" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `
  btn.classList.add('btn-success')
  btn.disabled = true

  if (window.gsap) {
    gsap.fromTo(
      btn.querySelector('.micro-check'),
      { scale: 0, rotation: -20 },
      { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(1.8)' }
    )
  }

  setTimeout(() => {
    btn.classList.remove('btn-success')
    btn.disabled = false
  }, delay)
}

export function showButtonError(btn, message = 'Try again', delay = 2500) {
  if (!btn) return
  injectMicroStyles()
  btn.innerHTML = message
  btn.classList.add('btn-error')
  btn.disabled = false
  setTimeout(() => btn.classList.remove('btn-error'), delay)
}

/**
 * showSectionSkeleton(container, lines?)
 * hideSkeleton(container)
 */
export function showSectionSkeleton(container, lines = 3) {
  if (!container) return
  injectMicroStyles()

  const wrap = document.createElement('div')
  wrap.className = 'skeleton-wrap'
  wrap.dataset.skeleton = 'true'

  const widths = ['100%', '85%', '70%', '90%', '60%']
  for (let i = 0; i < lines; i++) {
    const line = document.createElement('div')
    line.className = 'skeleton-line'
    line.style.width = widths[i % widths.length]
    wrap.appendChild(line)
  }

  container.appendChild(wrap)
}

export function hideSkeleton(container) {
  if (!container) return
  const sk = container.querySelector('[data-skeleton]')
  if (!sk) return

  if (window.gsap) {
    gsap.to(sk, {
      opacity: 0,
      y: -6,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => sk.remove(),
    })
  } else {
    sk.remove()
  }
}

/**
 * showInlineSpinner(el) — appends a tiny spinner after el's content
 * hideInlineSpinner(el)
 */
export function showInlineSpinner(el) {
  if (!el) return
  injectMicroStyles()
  const s = document.createElement('span')
  s.className = 'micro-spinner micro-spinner--inline'
  s.dataset.inlineSpinner = 'true'
  el.appendChild(s)
}

export function hideInlineSpinner(el) {
  if (!el) return
  const s = el.querySelector('[data-inline-spinner]')
  if (s) s.remove()
}


function injectMicroStyles() {
  if (document.getElementById('micro-loader-styles')) return

  const style = document.createElement('style')
  style.id = 'micro-loader-styles'
  style.textContent = `
    /* ── Spinner ── */
    .micro-spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(139, 30, 30, 0.2);
      border-top-color: #8B1E1E;
      border-radius: 50%;
      animation: microSpin 0.65s linear infinite;
      flex-shrink: 0;
    }

    .micro-spinner--inline {
      width: 13px;
      height: 13px;
      border-width: 1.5px;
      margin-left: 8px;
      vertical-align: middle;
    }

    @keyframes microSpin {
      to { transform: rotate(360deg); }
    }

    /* ── Button states ── */
    .btn-loading {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      opacity: 0.8;
    }

    .btn-success {
      border-color: #52b788 !important;
      color: #52b788 !important;
      pointer-events: none;
    }

    .btn-error {
      border-color: #8B1E1E !important;
      color: #8B1E1E !important;
    }

    .micro-check {
      width: 18px;
      height: 18px;
      display: block;
    }

    /* ── Skeleton shimmer ── */
    .skeleton-wrap {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 8px 0;
    }

    .skeleton-line {
      height: 13px;
      border-radius: 6px;
      background: linear-gradient(
        90deg,
        rgba(200,200,200,0.08) 25%,
        rgba(200,200,200,0.18) 50%,
        rgba(200,200,200,0.08) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      from { background-position:  200% center; }
      to   { background-position: -200% center; }
    }

    @media (prefers-reduced-motion: reduce) {
      .micro-spinner { animation: none; }
      .skeleton-line { animation: none; background: rgba(200,200,200,0.12); }
    }
  `
  document.head.appendChild(style)
}