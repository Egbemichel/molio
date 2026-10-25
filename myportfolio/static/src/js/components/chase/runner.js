/**
 * runner.js — the illustrated Mich: a small procedural SVG rig.
 *
 * Drawn in the brand's own manner: ink line work, cream/ink colour-blocked shirt,
 * cap and glasses (as in Mich's earlier illustrations), and the same cream
 * sticker outline the logomarks have, so he reads clearly when he runs in front
 * of the headline. Skin is the one colour outside the core palette — a person
 * needs one.
 *
 * Poses are sets of joint angles. Each frame the rig eases toward the target
 * pose, so run → skid → jump → windmill blend instead of snapping.
 * Local units: 100 = full height, origin at the feet, y up is negative.
 */

const NS = 'http://www.w3.org/2000/svg'
const INK = '#2A1E1A'
const CREAM = '#F3EBDD'
const SHIRT = '#F3E2C6'
const SKIN = '#7A4A33'

const THIGH = 19, SHIN = 18, ANKLE = 4
const TORSO = 23, UPPER = 13.5, FORE = 12.5
const HIP_Y = -(THIGH + SHIN + ANKLE)

let uid = 0

function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag)
  for (const k in attrs) n.setAttribute(k, attrs[k])
  if (parent) parent.appendChild(n)
  return n
}

const POSE_KEYS = ['lean', 'hipN', 'kneeN', 'hipF', 'kneeF', 'shN', 'elN', 'shF', 'elF', 'head']
const ANGLE_WRAP = new Set(['shN', 'shF'])

function lerpAngle(a, b, t) {
  let d = b - a
  d = Math.atan2(Math.sin(d), Math.cos(d))
  return a + d * t
}

export class Runner {
  /**
   * @param {HTMLElement} layer  absolutely positioned page layer to draw into
   */
  constructor(layer) {
    this.id = ++uid
    this.x = 0
    this.y = 0          // feet, page coords
    this.vx = 0
    this.vy = 0
    this.facing = 1     // 1 = right, -1 = left
    this.headFacing = 1 // relative to body; -1 looks back over the shoulder
    this.height = 110   // px
    this.phase = 0
    this.time = 0
    this.state = 'idle'
    this.mouth = 'smile'
    this.reachAngle = null
    this.pose = Object.fromEntries(POSE_KEYS.map((k) => [k, 0]))
    this.grounded = true
    this.bobPx = 0
    this._build(layer)
  }

