/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        abyss: { 950: '#020817', 900: '#041427', 800: '#07203a', 700: '#0b2f52' },
        glow: { teal: '#2ef2d0', cyan: '#4dd0e1', pink: '#ff7eb6', gold: '#ffd166' },
      },
    },
  },
  plugins: [],
}
