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
    console.error(`❌ [${name}] init failed:`, err)
  }
}

// Loader runs immediately — before DOMContentLoaded
// so it's visible from the very first paint
safeInit('PageLoader', initPageLoader)

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Portfolio initializing...')

  safeInit('Navbar',             initNavbar)
  safeInit('Filter',             initFilter)
  safeInit('Contact',            initContact)
  safeInit('CustomCursor',       initCustomCursor)
  safeInit('KeyboardShortcuts',  initKeyboardShortcuts)
  safeInit('AudioPlayers',       initAudioPlayers)
  safeInit('FeedbackCarousel',   initFeedbackCarousel)
  safeInit('FeedbackForm',       initFeedbackForm)
  safeInit('EduGallery',         initEduGallery)

  console.log('✅ All features initialized')
})