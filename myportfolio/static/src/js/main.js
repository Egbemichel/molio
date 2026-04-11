import { initNavbar } from './components/navbar.js'
import { initFilter } from './components/filter.js'
import { initContact } from './components/contact.js'
import { initCursor } from './components/cursor.js'
import { initLoader, initSkeletonLoaders } from './components/loader.js'
import { initEasterEgg } from './components/easter_egg.js'
import { initEduGallery } from './components/edu_gallery.js'
import { initAudioPlayer } from './components/audio_player.js'
import { initFeedbackForm } from './components/feedback_form.js'

document.addEventListener('DOMContentLoaded', () => {
  // Initialize features
  initNavbar()
  initFilter()
  initContact()
  initCursor()
  initLoader()
  initSkeletonLoaders()
  initEasterEgg()
  initEduGallery()
  initAudioPlayer()
  initFeedbackForm()
})
