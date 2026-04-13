/**
 * Premium Toast Notification System
 * Replaces alert() and provides elegant, non-intrusive notifications
 * 
 * Usage:
 *   toast.success('Action completed')
 *   toast.error('Something went wrong')
 *   toast.info('Information message')
 *   toast.warning('Warning message')
 */

export const toast = {
  success: (message, duration = 4000) => showToast(message, 'success', duration),
  error: (message, duration = 5000) => showToast(message, 'error', duration),
  info: (message, duration = 3500) => showToast(message, 'info', duration),
  warning: (message, duration = 4500) => showToast(message, 'warning', duration),
}

let toastContainer = null
let activeToasts = new Map()

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.className = 'toast-container'
    document.body.appendChild(toastContainer)
    injectToastStyles()
  }
  return toastContainer
}

function showToast(message, type = 'info', duration = 4000) {
  const container = ensureContainer()

  // Create toast element
  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const toastEl = document.createElement('div')
  toastEl.className = `toast toast-${type}`
  toastEl.id = toastId

  // Create toast content
  const icon = getIcon(type)
  toastEl.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Close notification">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `

  // Add to container
  container.appendChild(toastEl)

  // Trigger animation
  setTimeout(() => {
    toastEl.classList.add('visible')
  }, 10)

  // Close button handler
  const closeBtn = toastEl.querySelector('.toast-close')
  closeBtn.addEventListener('click', () => {
    removeToast(toastId)
  })

  // Auto-remove after duration
  const timeoutId = setTimeout(() => {
    removeToast(toastId)
  }, duration)

  activeToasts.set(toastId, timeoutId)
}

function removeToast(toastId) {
  const toastEl = document.getElementById(toastId)
  if (!toastEl) return

  // Clear any pending timeouts
  if (activeToasts.has(toastId)) {
    clearTimeout(activeToasts.get(toastId))
    activeToasts.delete(toastId)
  }

  // Animate out
  toastEl.classList.remove('visible')

  setTimeout(() => {
    if (toastEl.parentElement) {
      toastEl.remove()
    }
  }, 350)
}

function getIcon(type) {
  const icons = {
    success: `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M17.5 5L7.5 15L2.5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    error: `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z" stroke="currentColor" stroke-width="1.5"/>
        <path d="M6 10H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `,
    warning: `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L2 17H18L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M10 8V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="10" cy="14.5" r="0.5" fill="currentColor"/>
      </svg>
    `,
    info: `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 6V10M10 14H10.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `,
  }
  return icons[type] || icons.info
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function injectToastStyles() {
  if (document.getElementById('toast-styles')) return

  const style = document.createElement('style')
  style.id = 'toast-styles'
  style.textContent = `
    /* Toast Container */
    .toast-container {
      position: fixed;
      top: 32px;
      right: 32px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }

    /* Toast Base */
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      background: rgba(10, 10, 10, 0.94);
      border: 0.5px solid rgba(139, 30, 30, 0.25);
      border-radius: 12px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      opacity: 0;
      transform: translateX(400px) translateY(-20px);
      transition: all 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: all;
      max-width: 360px;
      min-width: 280px;
    }

    .toast.visible {
      opacity: 1;
      transform: translateX(0) translateY(0);
    }

    /* Toast Icon */
    .toast-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .toast-icon svg {
      width: 100%;
      height: 100%;
    }

    /* Success Toast */
    .toast-success {
      border-color: rgba(76, 175, 80, 0.3);
      background: linear-gradient(135deg, rgba(10, 10, 10, 0.94) 0%, rgba(30, 50, 30, 0.6) 100%);
    }

    .toast-success .toast-icon {
      color: #4CAF50;
    }

    .toast-success .toast-icon::after {
      content: '';
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(76, 175, 80, 0.1);
      animation: toastPulse 2s ease-in-out infinite;
    }

    /* Error Toast */
    .toast-error {
      border-color: rgba(244, 67, 54, 0.3);
      background: linear-gradient(135deg, rgba(10, 10, 10, 0.94) 0%, rgba(50, 20, 20, 0.6) 100%);
    }

    .toast-error .toast-icon {
      color: #F44336;
    }

    /* Warning Toast */
    .toast-warning {
      border-color: rgba(255, 193, 7, 0.3);
      background: linear-gradient(135deg, rgba(10, 10, 10, 0.94) 0%, rgba(50, 40, 20, 0.6) 100%);
    }

    .toast-warning .toast-icon {
      color: #FFC107;
    }

    /* Info Toast */
    .toast-info {
      border-color: rgba(139, 30, 30, 0.3);
      background: linear-gradient(135deg, rgba(10, 10, 10, 0.94) 0%, rgba(30, 40, 50, 0.6) 100%);
    }

    .toast-info .toast-icon {
      color: #8B1E1E;
    }

    /* Toast Content */
    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-message {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.8);
      letter-spacing: 0.3px;
      word-break: break-word;
    }

    /* Toast Close Button */
    .toast-close {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      padding: 0;
      margin-top: -2px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 200ms ease;
    }

    .toast-close:hover {
      color: rgba(255, 255, 255, 0.7);
    }

    .toast-close:active {
      transform: scale(0.95);
    }

    /* Animations */
    @keyframes toastPulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0;
      }
      50% {
        opacity: 0.2;
      }
    }

    /* Mobile Responsiveness */
    @media (max-width: 600px) {
      .toast-container {
        top: auto;
        bottom: 20px;
        right: 16px;
        left: 16px;
        max-width: none;
      }

      .toast {
        min-width: auto;
        max-width: none;
      }

      .toast-message {
        font-size: 13px;
      }
    }

    /* Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .toast {
        transition: opacity 200ms ease;
        transform: none !important;
      }

      .toast-icon::after {
        animation: none;
      }
    }

    /* Dark Mode (already dark, but ensure consistency) */
    @media (prefers-color-scheme: dark) {
      .toast-message {
        color: rgba(255, 255, 255, 0.85);
      }
    }
  `
  document.head.appendChild(style)
}

// Optional: Initialize on module load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureContainer)
} else {
  ensureContainer()
}
