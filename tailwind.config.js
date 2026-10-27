/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hot: {
          primary:     '#C97B5B',
          'primary-light': '#F5E6DC',
          'primary-dark':  '#9B5A3E',
          accent:      '#D4A853',
          bg:          '#FAF7F4',
          surface:     '#FFFFFF',
          text:        '#2A1F1A',
          'text-2':    '#6B4F3F',
          muted:       '#9E8878',
          success:     '#4A9B6F',
          danger:      '#C44B3D',
          warning:     '#E09530',
          border:      '#E8DDD6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};
