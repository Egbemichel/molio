/**
 * main.js — site initialisation.
 *
 * The red dot is the thread through the site: on the home page it starts in the
 * hero chase, then hands itself to the journey; elsewhere the journey starts it
 * at the first stop. With reduced motion, the static dots stay in place.
 */
import { initImageFallback } from './components/image_fallback.js'
import { initHeroChase } from './components/hero_chase.js'
import { initDotJourney } from './components/dot_journey.js'
import { initReveals, initSticker, initHello, initContact } from './components/details.js'

function safeInit(fn) {
  try {
    return fn()
  } catch (err) {
    console.error(err)
  }
}

// Before any <img> has a chance to fail.
safeInit(initImageFallback)

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const layer = document.getElementById('dot-layer')

safeInit(() => initReveals(reducedMotion))
safeInit(initSticker)
safeInit(initHello)
safeInit(initContact)

safeInit(() => {
  if (document.querySelector('[data-hero]')) {
    initHeroChase({
      reducedMotion,
      onHandoff: (ball, { gravity }) => safeInit(() => initDotJourney({ layer, ball, gravity })),
    })
  } else if (!reducedMotion) {
    initDotJourney({ layer, dockFirst: true })
  }
})
