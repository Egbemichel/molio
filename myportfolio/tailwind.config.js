/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.html',
    './static/src/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#3F3F3F',
        primary: '#E8E8E8',
        accent: '#8B1E1E',
      },
      fontFamily: {
        hagia: ['HagiaPro', 'sans-serif'],
        geisha: ['Geisha', 'serif'],
      },
      spacing: {
        'figma-margin': '60px',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        'marquee-reverse': 'marquee-reverse 30s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
