/**
 * ball.js — the red dot as a physical thing.
 *
 * It's the exact dot from the logomarks (same path, same cream outline), with a
 * little life: it spins with its speed, squashes on impact and springs back.
 * Position is the centre of the dot, in page coordinates. Callers integrate
 * motion and report impacts; this class owns size, spin, squash and drawing.
 */

const RATIO = 142.27 / 107 // dot artwork width / height

export class Ball {
  constructor(layer, svgTemplate) {
    this.el = document.createElement('div')
    this.el.className = 'live-dot'
    this.el.appendChild(svgTemplate.cloneNode(true))
    layer.appendChild(this.el)

    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.h = 20          // visual height of the red shape, px
    this.angle = 0       // radians
    this.spin = 0        // rad/s
    this.squash = 0      // >0 flattens along the impact normal
    this.squashV = 0
    this.normal = 0      // angle of the last impact normal
    this.hidden = false
    this.upright = false // ease the angle back to 0 (when coming to rest)
  }

  /** Collision radius: the dot is wider than tall, so sit between the two. */
  get r() { return this.h * 0.6 }

  impact(nx, ny, speed) {
    this.normal = Math.atan2(ny, nx) - Math.PI / 2
    this.squashV += Math.min(speed / (this.h * 55), 0.55) * 14
  }

  step(dt) {
    // squash spring
    const k = 420, c = 15
    this.squashV += (-k * this.squash - c * this.squashV) * dt
    this.squash += this.squashV * dt
    if (this.upright) {
      const target = Math.round(this.angle / (Math.PI * 2)) * Math.PI * 2
      this.angle += (target - this.angle) * Math.min(1, dt * 10)
      this.spin *= Math.exp(-dt * 10)
    } else {
      this.angle += this.spin * dt
    }
  }

  setHidden(hidden) {
    if (this.hidden === hidden) return
    this.hidden = hidden
    this.el.style.visibility = hidden ? 'hidden' : ''
  }

  render() {
    const w = this.h * RATIO
    const s = Math.max(-0.35, Math.min(0.45, this.squash))
    const n = this.normal
    this.el.style.width = `${w.toFixed(2)}px`
    this.el.style.height = `${this.h.toFixed(2)}px`
    this.el.style.transform =
      `translate3d(${(this.x - w / 2).toFixed(2)}px, ${(this.y - this.h / 2).toFixed(2)}px, 0) ` +
      `rotate(${n.toFixed(4)}rad) scale(${(1 + s * 0.8).toFixed(4)}, ${(1 - s).toFixed(4)}) rotate(${(this.angle - n).toFixed(4)}rad)`
  }
}