  _build(layer) {
    const svg = el('svg', { class: 'runner', viewBox: '-70 -125 140 140', 'aria-hidden': 'true' })
    const f = `runner-outline-${this.id}`
    const defs = el('defs', {}, svg)
    const filter = el('filter', { id: f, x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs)
    el('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: '2.6', result: 'grown' }, filter)
    el('feFlood', { 'flood-color': CREAM }, filter)
    el('feComposite', { in2: 'grown', operator: 'in', result: 'outline' }, filter)
    const merge = el('feMerge', {}, filter)
    el('feMergeNode', { in: 'outline' }, merge)
    el('feMergeNode', { in: 'SourceGraphic' }, merge)

    const body = el('g', { filter: `url(#${f})`, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg)
    this.root = body

    const limb = (parent, w, color) => ({
      outline: el('polyline', { fill: 'none', stroke: INK, 'stroke-width': w + 3.2 }, parent),
      fill: el('polyline', { fill: 'none', stroke: color, 'stroke-width': w }, parent),
    })
    const arm = (parent) => {
      const g = el('g', {}, parent)
      return {
        outline: el('polyline', { fill: 'none', stroke: INK, 'stroke-width': 9.2 }, g),
        sleeve: el('polyline', { fill: 'none', stroke: SHIRT, 'stroke-width': 6.2 }, g),
        fore: el('polyline', { fill: 'none', stroke: SKIN, 'stroke-width': 5.2 }, g),
        hand: el('circle', { r: 3.6, fill: SKIN, stroke: INK, 'stroke-width': 1.6 }, g),
      }
    }
    const shoe = (parent) => el('path', { fill: CREAM, stroke: INK, 'stroke-width': 1.6 }, parent)

    // back to front
    this.armF = arm(body)
    this.legF = limb(body, 8.4, INK)
    this.shoeF = shoe(body)

    // Torso drawn once in its own frame (hip at origin, shoulders at -TORSO);
    // only its transform changes per frame.
    this.torso = el('g', {}, body)
    el('path', { d: 'M0 1.5 L-9 1.5 C-10 -7 -10.8 -14 -10.4 -19 Q-10 -24.6 -4 -24.8 L0 -24.8 Z', fill: INK }, this.torso)
    el('path', { d: 'M0 1.5 L9.4 1.5 C10.6 -7 11 -14 10.4 -19 Q10 -24.6 4 -24.8 L0 -24.8 Z', fill: SHIRT }, this.torso)
    el('path', { d: 'M-9 1.5 C-10 -7 -10.8 -14 -10.4 -19 Q-10 -24.6 -4 -24.8 L4 -24.8 Q10 -24.6 10.4 -19 C11 -14 10.6 -7 9.4 1.5 Z', fill: 'none', stroke: INK, 'stroke-width': 1.7 }, this.torso)
    el('path', { d: 'M-2.5 -24.6 L1.2 -19.5 L4.6 -24.4', fill: 'none', stroke: INK, 'stroke-width': 1.5 }, this.torso)
    el('path', { d: 'M5.2 -12 h3.4', fill: 'none', stroke: INK, 'stroke-width': 1.3 }, this.torso) // pocket

    this.legN = limb(body, 8.4, INK)
    this.shoeN = shoe(body)

    // Head drawn at the origin facing right; positioned + flipped by transform.
    this.head = el('g', {}, body)
    const h = this.head
    el('rect', { x: -3.2, y: 6, width: 6.4, height: 9, rx: 2, fill: SKIN, stroke: INK, 'stroke-width': 1.5 }, h) // neck
    el('circle', { cx: 0, cy: 0, r: 11.5, fill: SKIN, stroke: INK, 'stroke-width': 1.7 }, h)
    el('path', { d: 'M-6.5 6.5 Q-1 13.5 7 9.2 Q11 6.5 11.3 2.2 L8.4 3.4 Q5 7.8 0.6 7 Q-3 6.8 -6.5 6.5 Z', fill: INK }, h) // beard
    el('circle', { cx: -6.8, cy: 1.5, r: 2.6, fill: SKIN, stroke: INK, 'stroke-width': 1.3 }, h) // ear
    el('path', { d: 'M-11.8 -1 Q-12.6 -11.5 -1.5 -12.6 Q9.8 -12.8 11.2 -3.8 L-11.8 -1 Z', fill: INK, stroke: INK, 'stroke-width': 1.4 }, h) // cap dome
    el('path', { d: 'M6.5 -4.5 Q14 -6.2 19.5 -3.4 Q14.5 -1.4 6.2 -1.6 Z', fill: INK, stroke: INK, 'stroke-width': 1.2 }, h) // brim
    el('path', { d: 'M-2 -12.2 Q-0.5 -13.8 1 -12.3', fill: 'none', stroke: CREAM, 'stroke-width': 1, opacity: 0.7 }, h) // cap button
    el('path', { d: 'M-5.8 0.2 L1.6 -0.6', fill: 'none', stroke: INK, 'stroke-width': 1.2 }, h) // temple
    el('rect', { x: 1.6, y: -3.2, width: 7.6, height: 5.4, rx: 1.8, fill: 'rgba(243,235,221,0.28)', stroke: INK, 'stroke-width': 1.5 }, h) // lens
    el('path', { d: 'M9.2 -1.2 L11.4 -1.4', fill: 'none', stroke: INK, 'stroke-width': 1.3 }, h) // bridge
    this.mouthEl = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.4 }, h)

    this.armN = arm(body)

    this.svg = svg
    layer.appendChild(svg)
    this.setMouth('smile')
  }

  setMouth(kind) {
    if (this.mouth === kind && this.mouthEl.getAttribute('d')) return
    this.mouth = kind
    const d = {
      smile: 'M5.2 4.6 Q7.6 6.4 9.8 4.4',
      flat: 'M5.4 5.2 L9.6 5',
      o: 'M7.4 3.6 a1.9 2.3 0 1 0 0.1 0 Z',
    }[kind]
    this.mouthEl.setAttribute('d', d)
    this.mouthEl.setAttribute('fill', kind === 'o' ? INK : 'none')
  }

  /** Target pose for the current state. Angles in radians, 0 = straight down. */
  _target(dt) {
    const t = this.time
    const speed = Math.min(1, Math.abs(this.vx) / (6.5 * this.height))
    const P = {}
    const s = this.state

    if (s === 'run' || s === 'panic') {
      const p = this.phase
      const A = 0.32 + 0.38 * speed
      const knee = (q) => 0.18 + (0.9 + 0.8 * speed) * Math.pow(Math.max(0, Math.cos(q + 0.8)), 1.4)
      P.hipN = 0.12 + A * Math.sin(p)
      P.kneeN = knee(p)
      P.hipF = 0.12 + A * Math.sin(p + Math.PI)
      P.kneeF = knee(p + Math.PI)
      P.lean = 0.1 + 0.2 * speed
      if (s === 'panic') {
        P.shN = 2.75 + 0.35 * Math.sin(p * 2)
        P.shF = 2.55 + 0.35 * Math.sin(p * 2 + 1.7)
        P.elN = 0.5
        P.elF = 0.5
        P.lean = 0.02
      } else {
        const AA = 0.45 + 0.55 * speed
        P.shN = -AA * Math.sin(p) + 0.1
        P.shF = AA * Math.sin(p) + 0.1
        P.elN = 1.25 + 0.35 * speed
        P.elF = 1.25 + 0.35 * speed
      }
      P.head = -P.lean * 0.6
    } else if (s === 'skid') {
      Object.assign(P, { lean: -0.38, hipN: 0.8, kneeN: 0.05, hipF: -0.15, kneeF: 0.95, shN: 1.25, elN: 0.35, shF: 0.95, elF: 0.4, head: 0.25 })
    } else if (s === 'jump') {
      Object.assign(P, { lean: 0.06, hipN: 1.0, kneeN: 1.55, hipF: -0.2, kneeF: 1.05, shN: 2.65, elN: 0.25, shF: -0.5, elF: 0.6, head: -0.15 })
    } else if (s === 'fall') {
      const w = Math.sin(t * 18) * 0.25
      Object.assign(P, { lean: 0.02, hipN: 0.45, kneeN: 0.55, hipF: 0.05, kneeF: 0.7, shN: 1.9 + w, elN: 0.35, shF: 1.6 - w, elF: 0.35, head: 0.05 })
    } else if (s === 'windmill') {
      const spin = t * 13
      Object.assign(P, { lean: 0.45 + 0.16 * Math.sin(t * 8), hipN: 0.15, kneeN: 0.12, hipF: -0.95, kneeF: 0.7, shN: spin, elN: 0.2, shF: spin + Math.PI, elF: 0.2, head: 0.35 })
    } else if (s === 'peer') {
      Object.assign(P, { lean: 0.38, hipN: 0.12, kneeN: 0.32, hipF: -0.04, kneeF: 0.3, shN: 2.55, elN: 2.35, shF: 0.45, elF: 0.55, head: 0.45 })
    } else if (s === 'shrug') {
      const lift = 0.08 * Math.sin(t * 3)
      Object.assign(P, { lean: 0, hipN: 0.07, kneeN: 0.06, hipF: -0.07, kneeF: 0.06, shN: 0.55 + lift, elN: -1.75, shF: 0.55 + lift, elF: -1.75, head: 0.12 })
    } else { // idle
      const breathe = Math.sin(t * 2.2)
      Object.assign(P, { lean: 0.02 + 0.012 * breathe, hipN: 0.07, kneeN: 0.07, hipF: -0.07, kneeF: 0.07, shN: 0.14 + 0.02 * breathe, elN: 0.3, shF: -0.08, elF: 0.28, head: -0.04 })
    }

    if (this.reachAngle !== null) {
      // Reaching for the dot: near arm points at it, body lunges.
      P.shN = this.reachAngle
      P.elN = 0.08
      P.lean = (P.lean || 0) + 0.18
    }
    return P
  }

  update(dt) {
    this.time += dt
    const target = this._target(dt)
    const rate = this.state === 'run' || this.state === 'panic' ? 30 : this.state === 'windmill' ? 40 : 14
    const k = 1 - Math.exp(-rate * dt)
    for (const key of POSE_KEYS) {
      const tv = target[key] ?? 0
      this.pose[key] = ANGLE_WRAP.has(key) ? lerpAngle(this.pose[key], tv, k) : this.pose[key] + (tv - this.pose[key]) * k
    }
  }

  /** Advance the run cycle by distance travelled (keeps feet from skating). */
  stride(dx) {
    const speed = Math.min(1, Math.abs(this.vx) / (6.5 * this.height))
    const stepPx = this.height * (0.32 + 0.3 * speed)
    this.phase += (Math.abs(dx) / stepPx) * Math.PI
  }

  render() {
    const P = this.pose
    const leg = (hip, a, b) => {
      const knee = [hip[0] + THIGH * Math.sin(a), hip[1] + THIGH * Math.cos(a)]
      const sa = a - b
      const ankle = [knee[0] + SHIN * Math.sin(sa), knee[1] + SHIN * Math.cos(sa)]
      return { knee, ankle, sa }
    }

    // Solve legs at a nominal hip height, then drop the body so the lowest
    // foot touches the ground (that is where the natural bob comes from).
    let hip = [0, HIP_Y]
    const n0 = leg(hip, P.hipN, P.kneeN)
    const f0 = leg(hip, P.hipF, P.kneeF)
    let drop = 0
    if (this.grounded) {
      const lowest = Math.max(n0.ankle[1], f0.ankle[1]) + ANKLE
      drop = -lowest
    }
    hip = [0, HIP_Y + drop + this.bobPx]
    const n = leg(hip, P.hipN, P.kneeN)
    const f = leg(hip, P.hipF, P.kneeF)

    const dir = [Math.sin(P.lean), -Math.cos(P.lean)]
    const shoulder = [hip[0] + dir[0] * TORSO, hip[1] + dir[1] * TORSO]
    const neckBase = [hip[0] + dir[0] * (TORSO + 2), hip[1] + dir[1] * (TORSO + 2)]

    const pts = (...a) => a.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
    const setLimb = (L, hipPt, s) => {
      const v = pts(hipPt, s.knee, s.ankle)
      L.outline.setAttribute('points', v)
      L.fill.setAttribute('points', v)
    }
    setLimb(this.legN, hip, n)
    setLimb(this.legF, hip, f)

    const shoeD = (s) => {
      const fx = Math.cos(s.sa), fy = -Math.sin(s.sa)  // forward along the foot
      const a = s.ankle
      const heel = [a[0] - fx * 3.2, a[1] - fy * 3.2]
      const toe = [a[0] + fx * 9, a[1] + fy * 9]
      const ux = -fy, uy = fx // "up" from the sole (towards the knee side)
      const lift = 3.4
      return `M${heel[0] - ux * 0.6},${heel[1] - uy * 0.6} L${toe[0]},${toe[1]} Q${toe[0] + ux * lift},${toe[1] + uy * lift} ${toe[0] - fx * 3 + ux * lift * 1.2},${toe[1] - fy * 3 + uy * lift * 1.2} L${heel[0] + ux * lift},${heel[1] + uy * lift} Z`
        .replace(/(\d+\.\d{3,})/g, (m) => (+m).toFixed(2))
    }
    this.shoeN.setAttribute('d', shoeD(n))
    this.shoeF.setAttribute('d', shoeD(f))

    this.torso.setAttribute('transform', `translate(${hip[0].toFixed(2)} ${hip[1].toFixed(2)}) rotate(${(P.lean * 180 / Math.PI).toFixed(2)})`)

    const arm = (A, a, b) => {
      const sh = [shoulder[0] + dir[0] * -2.5, shoulder[1] + dir[1] * -2.5]
      const elbow = [sh[0] + UPPER * Math.sin(a + P.lean), sh[1] + UPPER * Math.cos(a + P.lean)]
      const fa = a + P.lean + b
      const hand = [elbow[0] + FORE * Math.sin(fa), elbow[1] + FORE * Math.cos(fa)]
      A.outline.setAttribute('points', pts(sh, elbow, hand))
      A.sleeve.setAttribute('points', pts(sh, elbow))
      A.fore.setAttribute('points', pts(elbow, hand))
      A.hand.setAttribute('cx', hand[0].toFixed(2))
      A.hand.setAttribute('cy', hand[1].toFixed(2))
      return hand
    }
    this.handN = arm(this.armN, P.shN, P.elN)
    arm(this.armF, P.shF, P.elF)

    const headC = [neckBase[0] + dir[0] * 10.5, neckBase[1] + dir[1] * 10.5]
    const tilt = (P.lean + P.head) * (180 / Math.PI)
    this.head.setAttribute('transform', `translate(${headC[0].toFixed(2)} ${headC[1].toFixed(2)}) rotate(${tilt.toFixed(2)}) scale(${(1.16 * this.headFacing).toFixed(2)} 1.16)`)

    const px100 = this.height / 100
    this.svg.style.width = `${140 * px100}px`
    this.svg.style.height = `${140 * px100}px`
    // viewBox origin (-70,-125) → feet at (70, 125) inside the box
    const tx = this.x - 70 * px100
    const ty = this.y - 125 * px100
    this.svg.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`
    this.root.setAttribute('transform', this.facing < 0 ? 'scale(-1 1)' : '')
  }

  /** Near hand in page coordinates (for "almost got it" reach checks). */
  handPage() {
    if (!this.handN) return { x: this.x, y: this.y - this.height * 0.6 }
    const k = this.height / 100
    return { x: this.x + this.handN[0] * k * this.facing, y: this.y + this.handN[1] * k }
  }

  headPage() {
    const k = this.height / 100
    return { x: this.x + 4 * k * this.facing, y: this.y - 82 * k, r: 14 * k }
  }
}
