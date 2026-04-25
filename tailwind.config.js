/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        weaver: {
          orange: '#F27221',
          purple: '#6638B6',
          dark: '#2D1B4E',
          verte: '#22c55e',
        },
        nest: {
          blue: '#009AE0',
          light: '#F8FAFC',
          accent: '#FFB84D',
        },
        card: {
          thatch: '#b4999e',
          cello: '#1c3751',
          dingley: '#697949',
          wine: '#5c4c68',
        }
      },
      borderRadius: {
        nest: '1.5rem',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    // Hide scrollbar while keeping it functional
    ({ addUtilities }) => {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      })
    },
  ],
}
