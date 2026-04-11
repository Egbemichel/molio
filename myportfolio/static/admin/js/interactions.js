/**
 * Django Admin - Micro Interactions & Animations
 * Enhances UX with smooth transitions and interactive feedback
 */

(function () {
  'use strict';

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    initializeInteractions();
    initializeFormFeedback();
    initializeTableRowHover();
    initializeButtonEffects();
    initializeSidebarNav();
    initializeSearch();
  });

  /**
   * Initialize form interactions
   */
  function initializeInteractions() {
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach((input) => {
      // Add focus animator
      input.addEventListener('focus', function () {
        this.parentElement.classList.add('focused');
      });

      input.addEventListener('blur', function () {
        if (!this.value) {
          this.parentElement.classList.remove('focused');
        }
      });

      // Add filled state
      if (input.value) {
        input.parentElement.classList.add('focused');
      }
    });

    // Character counter for textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach((textarea) => {
      const maxLength = textarea.getAttribute('maxlength');
      if (maxLength) {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.textContent = `${textarea.value.length}/${maxLength}`;
        textarea.parentElement.appendChild(counter);

        textarea.addEventListener('input', function () {
          counter.textContent = `${this.value.length}/${maxLength}`;
          const percent = (this.value.length / maxLength) * 100;
          
          if (percent > 80) {
            counter.style.color = 'rgba(220, 53, 69, 0.8)';
          } else if (percent > 60) {
            counter.style.color = 'rgba(247, 127, 0, 0.8)';
          } else {
            counter.style.color = 'rgba(232, 232, 232, 0.5)';
          }
        });
      }
    });
  }

  /**
   * Form feedback animations
   */
  function initializeFormFeedback() {
    const forms = document.querySelectorAll('form');

    forms.forEach((form) => {
      form.addEventListener('submit', function (e) {
        const submitBtn = this.querySelector('input[type="submit"]');
        if (submitBtn) {
          submitBtn.classList.add('submitting');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Processing...';
        }
      });
    });

    // Animate error messages
    const errorMessages = document.querySelectorAll('.errorlist, .errornote');
    errorMessages.forEach((msg, index) => {
      msg.style.animation = `slideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.1}s forwards`;
      msg.style.opacity = '0';
    });

    // Animate success/info messages
    const messages = document.querySelectorAll('.messagelist li');
    messages.forEach((msg, index) => {
      msg.style.animation = `slideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.05}s forwards`;
      msg.style.opacity = '0';
    });
  }

  /**
   * Table row hover effects
   */
  function initializeTableRowHover() {
    const tableRows = document.querySelectorAll('tbody tr');

    tableRows.forEach((row) => {
      row.addEventListener('mouseenter', function () {
        this.style.transform = 'scale(1.01)';
        this.style.boxShadow = '0 0 0 1px rgba(139, 30, 30, 0.2)';
      });

      row.addEventListener('mouseleave', function () {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = 'none';
      });
    });

    // Add alt colors for better readability
    const oddRows = document.querySelectorAll('tbody tr:nth-child(odd)');
    oddRows.forEach((row) => {
      row.style.backgroundColor = 'rgba(63, 63, 63, 0.05)';
    });
  }

  /**
   * Button click effects
   */
  function initializeButtonEffects() {
    const buttons = document.querySelectorAll('input[type="submit"], input[type="button"], .button, a.button');

    buttons.forEach((btn) => {
      btn.addEventListener('mousedown', function (e) {
        if (!this.classList.contains('submitting')) {
          const ripple = document.createElement('span');
          const rect = this.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;

          ripple.style.width = ripple.style.height = size + 'px';
          ripple.style.left = x + 'px';
          ripple.style.top = y + 'px';
          ripple.className = 'ripple';

          this.appendChild(ripple);

          setTimeout(() => ripple.remove(), 600);
        }
      });
    });

    // Add ripple styles
    const style = document.createElement('style');
    style.textContent = `
      button, input[type="submit"], input[type="button"], .button, a.button {
        position: relative;
        overflow: hidden;
      }

      .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(232, 232, 232, 0.3);
        transform: scale(0);
        animation: rippleAnimation 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        pointer-events: none;
      }

      @keyframes rippleAnimation {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      input[type="submit"].submitting,
      input[type="submit"].submitting:hover {
        opacity: 0.8;
        cursor: not-allowed;
        transform: none;
      }

      .char-counter {
        font-size: 11px;
        color: rgba(232, 232, 232, 0.5);
        margin-top: 4px;
        text-align: right;
        transition: color 0.3s ease;
      }

      .form-row.focused {
        background: rgba(139, 30, 30, 0.02);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Sidebar navigation effects
   */
  function initializeSidebarNav() {
    const navLinks = document.querySelectorAll('#sidebar .module a');
    const currentPath = window.location.pathname;

    navLinks.forEach((link) => {
      link.addEventListener('mouseenter', function () {
        this.style.transform = 'translateX(4px)';
      });

      link.addEventListener('mouseleave', function () {
        this.style.transform = 'translateX(0)';
      });

      // Highlight current page
      if (link.href === window.location.href || currentPath.includes(link.href)) {
        link.classList.add('active');
      }
    });

    // Add smooth transitions
    const style = document.createElement('style');
    style.textContent = `
      #sidebar .module a {
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Search box interactions
   */
  function initializeSearch() {
    const searchInput = document.querySelector('#toolbar input[type="text"]');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        if (this.value.length > 0) {
          this.style.borderColor = 'rgba(139, 30, 30, 0.4)';
          this.style.background = 'rgba(63, 63, 63, 0.5)';
        } else {
          this.style.borderColor = 'rgba(139, 30, 30, 0.2)';
          this.style.background = 'rgba(63, 63, 63, 0.3)';
        }
      });

      // Clear button on ESC
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && this.value) {
          this.value = '';
          this.style.borderColor = 'rgba(139, 30, 30, 0.2)';
          this.style.background = 'rgba(63, 63, 63, 0.3)';
          this.focus();
        }
      });
    }
  }

  /**
   * Utility: Page load animation
   */
  window.addEventListener('load', function () {
    const body = document.body;
    body.classList.add('admin-transition');

    // Add loading indicator for inline frames/popups
    const popupHandler = document.querySelector('iframe');
    if (popupHandler) {
      popupHandler.style.opacity = '0';
      popupHandler.addEventListener('load', function () {
        this.style.opacity = '1';
        this.style.transition = 'opacity 0.3s ease';
      });
    }
  });

  /**
   * Handle keyboard shortcuts
   */
  document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + S to save form (if modifying form behavior)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      // Prevent default browser save
      // You can add custom save logic here
    }

    // Alt + N to focus add button (if present)
    if (e.altKey && e.key === 'n') {
      const addBtn = document.querySelector('a.addlink');
      if (addBtn) {
        addBtn.focus();
        addBtn.click();
      }
    }
  });

  /**
   * Accessibility: Improve focus states
   */
  const style = document.createElement('style');
  style.textContent = `
    button:focus,
    input:focus,
    select:focus,
    textarea:focus,
    a:focus,
    [tabindex]:focus {
      outline: 2px solid rgba(139, 30, 30, 0.4);
      outline-offset: 2px;
    }

    /* Smooth page transitions */
    html {
      scroll-behavior: smooth;
    }

    /* Improve readability with better line height */
    body {
      line-height: 1.6;
    }
  `;
  document.head.appendChild(style);
})();
