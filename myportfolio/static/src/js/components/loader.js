/**
 * Global page loader with SVG stroke animation
 * - Runs once per session (uses sessionStorage)
 * - Animated logo with stroke-dashoffset
 * - Progress line sweep
 * - Clip-path exit animation
 * + Reusable skeleton loader for async content
 */

export function initLoader() {
  // Check if loader already shown this session
  if (sessionStorage.getItem('loaderShown')) {
    return
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Create loader overlay
  const loader = createLoaderOverlay()
  document.body.appendChild(loader)

  // Mark as shown
  sessionStorage.setItem('loaderShown', 'true')

  // Run animation sequence
  if (prefersReducedMotion) {
    // Skip animation on reduced-motion preference
    setTimeout(() => {
      exitLoader(loader)
    }, 300)
  } else {
    runLoaderSequence(loader)
  }
}

function createLoaderOverlay() {
  const overlay = document.createElement('div')
  overlay.className = 'global-loader'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: #E8E8E8;
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    clip-path: inset(0 0 0 0);
    transition: clip-path 500ms cubic-bezier(0.76, 0, 0.24, 1);
  `

  // SVG for initials "EM" (or your logo)
  const svg = createInitialsSVG()
  overlay.appendChild(svg)

  // Progress line
  const progressLine = document.createElement('div')
  progressLine.style.cssText = `
    position: absolute;
    bottom: 40%;
    left: 0;
    width: 0%;
    height: 2px;
    background-color: #8B1E1E;
    animation: loaderProgressSweep 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 900ms forwards;
  `
  overlay.appendChild(progressLine)

  return overlay
}

function createInitialsSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 200 100')
  svg.setAttribute('width', '200')
  svg.setAttribute('height', '100')
  svg.style.cssText = `
    max-width: 300px;
    height: auto;
  `

  // Letter "E"
  const eGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  const ePath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  ePath.setAttribute('d', 'M 20 20 L 20 80 L 60 80 M 20 50 L 55 50 M 20 20 L 55 20')
  ePath.setAttribute('stroke', '#8B1E1E')
  ePath.setAttribute('stroke-width', '3')
  ePath.setAttribute('fill', 'none')
  ePath.setAttribute('stroke-linecap', 'round')
  ePath.setAttribute('stroke-linejoin', 'round')
  ePath.style.cssText = `
    stroke-dasharray: 120;
    stroke-dashoffset: 120;
    animation: loaderStrokeDraw 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  `
  eGroup.appendChild(ePath)
  svg.appendChild(eGroup)

  // Letter "M"
  const mGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  const mPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  mPath.setAttribute('d', 'M 80 80 L 80 20 L 110 50 L 140 20 L 140 80')
  mPath.setAttribute('stroke', '#8B1E1E')
  mPath.setAttribute('stroke-width', '3')
  mPath.setAttribute('fill', 'none')
  mPath.setAttribute('stroke-linecap', 'round')
  mPath.setAttribute('stroke-linejoin', 'round')
  mPath.style.cssText = `
    stroke-dasharray: 150;
    stroke-dashoffset: 150;
    animation: loaderStrokeDraw 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 0ms forwards;
  `
  mGroup.appendChild(mPath)
  svg.appendChild(mGroup)

  // Inject keyframes if not already present
  if (!document.getElementById('loader-keyframes')) {
    const style = document.createElement('style')
    style.id = 'loader-keyframes'
    style.textContent = `
      @keyframes loaderStrokeDraw {
        to {
          stroke-dashoffset: 0;
        }
      }
      @keyframes loaderProgressSweep {
        to {
          width: 100%;
        }
      }
    `
    document.head.appendChild(style)
  }

  return svg
}

function runLoaderSequence(loader) {
  // Timeline:
  // 0-800ms: SVG stroke draws
  // 900-1500ms: progress line sweeps
  // 1500-2000ms: exit with clip-path wipe

  setTimeout(() => {
    exitLoader(loader)
  }, 2000)
}

function exitLoader(loader) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    loader.style.display = 'none'
    return
  }

  // Clip-path wipe upward
  loader.style.clipPath = 'inset(100% 0 0 0)'

  setTimeout(() => {
    loader.remove()
  }, 500)
}

// Skeleton loader for async content
export function initSkeletonLoaders() {
  const style = document.createElement('style')
  style.textContent = `
    [data-skeleton] {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      [data-skeleton] {
        animation: none;
        background: rgba(255, 255, 255, 0.2);
      }
    }
  `
  document.head.appendChild(style)
}

// Helper to create skeleton bars
export function createSkeletonBar(width = '100%', height = '16px', className = '') {
  const bar = document.createElement('div')
  bar.setAttribute('data-skeleton', 'true')
  bar.className = `rounded ${className}`
  bar.style.cssText = `
    width: ${width};
    height: ${height};
    margin-bottom: 12px;
  `
  return bar
}
