/**
 * main.js — Portfolio feature initialization
 */

import { initNavbar }             from './components/navbar.js'
import { initFilter }             from './components/filter.js'
import { initContact }            from './components/contact.js'
import { initCustomCursor }       from './components/cursor_improved.js'
import { initPageLoader }         from './components/page_loader.js'
import { initKeyboardShortcuts }  from './components/keyboard_shortcuts.js'
import { initAudioPlayers }       from './components/audio_howler.js'
import { initFeedbackForm }       from './components/feedback_form.js'
import { initFeedbackCarousel }   from './components/feedback_carousel.js'
import { initEduGallery }         from './components/edu_gallery.js'
import { initImageFallback }      from './components/image_fallback.js'
import { toast }                  from './components/toast.js'

// Make toast globally available
window.toast = toast

// Micro loaders — import wherever you have async work
// Example usage shown in feedback_form.js
export {
  showButtonLoader,
  showButtonSuccess,
  showButtonError,
  showSectionSkeleton,
  hideSkeleton,
  showInlineSpinner,
  hideInlineSpinner,
  resetButton,
} from './components/page_loader.js'

function safeInit(name, fn) {
  try {
    fn()
  } catch (err) {
  }
}

// These run immediately (not on DOMContentLoaded) so they're active from the
// very first paint: the loader must show at once, and the image-fallback
// listener must be attached before any <img> has a chance to fail.
safeInit('PageLoader', initPageLoader)
safeInit('ImageFallback', initImageFallback)

document.addEventListener('DOMContentLoaded', () => {

  safeInit('Navbar',             initNavbar)
  safeInit('Filter',             initFilter)
  safeInit('Contact',            initContact)
  safeInit('CustomCursor',       initCustomCursor)
  safeInit('KeyboardShortcuts',  initKeyboardShortcuts)
  safeInit('AudioPlayers',       initAudioPlayers)
  safeInit('FeedbackCarousel',   initFeedbackCarousel)
  safeInit('FeedbackForm',       initFeedbackForm)
  safeInit('EduGallery',         initEduGallery)

})