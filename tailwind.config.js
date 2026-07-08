/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        piano: {
          bg: '#0f1020',
          surface: '#1a1c33',
          surface2: '#252846',
          primary: '#7c5cff',
          primaryDark: '#5b3fd6',
          accent: '#22d3ee',
          good: '#34d399',
          bad: '#f87171',
          warn: '#fbbf24',
          text: '#e7e7f4',
          muted: '#9aa0c3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.2s ease-out infinite',
      },
    },
  },
  plugins: [],
};
