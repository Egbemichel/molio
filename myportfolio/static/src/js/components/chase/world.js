/**
 * world.js — turns the hero headline into physical geometry.
 *
 * Every glyph becomes a box hugging its actual ink (not its line box), so the
 * ball bounces off the letter you see. Every word becomes a platform at the top
 * of its ink, so the runner can hop along the headline. All coordinates are
 * page coordinates (document space), the same space the ball and runner live in.
 */

const measureCtx = document.createElement('canvas').getContext('2d')
const inkCache = new Map()

function inkOf(ch, font) {
  const key = font + '|' + ch
  let m = inkCache.get(key)
  if (!m) {
    measureCtx.font = font
    const t = measureCtx.measureText(ch)
    m = {
      left: t.actualBoundingBoxLeft,
      right: t.actualBoundingBoxRight,
      ascent: t.actualBoundingBoxAscent,
      descent: t.actualBoundingBoxDescent,
      fontAscent: t.fontBoundingBoxAscent,
    }
    inkCache.set(key, m)
  }
  return m
}

/**
 * Measure the headline.
 * @param {HTMLElement} root  element whose descendant [data-word] spans hold the text
 * @returns {{ glyphs, words, bounds }}
 */
export function measureHeadline(root) {
  const sx = window.scrollX
  const sy = window.scrollY
  const glyphs = []
  const words = []
  const range = document.createRange()

  root.querySelectorAll('[data-word]').forEach((wordEl) => {
    const cs = getComputedStyle(wordEl)
    const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    const word = { el: wordEl, left: Infinity, right: -Infinity, top: Infinity, glyphs: [] }

    const walker = document.createTreeWalker(wordEl, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      const text = node.textContent
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (/\s/.test(ch)) continue
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        const r = range.getBoundingClientRect()
        if (!r.width) continue
        const ink = inkOf(ch, font)
        const baseline = r.top + ink.fontAscent
        const g = {
          word,
          l: r.left - ink.left + sx,
          r: r.left + ink.right + sx,
          t: baseline - ink.ascent + sy,
          b: baseline + ink.descent + sy,
        }
        glyphs.push(g)
        word.glyphs.push(g)
        word.left = Math.min(word.left, g.l)
        word.right = Math.max(word.right, g.r)
        word.top = Math.min(word.top, g.t)
      }
    }
    if (word.glyphs.length) words.push(word)
  })

  const bounds = glyphs.reduce(
    (a, g) => ({ l: Math.min(a.l, g.l), r: Math.max(a.r, g.r), t: Math.min(a.t, g.t), b: Math.max(a.b, g.b) }),
    { l: Infinity, r: -Infinity, t: Infinity, b: -Infinity },
  )
  return { glyphs, words, bounds }
}

/**
 * Circle vs axis-aligned box. Returns the contact normal + depth, or null.
 */
export function circleBox(cx, cy, rad, b) {
  const px = Math.max(b.l, Math.min(cx, b.r))
  const py = Math.max(b.t, Math.min(cy, b.b))
  let dx = cx - px
  let dy = cy - py
  const d2 = dx * dx + dy * dy
  if (d2 > rad * rad) return null
  if (d2 > 1e-6) {
    const d = Math.sqrt(d2)
    return { nx: dx / d, ny: dy / d, depth: rad - d }
  }
  // Centre is inside the box: push out along the shallowest side.
  const opts = [
    { nx: -1, ny: 0, depth: cx - b.l + rad },
    { nx: 1, ny: 0, depth: b.r - cx + rad },
    { nx: 0, ny: -1, depth: cy - b.t + rad },
    { nx: 0, ny: 1, depth: b.b - cy + rad },
  ]
  return opts.reduce((a, o) => (o.depth < a.depth ? o : a))
}

/**
 * Word "bump": a damped spring per word so a hit word nudges and settles.
 * Words are inline-block spans, so transforms don't reflow the headline.
 */
export class WordSprings {
  constructor(words) {
    this.items = words.map((w) => ({ el: w.el, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, active: false }))
    this.byEl = new Map(this.items.map((it) => [it.el, it]))
  }
  hit(wordEl, ix, iy, spin = 0) {
    const it = this.byEl.get(wordEl)
    if (!it) return
    it.vx += ix
    it.vy += iy
    it.vr += spin
    it.active = true
  }
  step(dt) {
    const k = 520, c = 16
    for (const it of this.items) {
      if (!it.active) continue
      it.vx += (-k * it.x - c * it.vx) * dt
      it.vy += (-k * it.y - c * it.vy) * dt
      it.vr += (-k * it.rot - c * it.vr) * dt
      it.x += it.vx * dt
      it.y += it.vy * dt
      it.rot += it.vr * dt
      if (Math.abs(it.x) + Math.abs(it.y) + Math.abs(it.vx) + Math.abs(it.vy) + Math.abs(it.rot) * 40 < 0.05) {
        it.x = it.y = it.vx = it.vy = it.rot = it.vr = 0
        it.active = false
        it.el.style.transform = ''
        continue
      }
      it.el.style.transform = `translate(${it.x.toFixed(2)}px, ${it.y.toFixed(2)}px) rotate(${it.rot.toFixed(3)}deg)`
    }
  }
}
