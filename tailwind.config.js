/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['app/**/*.{tsx,jsx,ts,js}', 'components/**/*.{tsx,jsx,ts,js}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#111111',
        tertiary: '#222222',
      },
    },
  },
  plugins: [],
};
