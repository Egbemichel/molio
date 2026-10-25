# molio — Design System

**Read [`ME_THE_BRAND.md`](../ME_THE_BRAND.md) first.** It is the source of truth for
who Mich is and how the site should feel. This file only records how that brand is
implemented in this codebase (Django templates + Tailwind + vanilla JS).

## Tokens (`myportfolio/tailwind.config.js`, `static/src/css/main.css`)

| Token | Hex | Use |
|---|---|---|
| `cream` | `#F3EBDD` | page background, most of the screen |
| `cream-deep` | `#F3E2C6` | quiet surfaces (pattern tint) |
| `ink` | `#2A1E1A` | text, dark surfaces, line work |
| `red` | `#B3262E` | **the dot**, focus ring, link hover. Nothing else. |

Red on ink is 2.5:1, so red is never text on the dark section. Brown on cream is
13.6:1, red on cream 5.5:1.

Skin tone `#7A4A33` exists only inside the runner illustration — a person needs one.

## Type

- **Clash Display** (`font-display`, self-hosted variable woff2): headlines, nav, statements.
- **Geisha** (`font-geisha`, subset woff2): one expressive moment per screen, large only
  (currently: "hello" in Contact).
- **DM Sans** (`font-sans`, Google Fonts): body, labels, forms.
- Fluid scale: `text-hero`, `text-display-xl`, `-l`, `-m`, `text-label`.

## Brand assets (`static/brand/`)

Source files live in `public/brand/` (as supplied). Web copies:

- `logos/em.svg`, `logos/21.svg`, `logos/mich.svg` — the supplied marks with the
  artboard cropped (viewBox only, artwork untouched).
- `templates/components/logo_21.svg.html` — 2·1 inlined, its red dot wrapped in
  `<g data-logo-dot>` so the travelling dot can land in its exact position.
- `templates/components/dot.svg.html` — the red dot path from the marks, with its
  cream outline. Every red dot on the site is this shape.
- `pattern/pattern.svg` — used once, as the band above Contact. It's drawn for cream
  backgrounds; it goes muddy on ink.
- `cutouts/` — background-removed portraits with a baked-in cream sticker outline.
- `photos/` — solo photos of Mich (WebP). Group photos are deliberately left out.

## The red dot (the site's one big idea)

`static/src/js/components/`:

- `hero_chase.js` — the slogan's full stop pops out; an illustrated Mich (`chase/runner.js`)
  chases it, it bounces off the real letter shapes (`chase/world.js`), they run off and
  back, and it drops off the ledge into the page.
- `dot_journey.js` — the dot then rests on `[data-dot-stop]` elements (the About full
  stop, section labels) as you scroll, and settles into the 2·1 mark in the footer.
- Reduced motion: no chase, no journey; the static dots stay in their places.

To add a stop, put `<span class="ledge__slot" data-dot-stop="name"></span>` in a label.

## Project worlds (the exception to all of the above)

Project pages deliberately break Mich's brand rules. Each one is its own world:
`apps/projects/worlds.py` resolves a preset plus admin overrides into `--w-*`
custom properties; `static/css/worlds.css` holds structure only.

- **The frame stays Mich's:** cream nav bar, footer, and the red dot, which signs
  each project title and hops through the chapters.
- **Chapter layouts:** wall, split, fullbleed, specimen, gallery, statement,
  pillars (`templates/projects/layouts/`). Each project mixes them differently.
- **Home doorways:** full-screen sticky panels in each world's colours and display
  face (fonts subset to the title's letters). The words around it stay in Mich's voice.
- Fonts are Google Fonts specs; `local:Clash Display` uses a face the site already serves.
- Per-project CSS lives in the project's *extra CSS* field, scoped by `.world--<slug>`.

## Motion rules

- One easing curve (`ease-brand`, `--ease`). Transform/opacity only.
- No scroll hijacking, no smooth-scroll libraries, no custom cursor, no page loader.
- Page transitions use cross-document View Transitions (CSS only).
- Everything must respect `prefers-reduced-motion`.

## Content (admin)

- Projects: `hook`, `aside` (Mich's note), `description`, `starting_point`, `outcome`,
  world settings, and ordered **chapters** with a layout and media each.
  Cover: the mockup, else the logo, else the first chapter photo.
- Gallery items: photos for "Off the clock", each with a one-line `caption`.
- `python manage.py seed_content` loads the design projects and photos.

## Pre-ship checklist

- [ ] Tab through: visible red focus ring, logical order.
- [ ] Reduced motion on: still, composed hero; static dots.
- [ ] Phone (375px): hero chase fits, no horizontal scroll, strip scrolls by touch.
- [ ] Every image has meaningful `alt`; decorative ones are `alt=""`/`aria-hidden`.
- [ ] No claims, metrics or photos that aren't true.
