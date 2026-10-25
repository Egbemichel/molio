/** @type {import('tailwindcss').Config} */
// Brand tokens come from ME_THE_BRAND.md (repo root). Cream and ink lead; red is
// the accent, kept for the dot, focus and hover so it stays meaningful.
module.exports = {
  content: [
    './templates/**/*.html',
    './static/src/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F3EBDD',
          deep: '#F3E2C6',   // pattern tint, used for quiet surfaces
        },
        ink: '#2A1E1A',
        red: '#B3262E',
      },
      fontFamily: {
        display: ['"Clash Display"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        geisha: ['Geisha', 'serif'],
      },
      fontSize: {
        // Fluid display scale: phone → wide desktop.
        hero: ['clamp(2.6rem, 8.6vw, 10rem)', { lineHeight: '0.95', letterSpacing: '-0.025em' }],
        'display-xl': ['clamp(2.5rem, 7vw, 7.5rem)', { lineHeight: '0.95', letterSpacing: '-0.025em' }],
        'display-l': ['clamp(2rem, 4.6vw, 4.75rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-m': ['clamp(1.5rem, 2.6vw, 2.75rem)', { lineHeight: '1.12', letterSpacing: '-0.015em' }],
        label: ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.14em' }],
      },
      spacing: {
        gutter: 'clamp(16px, 4vw, 60px)',
      },
      maxWidth: {
        page: '100rem',
      },
      transitionTimingFunction: {
        // The one curve the site moves on.
        brand: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
