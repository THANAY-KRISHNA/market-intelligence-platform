/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#09090b',
          card: '#0c0c0f',
          border: '#1e1e24',
          accent: '#2563eb',
          glowing: '#10b981',
          text: '#fafafa',
          muted: '#71717a'
        },
        neon: {
          cyan: '#00f2fe',
          violet: '#a855f7',
          green: '#10b981',
          rose: '#f43f5e'
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
