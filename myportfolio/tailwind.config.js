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
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
