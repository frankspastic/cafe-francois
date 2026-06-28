/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6F4E37',
        'primary-light': '#8B6651',
        secondary: '#A0826D',
        accent: '#D4A574',
        'accent-dark': '#B8885A',
      }
    },
  },
  plugins: [],
}
