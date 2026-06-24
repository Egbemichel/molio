# molio — Design System (Source of Truth)

Distilled from the existing build via the `ui-ux-pro-max` skill, adapted to this
project's real stack: **Django + Tailwind (HTML/CSS) + vanilla JS + GSAP/Alpine**.
This is *your* system, documented — not a redesign. New pages/components should
follow it for consistency.

## Brand identity

- **Style:** editorial / minimal-luxury. Large display type, generous whitespace,
  thin dividers, restrained accent. Keep it; don't introduce glassmorphism/brutalism.
- **Voice:** confident, personal, calm.

## Color tokens (`tailwind.config.js`)

| Token | Hex | Use |
|-------|-----|-----|
| `dark` | `#3F3F3F` | primary text, dark buttons/surfaces |
| `primary` | `#E8E8E8` | page background |
| `accent` | `#8B1E1E` | single accent — links, focus, CTA hover, highlights |
| white | `#FFFFFF` | section surfaces |

Rule: **one accent.** `#8B1E1E` is the only brand color — use opacity variants
(`dark/10`, `opacity-60`) for hierarchy, not new hues. Accent is also the focus-ring color.

## Typography

- **Display/headings:** `HagiaPro` (`font-hagia`) — weights 400/500/800.
- **Hero name / loader:** `Geisha` (`font-geisha`) — decorative only, never body.
- **Fallback/system:** `DM Sans` (loaded) for non-branded UI.
- Type scale already in `@layer components`: `.section-title` (6xl), `.heading-md`
  (5xl), `.heading-sm` (3xl). Reuse these instead of ad-hoc sizes.

## Effects

- Radius: pills for buttons (`rounded-full`), `rounded-3xl`/`[2rem]` for cards.
- Shadow: `shadow-sm`/`shadow-lg`/`shadow-2xl` — keep the existing scale, don't add random values.
- Borders: `border-dark/10` hairlines as the default separator.

## Motion (GSAP + CSS)

- Durations 150–400ms for micro-interactions; loader sequence is the one exception.
- Animate `transform`/`opacity` only (already the case in cursor/loader).
- **Always gate motion behind `prefers-reduced-motion`** — handled globally in
  `static/src/css/main.css` and per-component (cursor, loader, micro-loaders).
- Marquees pause on hover and freeze under reduced-motion.

## Accessibility baseline (enforced)

- Visible keyboard focus via `:focus-visible` accent ring (in `main.css`).
- Form inputs have associated `<label for>`, required markers, `autocomplete`,
  `type=email`/`inputmode`, and an `aria-live` status region (see `contact.html`).
- Images need descriptive `alt`. Icon-only controls need `aria-label`.
- Don't convey meaning by color alone (pair with text/icon).

## Known limitation / next opportunity

- **Mobile (<768px) is intentionally blocked** (`.mobile-block` in `base.html`)
  with a "grab a laptop" screen. This is the single biggest UX gap. The desktop
  layout uses fixed large type (`text-6xl`, `px-[60px]`, `max-w-[100rem]`) that
  isn't yet fluid. Making it responsive is a dedicated effort — see notes when ready.

## Pre-ship checklist (web)

- [ ] Tab through the page: focus ring visible, order logical.
- [ ] Test with OS "reduce motion" on: no infinite/jarring animation.
- [ ] Color contrast ≥ 4.5:1 for body text (watch `opacity-50/60` grays on white).
- [ ] All images have meaningful `alt`; icon buttons have `aria-label`.
- [ ] Forms: labels, required markers, inline error text, success confirmation.
- [ ] No layout shift on load (reserve image dimensions).
