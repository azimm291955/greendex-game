/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        indica: { light: '#c084fc', DEFAULT: '#9333ea', dark: '#6b21a8' },
        sativa: { light: '#fde047', DEFAULT: '#eab308', dark: '#a16207' },
        hybrid: { light: '#4ade80', DEFAULT: '#22c55e', dark: '#15803d' },
        board: { bg: '#05100a', card: '#10241a', border: '#3f6b3f' },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        'pulse-once': 'pulse 0.6s ease-in-out 1',
        'slide-in': 'slideIn 0.3s ease-out',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        slideIn: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 6px 1px rgba(74,222,128,0.3)' },
          '50%': { boxShadow: '0 0 18px 4px rgba(74,222,128,0.7)' },
        },
      },
    },
  },
  plugins: [],
};
