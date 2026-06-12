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
        /* ── Primary: Trust Blue ──────────────────────────────────── */
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',   // dark-mode primary
          600: '#2563EB',   // light-mode primary (trust, action, links, buttons)
          700: '#1D4ED8',
          800: '#1E3A8A',   // headers, emphasis
          900: '#172554',
        },
        /* ── Accent: Growth Green ────────────────────────────────── */
        accent: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',   // match success, compatible state
          600: '#16A34A',
          700: '#15803D',
          dark: '#34D399',  // dark-mode accent green
        },
        /* ── Premium: Value Purple ───────────────────────────────── */
        premium: {
          400: '#A78BFA',
          500: '#8B5CF6',   // premium listings
          600: '#7C3AED',
        },
        /* ── Warning: Amber ──────────────────────────────────────── */
        warn: {
          400: '#FBBF24',
          500: '#F59E0B',   // match medium, caution
          600: '#D97706',
        },
        /* ── Error: Red ──────────────────────────────────────────── */
        danger: {
          400: '#F87171',
          500: '#EF4444',   // match low, errors
          600: '#DC2626',
        },
        /* ── Neutrals: Clean Greys (UI backbone) ─────────────────── */
        surface: {
          bg:     '#F8FAFC',  // light background
          card:   '#FFFFFF',  // light cards
          border: '#E2E8F0',  // light borders
          'dark-bg':     '#0B1220',  // dark background
          'dark-card':   '#111827',  // dark cards
          'dark-elev':   '#1F2937',  // dark elevated surface
          'dark-border': '#334155',  // dark borders
        },
        /* ── Text ────────────────────────────────────────────────── */
        ink: {
          primary:   '#0F172A',   // light text primary
          secondary: '#475569',   // light text secondary
          'dark-primary':   '#F9FAFB',  // dark text primary
          'dark-secondary': '#94A3B8',  // dark text secondary
        },
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
