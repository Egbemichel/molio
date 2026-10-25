/**
 * hero_chase.js — "always chasing the next idea".
 *
 * The full stop of the hero slogan is the red dot from the logomarks. It wakes,
 * pops out of the sentence and bounces around (off the actual letters) while an
 * illustrated Mich chases it, climbing the headline when he has to. They run off
 * screen, come back with the roles swapped for a moment, and finally the dot
 * rolls off the end of the ledge and drops into the page — where dot_journey.js
 * takes over. Mich is left at the edge, looking down.
 *
 * Choreography is a handful of phases; inside each, it's real physics, so no two
 * visits play exactly the same. Everything is scaled from the headline's font
 * size, so it behaves the same on a phone and a wide screen.
 */
import { measureHeadline, circleBox, WordSprings } from './chase/world.js'
import { Runner } from './chase/runner.js'
import { Ball } from './chase/ball.js'

const STEP = 1 / 240
const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0)

export function initHeroChase({ onHandoff, reducedMotion }) {
  const hero = document.querySelector('[data-hero]')
  const layer = document.getElementById('dot-layer')
  if (!hero || !layer) return null

  const headline = hero.querySelector('[data-headline]')
  const stage = hero.querySelector('[data-stage]')
  const groundNear = hero.querySelector('[data-ground]')
  const groundFar = hero.querySelector('[data-ground-far]')
  const slot = hero.querySelector('[data-dot-stop="hero"]')
  const words = [...headline.querySelectorAll('[data-word]')]
  words.forEach((w, i) => w.style.setProperty('--i', i))

  const runner = new Runner(layer)
  runner.svg.classList.add('runner--hero')

  // ── geometry ──────────────────────────────────────────────────────────
  let F, H, W, groundY, gapL, gapR, world, springs, platforms, slotRect, chaseH

  function layout() {
    F = parseFloat(getComputedStyle(headline).fontSize)
    H = clamp(F * 0.9, 54, 150)
    runner.height = H
    stage.style.height = `${Math.round(H + 78)}px`
    hero.style.setProperty('--gap', `${Math.round(clamp(F * 0.62, 46, 96))}px`)
  }

  function measure() {
    const sx = window.scrollX, sy = window.scrollY
    W = document.documentElement.clientWidth
    const g = groundNear.getBoundingClientRect()
    const gf = groundFar.getBoundingClientRect()
    groundY = g.top + sy
    gapL = g.right + sx
    gapR = gf.left + sx
    world = measureHeadline(headline)
    springs = springs || new WordSprings(world.words)
    platforms = world.words.map((w) => ({ l: w.left - H * 0.06, r: w.right + H * 0.06, y: w.top, el: w.el }))
    const s = slot.getBoundingClientRect()
    slotRect = { x: s.left + sx + s.width / 2, y: s.top + sy + s.height / 2, h: s.height }
    chaseH = clamp(slotRect.h * 1.45, 18, 46)
  }

  if (reducedMotion) {
    // A still, composed scene: Mich standing on the ledge, the dot in its place.
    hero.classList.add('is-ready')
    const place = () => {
      layout(); measure()
      runner.state = 'idle'
      runner.grounded = true
      runner.x = Math.min(gapL - H * 1.2, W * 0.72)
      runner.y = groundY
      for (let i = 0; i < 60; i++) runner.update(1 / 60)
      runner.render()
    }
    document.fonts.ready.then(place)
    window.addEventListener('resize', debounce(place, 150))
    return null
  }

  document.documentElement.classList.add('dot-live')
  const ball = new Ball(layer, slot.querySelector('.dot-svg'))

  // ── state ────────────────────────────────────────────────────────────
  let phase = 'intro'
  let phaseT = 0
  let clock = 0
  let running = true
  let handedOff = false
  let gapOpen = false
  let ballWalls = { l: true, r: true }
  let runnerWalls = { l: false, r: true }
  let swatCooldown = 0
  let jumpCooldown = 0
  let reachT = 0
  let lastSwat = 0
  let exitArmed = false
  let finaleArmed = false
  let edgeX = 0
  let runnerMode = 'off' // off | chase | exit | flee | doubletake | brake | edge
  let modeT = 0
  let bubble = null
  let heroVisible = true
  let awayFor = 0
  let standingOn = null
  let stuckFor = 0 // platform the runner stands on (null = ground)

  const setPhase = (p) => { phase = p; phaseT = 0 }
  const setMode = (m) => { runnerMode = m; modeT = 0 }

  // ── helpers ──────────────────────────────────────────────────────────
  const floorAt = (x) => !(gapOpen && x > gapL && x < gapR)

  function popBubble(text) {
    if (!bubble) {
      bubble = document.createElement('span')
      bubble.className = 'runner-bubble'
      layer.appendChild(bubble)
    }
    bubble.textContent = text
    bubble.classList.remove('is-on')
    void bubble.offsetWidth
    bubble.classList.add('is-on')
  }

  function placeBubble() {
    if (!bubble) return
    const hp = runner.headPage()
    bubble.style.transform = `translate3d(${(hp.x - 8).toFixed(1)}px, ${(hp.y - H * 0.55).toFixed(1)}px, 0)`
  }

  function swat(dir, strength = 1) {
    ball.vx = dir * rand(3.6, 6.4) * H * strength
    ball.vy = -rand(7.2, 10.4) * H * Math.min(1, 0.6 + 0.4 * strength)
    ball.spin = dir * rand(8, 16)
    ball.impact(-dir, 0, H * 6)
    swatCooldown = 0.55
    lastSwat = clock
    reachT = 0.28
    runner.setMouth('o')
    setTimeout(() => runner.setMouth('smile'), 420)
  }

  function exitSwat() {
    ballWalls.r = false
    runnerWalls.r = false
    const air = 2 * 9.5 * H / (21 * H)
    ball.vy = -9.5 * H
    ball.vx = clamp((W - ball.x + ball.r * 3) / (air * 0.85), 6 * H, 18 * H)
    ball.spin = 18
    swatCooldown = 99
    reachT = 0.28
    setPhase('exit')
    setMode('exit')
  }

  function finaleSwat() {
    gapOpen = true
    const gapC = (gapL + gapR) / 2
    const d = gapC - ball.x
    ball.vx = sign(d) * clamp(Math.abs(d) / 1.2, 2.5 * H, 8 * H)
    ball.vy = -5.5 * H
    ball.spin = sign(d) * 10
    swatCooldown = 99
    reachT = 0.28
    setPhase('finale')
  }

  // ── ball physics ─────────────────────────────────────────────────────
  function stepBall(dt) {
    const gB = 21 * H
    ball.vy += gB * dt
    const drag = Math.exp(-0.12 * dt)
    ball.vx *= drag
    ball.vy *= drag
    // In the finale the dot "means it": it rolls toward the gap.
    if (phase === 'finale' && ball.y + ball.r >= groundY - 1 && floorAt(ball.x)) {
      const gapC = (gapL + gapR) / 2
      ball.vx += sign(gapC - ball.x) * 7 * H * dt
    }
    ball.x += ball.vx * dt
    ball.y += ball.vy * dt
    const r = ball.r

    // ground
    if (floorAt(ball.x) && ball.y + r > groundY && ball.y - r < groundY + H * 0.2) {
      ball.y = groundY - r
      if (ball.vy > 0) {
        const e = phase === 'finale' ? 0.45 : phase === 'return' ? 0.9 : 0.72
        if (ball.vy > H * 1.2) ball.impact(0, -1, ball.vy)
        ball.vy = ball.vy < H * 0.9 ? 0 : -ball.vy * e
        ball.vx *= 0.97
      }
      ball.spin += (ball.vx / r - ball.spin) * Math.min(1, dt * 20)
    }

    // letters
    const b = world.bounds
    if (ball.x + r > b.l && ball.x - r < b.r && ball.y + r > b.t && ball.y - r < b.b) {
      for (const g of world.glyphs) {
        const c = circleBox(ball.x, ball.y, r, g)
        if (!c) continue
        ball.x += c.nx * c.depth
        ball.y += c.ny * c.depth
        const vn = ball.vx * c.nx + ball.vy * c.ny
        if (vn < 0) {
          const e = Math.abs(vn) < H * 0.9 ? 0 : 0.78
          ball.vx -= (1 + e) * vn * c.nx
          ball.vy -= (1 + e) * vn * c.ny
          // a little grip so it picks up spin off the letter
          const tx = -c.ny, ty = c.nx
          const vt = ball.vx * tx + ball.vy * ty
          ball.spin += (vt / r - ball.spin) * 0.3
          if (-vn > H * 1.2) {
            ball.impact(c.nx, c.ny, -vn)
            const k = clamp(-vn / H, 0, 14) * 0.9
            springs.hit(g.word.el, -c.nx * k, -c.ny * k, -c.nx * k * 0.25)
          }
        }
      }
    }

    // walls + ceiling
    if (ballWalls.l && ball.x - r < 0) { ball.x = r; if (ball.vx < 0) { ball.impact(1, 0, -ball.vx); ball.vx *= -0.8 } }
    if (ballWalls.r && ball.x + r > W) { ball.x = W - r; if (ball.vx > 0) { ball.impact(-1, 0, ball.vx); ball.vx *= -0.8 } }
    const ceil = window.scrollY > 0 ? -1e9 : r + 6
    if (ball.y - r < ceil - r) { ball.y = ceil; if (ball.vy < 0) ball.vy *= -0.6 }

    // bonk: the dot drops on Mich's head
    if (runnerMode !== 'off' && runnerMode !== 'exit') {
      const hp = runner.headPage()
      const dx = ball.x - hp.x, dy = ball.y - hp.y
      const d = Math.hypot(dx, dy)
      if (d < r + hp.r && d > 0) {
        const nx = dx / d, ny = dy / d
        const vn = (ball.vx - runner.vx) * nx + (ball.vy - runner.vy) * ny
        ball.x = hp.x + nx * (r + hp.r)
        ball.y = hp.y + ny * (r + hp.r)
        if (vn < 0) {
          ball.vx -= 1.65 * vn * nx
          ball.vy -= 1.65 * vn * ny
          ball.impact(nx, ny, -vn)
          if (-vn > H * 2) { runner.setMouth('o'); setTimeout(() => runner.setMouth('smile'), 500) }
        }
      }
    }
    ball.step(dt)
  }

  // ── runner physics + AI ──────────────────────────────────────────────
  const MAX = () => 6.3 * H
  const gR = () => 24 * H

  function platformUnder(x, y, tol) {
    let best = null
    for (const p of platforms) {
      if (x >= p.l && x <= p.r && Math.abs(p.y - y) <= tol) {
        if (!best || p.y < best.y) best = p
      }
    }
    return best
  }

  function jumpTo(rise) {
    runner.vy = -Math.sqrt(2 * gR() * clamp(rise, H * 0.4, H * 2.35))
    runner.grounded = false
    standingOn = null
    jumpCooldown = 0.45
  }

  function aiDesire() {
    // returns desired horizontal velocity, and may trigger jumps/swats
    const r = runner
    if (runnerMode === 'exit') return MAX() * 1.1
    if (runnerMode === 'flee') return -MAX() * 0.85
    if (runnerMode === 'doubletake' || runnerMode === 'edge') return 0
    if (runnerMode === 'brake') {
      const d = edgeX - r.x
      if (Math.abs(d) < H * 0.12 || sign(d) !== sign(r.vx || d)) return 0
      return sign(d) * Math.min(MAX(), Math.abs(d) * 6)
    }
    if (runnerMode !== 'chase') return 0

    const b = ball
    const lead = clamp(b.vx * 0.22, -2.5 * H, 2.5 * H)
    const tx = b.x + lead
    const dx = tx - r.x
    const close = Math.abs(dx) < H * 0.35

    // Reach for it.
    const hand = r.handPage()
    if (swatCooldown <= 0 && Math.hypot(hand.x - b.x, hand.y - b.y) < b.r + H * 0.42) {
      if (exitArmed) exitSwat()
      else if (finaleArmed && b.y > groundY - H * 1.6) finaleSwat()
      else {
        let dir = sign(b.x - r.x) || r.facing
        if (b.x < W * 0.16) dir = 1
        if (b.x > W * 0.84) dir = -1
        swat(dir)
      }
    }

    // Jump when it's above and within reach (or resting up on the words).
    if (r.grounded && jumpCooldown <= 0) {
      const above = r.y - b.y
      if (Math.abs(dx) < H * 1.4 && above > H * 1.15 && b.vy > -2 * H) {
        // Out of reach? Jump anyway: he lands on the words and climbs from there.
        jumpTo(Math.min(above - H * 0.8, H * 2.35))
      }
    }
    if (close && Math.abs(b.vy) < H * 0.5 && Math.abs(b.vx) < H * 0.5) {
      stuckFor += STEP
      if (stuckFor > 1.1) {
        stuckFor = 0
        const away = sign(b.x - r.x) || (b.x < W / 2 ? 1 : -1)
        b.vx = away * rand(3, 4.5) * H
        b.vy = -rand(5, 7.5) * H
        b.impact(0, -1, H * 6)
      }
    } else stuckFor = 0
    return close ? 0 : sign(dx) * Math.min(MAX(), Math.abs(dx) * 3.5 + H)
  }

  function stepRunner(dt) {
    const r = runner
    if (runnerMode === 'off') return
    const want = aiDesire()

    const scripted = runnerMode === 'edge' || (runnerMode === 'doubletake' && Math.abs(r.vx) < 0.4 * H)
    if (r.grounded && scripted) {
      r.vx = 0
    } else if (r.grounded) {
      const opposing = want !== 0 && sign(r.vx) === -sign(want) && Math.abs(r.vx) > 2.2 * H
      if (opposing || (runnerMode === 'brake' && Math.abs(edgeX - r.x) < H * 1.6 && Math.abs(r.vx) > 1.5 * H)) {
        r.vx -= sign(r.vx) * Math.min(Math.abs(r.vx), 24 * H * dt)
        r.state = 'skid'
      } else {
        const acc = want === 0 ? 20 * H : 15 * H
        r.vx += clamp(want - r.vx, -acc * dt, acc * dt)
        r.state = Math.abs(r.vx) > 0.4 * H ? (runnerMode === 'flee' ? 'panic' : 'run') : 'idle'
      }
    } else {
      r.vx += clamp(want - r.vx, -6 * H * dt, 6 * H * dt) // a little air control
      r.vy += gR() * dt
      r.state = r.vy < 0 ? 'jump' : 'fall'
    }

    const dx = r.vx * dt
    const prevY = r.y
    r.x += dx
    r.y += r.grounded ? 0 : r.vy * dt
    if (r.grounded && (r.state === 'run' || r.state === 'panic')) r.stride(dx)

    // Facing follows motion, except while skidding.
    if (r.state !== 'skid' && Math.abs(r.vx) > 0.3 * H) r.facing = sign(r.vx)

    // walls
    if (runnerWalls.l && r.x < H * 0.35) { r.x = H * 0.35; r.vx = Math.max(0, r.vx) }
    if (runnerWalls.r && r.x > W - H * 0.35) { r.x = W - H * 0.35; r.vx = Math.min(0, r.vx) }
    if (!runnerWalls.l && r.x > H * 0.6 && r.x < W - H * 0.6 && runnerMode === 'chase') runnerWalls.l = true

    // the edge of the ledge (finale): never step into the gap
    if (gapOpen && r.y >= groundY - 1 && !standingOn) {
      if (r.x > gapL - H * 0.15 && r.x < (gapL + gapR) / 2) { r.x = gapL - H * 0.15; r.vx = Math.min(0, r.vx) }
      if (r.x < gapR + H * 0.15 && r.x >= (gapL + gapR) / 2) { r.x = gapR + H * 0.15; r.vx = Math.max(0, r.vx) }
    }

    if (r.grounded) {
      if (standingOn) {
        // walking along the words: step between neighbours, or drop off the end
        const next = platformUnder(r.x, standingOn.y, H * 0.4)
        if (next) {
          if (next !== standingOn) { standingOn = next; r.y = next.y }
        } else {
          r.grounded = false; standingOn = null; r.vy = 0
        }
      }
    } else {
      // landing on a word (one-way: only from above)
      if (r.vy > 0) {
        for (const p of platforms) {
          if (r.x >= p.l && r.x <= p.r && prevY <= p.y && r.y >= p.y) {
            r.y = p.y; r.vy = 0; r.grounded = true; standingOn = p
            springs.hit(p.el, 0, H * 0.06 * 10, 0)
            break
          }
        }
      }
      if (!r.grounded && r.y >= groundY) {
        r.y = groundY; r.vy = 0; r.grounded = true; standingOn = null
      }
    }
    reachT -= dt
    if (reachT > 0) {
      const sh = { x: r.x, y: r.y - H * 0.66 }
      r.reachAngle = Math.atan2((ball.x - sh.x) * r.facing, ball.y - sh.y)
    } else r.reachAngle = null
  }

  // ── director ─────────────────────────────────────────────────────────
  function direct(dt) {
    phaseT += dt
    modeT += dt
    swatCooldown -= dt
    jumpCooldown -= dt

    switch (phase) {
      case 'intro':
        ball.x = slotRect.x; ball.y = slotRect.y; ball.h = slotRect.h
        ball.setHidden(phaseT < 0.7)
        if (phaseT > 1.0) setPhase('wobble')
        break
      case 'wobble': {
        ball.x = slotRect.x; ball.y = slotRect.y; ball.h = slotRect.h
        const beats = [0, 0.2, 0.34]
        for (const b of beats) if (phaseT - dt < b && phaseT >= b) { ball.squashV += 9; ball.spin = 0; ball.angle = rand(-0.25, 0.25) }
        if (phaseT > 0.55) {
          ball.vx = -3.2 * H
          ball.vy = -9 * H
          ball.spin = -9
          setPhase('chase-a')
          runner.x = -H * 1.2
          runner.y = groundY
          runner.vx = 5 * H
          runner.facing = 1
          runner.grounded = true
          setMode('chase')
        }
        break
      }
      case 'chase-a':
        ball.h += (chaseH - ball.h) * Math.min(1, dt * 12)
        if (phaseT > 6) exitArmed = true
        if (phaseT > 8.5) exitSwat()
        break
      case 'exit':
        // If a letter knocked it back, give it another shove toward the edge.
        if (phaseT > 1.8 && ball.x < W + ball.r * 2 && ball.vx < 6 * H) {
          ball.vx = 9 * H
          if (ball.y > groundY - ball.r * 3) ball.vy = -7 * H
          phaseT = 1.0
        }
        if (ball.x > W + ball.r * 2 && runner.x > W + H) { setPhase('offstage'); runnerMode = 'off' }
        break
      case 'offstage':
        ball.vx = 0; ball.vy = 0
        if (phaseT > 1.25) {
          setPhase('return')
          runner.x = W + H
          runner.y = groundY
          runner.grounded = true
          standingOn = null
          runner.vx = -5.5 * H
          runner.facing = -1
          runner.headFacing = -1
          runner.setMouth('o')
          setMode('flee')
          ball.x = W + H * 3.2
          ball.y = groundY - H * 2.2
          ball.vx = -9.6 * H
          ball.vy = -5 * H
          ball.spin = -16
        }
        break
      case 'return':
        if (runnerMode === 'flee') {
          ball.vx = Math.min(ball.vx, -8.6 * H)
          // cornered against the left edge: the dot sails over him anyway
          if (runner.x < H * 1.6 && ball.x > runner.x && ball.vy > 0 && ball.y > groundY - ball.r * 3) ball.vy = -8 * H
        }
        if (ball.x < W - ball.r && runner.x < W - H * 0.5) { ballWalls.r = true; runnerWalls.r = true }
        if (runnerMode === 'flee' && ball.x < runner.x - H * 0.6) {
          setMode('doubletake')
          popBubble('!')
        }
        if (runnerMode === 'doubletake') {
          runner.headFacing = [1, -1, 1, -1, 1][Math.min(4, Math.floor(modeT / 0.13))]
          if (modeT > 0.75) {
            runner.headFacing = 1
            runner.setMouth('smile')
            beginChaseB()
          }
        }
        if (phaseT > 5 && runnerMode === 'flee') { runner.headFacing = 1; runner.setMouth('smile'); beginChaseB() }
        break
      case 'chase-b':
        if (phaseT > 3.2) finaleArmed = true
        if ((phaseT > 5.5 && ball.y > groundY - H * 1.6) || phaseT > 8) finaleSwat()
        break
      case 'finale': {
        const gapC = (gapL + gapR) / 2
        // A stalled dot (resting on a letter, say) hops on toward the gap.
        if (Math.hypot(ball.vx, ball.vy) < H * 0.7) stuckFor += STEP; else stuckFor = 0
        if (stuckFor > 0.45) {
          stuckFor = 0
          ball.vx = sign(gapC - ball.x) * clamp(Math.abs(gapC - ball.x) / 1.1, 2.5 * H, 7 * H)
          ball.vy = -6 * H
          ball.impact(0, -1, H * 6)
        }
        const nearGap = ball.x > gapL - H * 1.5 && ball.x < gapR + H * 1.5 && ball.y > groundY - H * 1.2
        if (runnerMode === 'chase' && (nearGap || phaseT > 8)) {
          edgeX = runner.x < gapC ? gapL - H * 0.15 : gapR + H * 0.15
          setMode('brake')
        }
        if (runnerMode === 'brake' && runner.grounded && !standingOn && Math.abs(runner.x - edgeX) < H * 0.2) {
          runner.vx = 0
          runner.facing = edgeX < gapC ? 1 : -1
          setMode('edge')
          runner.state = 'windmill'
          popBubble('!')
        }
        if (runnerMode === 'edge') {
          // watch it go first; the wobble starts when it actually drops
          if (ball.y < groundY + ball.r && !handedOff) { modeT = 0; runner.state = 'idle'; runner.headFacing = 1 }
          else if (modeT < 1.15) runner.state = 'windmill'
          else if (modeT < 3.4) { runner.state = 'peer'; runner.setMouth('flat') }
          else { runner.state = 'idle'; runner.setMouth('smile'); setPhase('rest') }
        }
        if (!handedOff && ball.y > groundY + ball.r * 2.5) handoff()
        break
      }
      case 'rest':
        if (!handedOff && ball.y > groundY + ball.r * 2.5) handoff()
        // now and then he glances back at you
        runner.headFacing = (phaseT % 6) > 5.2 ? -1 : 1
        if (runner.grounded) runner.state = 'idle'
        break
    }
  }

  function beginChaseB() {
    exitArmed = false
    swatCooldown = 0.4
    setMode('chase')
    setPhase('chase-b')
  }

  function handoff() {
    handedOff = true
    onHandoff?.(ball, { gravity: 21 * H })
  }

  /** The visitor scrolled away mid-chase: jump to the ending. */
  function skipToEnd() {
    if (handedOff) return
    gapOpen = true
    setMode('edge'); modeT = 3.5
    standingOn = null
    runner.grounded = true
    runner.y = groundY
    runner.x = gapL - H * 0.15
    runner.vx = runner.vy = 0
    runner.facing = 1
    runner.state = 'idle'
    runner.headFacing = 1
    setPhase('rest')
    handoff()
  }

  // ── loop ─────────────────────────────────────────────────────────────
  let last = 0, acc = 0
  function frame(now) {
    if (!running) return
    const dt = Math.min(0.05, (now - (last || now)) / 1000)
    last = now
    clock += dt

    if (!heroVisible && !handedOff && phase !== 'intro') {
      awayFor += dt
      if (awayFor > 0.5) skipToEnd()
    } else awayFor = 0

    acc += dt
    while (acc >= STEP) {
      direct(STEP)
      if (!handedOff && phase !== 'intro' && phase !== 'wobble' && phase !== 'offstage') stepBall(STEP)
      else if (phase === 'intro' || phase === 'wobble') ball.step(STEP)
      stepRunner(STEP)
      acc -= STEP
    }
    springs.step(dt)
    runner.update(dt)
    runner.svg.style.visibility = runnerMode === 'off' && phase !== 'rest' ? 'hidden' : ''
    runner.render()
    if (!handedOff) ball.render()
    placeBubble()
    requestAnimationFrame(frame)
  }

  // Pause the scene when the hero is off screen (after the chase, the idle
  // breathing doesn't need to run for nobody).
  const io = new IntersectionObserver(([e]) => {
    heroVisible = e.intersectionRatio > 0.2
    if (handedOff && phase === 'rest') {
      if (heroVisible && !running) { running = true; last = 0; requestAnimationFrame(frame) }
      else if (!heroVisible) running = false
    }
  }, { threshold: [0, 0.2, 0.5] })
  io.observe(hero)

  // Clicks: kick the dot; give Mich a hop.
  ball.el.addEventListener('pointerdown', (e) => {
    if (handedOff || phase === 'intro' || phase === 'wobble' || phase === 'offstage') return
    const dir = sign(ball.x - (e.pageX ?? ball.x)) || (Math.random() < 0.5 ? -1 : 1)
    ball.vx = dir * rand(4, 7) * H
    ball.vy = -rand(8, 11) * H
    ball.spin = dir * 14
    ball.impact(0, 1, H * 8)
  })
  runner.svg.addEventListener('pointerdown', () => {
    if (runner.grounded && (runnerMode === 'edge' || runnerMode === 'chase')) {
      jumpTo(H * 0.7)
      runner.setMouth('smile')
      if (runnerMode === 'edge') popBubble('hi')
    }
  })

  window.addEventListener('resize', debounce(() => {
    springs.items.forEach((it) => { it.x = it.y = it.vx = it.vy = it.rot = it.vr = 0; it.active = false; it.el.style.transform = '' })
    layout()
    requestAnimationFrame(() => {
      measure()
      if (runner.grounded) { runner.y = standingOn ? runner.y : groundY }
      if (standingOn) { standingOn = null; runner.grounded = false; runner.vy = 0 }
      if (runnerMode === 'edge') { runner.x = edgeX < (gapL + gapR) / 2 ? gapL - H * 0.15 : gapR + H * 0.15; runner.y = groundY }
    })
  }, 150))

  // ── go ───────────────────────────────────────────────────────────────
  layout()
  document.fonts.ready.then(() => {
    measureReady()
  })
  function measureReady() {
    // Measure with the words in their final position, then reveal them.
    headline.classList.add('is-measuring')
    measure()
    headline.classList.remove('is-measuring')
    ball.x = slotRect.x; ball.y = slotRect.y; ball.h = slotRect.h
    ball.render()
    hero.classList.add('is-ready')
    runner.svg.style.visibility = 'hidden'
    requestAnimationFrame(frame)
  }

  return { ball, runner, skipToEnd }
}

function debounce(fn, ms) {
  let t
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}
