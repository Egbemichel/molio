/**
 * dot_journey.js — where the dot goes after the hero.
 *
 * Every [data-dot-stop] on the page is a place the dot can rest: the About
 * paragraph's full stop, each section label, and finally the red dot of the 2·1
 * mark in the footer. As you scroll, the dot hops to the stop for the section
 * you're reading — a quiet "you are here" — and on the footer it settles into
 * the logomark in exactly its original position, where it is swapped for the
 * real artwork.
 */
import { Ball } from './chase/ball.js'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export function initDotJourney({ layer, ball = null, gravity = 2600, dockFirst = false }) {
  const root = document.documentElement
  const home = document.querySelector('[data-dot-home]')
  const stops = [...document.querySelectorAll('[data-dot-stop]')]
    .filter((el) => el.dataset.dotStop !== 'hero')
    .map((el) => ({ el, kind: 'slot' }))
  if (home) stops.push({ el: home.querySelector('[data-logo-dot] use') || home, kind: 'home' })
  if (!stops.length) return null

  if (!ball) {
    const tpl = document.querySelector('.dot-svg')
    if (!tpl) return null
    ball = new Ball(layer, tpl)
  }
  root.classList.add('dot-live')

  let current = null   // stop the dot rests on (or is heading to)
  let hop = null       // active flight
  let settle = null    // little rebounds after landing
  let running = false
  let last = 0

  function geom(stop) {
    const r = stop.el.getBoundingClientRect()
    return { x: r.left + window.scrollX + r.width / 2, y: r.top + window.scrollY + r.height / 2, h: r.height }
  }

  function activeStop() {
    const vh = window.innerHeight
    const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 8
    if (atBottom && stops[stops.length - 1].kind === 'home') return stops[stops.length - 1]
    const line = vh * 0.62
    let pick = stops[0]
    for (const s of stops) {
      const top = s.el.getBoundingClientRect().top
      if (top < line) pick = s
    }
    return pick
  }

  function setHome(on) {
    root.classList.toggle('dot-home', on)
    ball.setHidden(on)
  }

  function flyTo(stop, { fromFall = false } = {}) {
    if (current && current.kind === 'home') setHome(false)
    current = stop
    settle = null
    const t = geom(stop)
    const sy = window.scrollY, vh = window.innerHeight
    let x = ball.x, y = ball.y

    // Coming from far away? Enter from the nearest viewport edge instead.
    if (!fromFall) {
      if (y < sy - vh * 0.3) { x = t.x + (Math.random() - 0.5) * 120; y = sy - 40 }
      else if (y > sy + vh * 1.3) { x = t.x + (Math.random() - 0.5) * 120; y = sy + vh + 40 }
    }

    const g = gravity
    const dx = t.x - x, dy = t.y - y
    let T, vy0
    if (fromFall && dy > 0) {
      // Already falling: keep its momentum, just steer it in.
      const v = ball.vy
      T = (-v + Math.sqrt(v * v + 2 * g * dy)) / g
      vy0 = v
    } else {
      T = clamp(0.38 + Math.hypot(dx, dy) / 2400, 0.38, 0.85)
      vy0 = (dy - 0.5 * g * T * T) / T
    }
    hop = { x0: x, y0: y, h0: ball.h, tx: t.x, ty: t.y, th: t.h, T, vx: dx / T, vy0, g, t: 0 }
    ball.upright = true
    ball.spin = Math.sign(dx || 1) * 6
    start()
  }

  function land() {
    const t = geom(current)
    ball.x = t.x; ball.y = t.y; ball.h = t.h
    ball.impact(0, -1, 4000)
    settle = { y: t.y, v: -Math.sqrt(2 * gravity * t.h * 1.4), n: 2, g: gravity }
    hop = null
  }

  function step(dt) {
    if (hop) {
      hop.t += dt
      const t = Math.min(hop.t, hop.T)
      ball.x = hop.x0 + hop.vx * t
      ball.y = hop.y0 + hop.vy0 * t + 0.5 * hop.g * t * t
      ball.h = hop.h0 + (hop.th - hop.h0) * ease(t / hop.T)
      if (hop.t >= hop.T) land()
    } else if (settle) {
      settle.v += settle.g * dt
      ball.y += settle.v * dt
      if (ball.y >= settle.y) {
        ball.y = settle.y
        settle.n -= 1
        if (settle.n <= 0 || Math.abs(settle.v) < 60) {
          settle = null
          if (current.kind === 'home') setHome(true)
        } else {
          ball.impact(0, -1, settle.v)
          settle.v = -settle.v * 0.38
        }
      }
    }
    ball.step(dt)
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - (last || now)) / 1000)
    last = now
    step(dt)
    ball.render()
    const busy = hop || settle || Math.abs(ball.squash) + Math.abs(ball.squashV) > 0.002
    if (busy) requestAnimationFrame(frame)
    else { running = false; last = 0 }
  }
  function start() {
    if (running) return
    running = true
    requestAnimationFrame(frame)
  }

  /** Keep a resting dot glued to its stop when the layout shifts. */
  function resync() {
    if (!current || hop || settle) return
    const t = geom(current)
    ball.x = t.x; ball.y = t.y; ball.h = t.h
    ball.render()
  }

  let ticking = false
  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      const next = activeStop()
      if (next !== current) flyTo(next)
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', () => requestAnimationFrame(resync))
  new ResizeObserver(() => requestAnimationFrame(resync)).observe(document.body)

  ball.el.addEventListener('pointerdown', () => {
    if (hop || !current) return
    const t = geom(current)
    settle = { y: t.y, v: -Math.sqrt(2 * gravity * t.h * 4), n: 3, g: gravity }
    ball.spin = 0
    start()
  })

  // Begin.
  if (dockFirst) {
    current = activeStop()
    const t = geom(current)
    ball.x = t.x; ball.y = t.y; ball.h = t.h; ball.upright = true
    if (current.kind === 'home') setHome(true)
    ball.render()
  } else {
    flyTo(activeStop(), { fromFall: true })
  }

  return { ball }
}
