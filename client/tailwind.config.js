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
        // Golden palette
        gold: {
          50: '#FFF9EB',
          100: '#FFF0CC',
          200: '#FFE08A',
          300: '#E5C46A',
          400: '#D4A843',
          500: '#B8860B', // Primary gold
          600: '#9A7209',
          700: '#7C5C07',
          800: '#5E4505',
          900: '#3F2E03',
        },
        // Dark palette  
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#27272a',
          700: '#18181b',
          800: '#121215',
          900: '#09090b',
          950: '#030304',
        },
        // Legacy ocean colors (kept for any remaining references)
        ocean: {
          50: '#E8F4FA',
          100: '#BDD8E9',
          200: '#7BBDE8',
          300: '#6EA2B3',
          400: '#4E8EA2',
          500: '#49769F',
          600: '#0A4174',
          700: '#001D39',
          800: '#001229',
          900: '#000A18',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-hero-dark': 'linear-gradient(135deg, #0a0a0a 0%, #1a1200 50%, #0a0a0a 100%)',
        'gradient-hero-light': 'linear-gradient(135deg, #FAF8F5 0%, #FFF9EB 50%, #FAF8F5 100%)',
        'gradient-gold': 'linear-gradient(135deg, #B8860B 0%, #D4A843 50%, #B8860B 100%)',
        'gradient-gold-subtle': 'linear-gradient(135deg, rgba(184,134,11,0.1) 0%, rgba(212,168,67,0.05) 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0a0a0a 0%, #141414 60%, #1f1f1f 100%)',
        'gradient-card-dark': 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
        'gradient-card-light': 'linear-gradient(180deg, #ffffff 0%, #FEFDFB 100%)',
        'gradient-btn': 'linear-gradient(135deg, #B8860B 0%, #D4A843 100%)',
        'gradient-btn-hover': 'linear-gradient(135deg, #9A7209 0%, #B8860B 100%)',
        'gradient-animated': 'linear-gradient(270deg, #0a0a0a, #1a1200, #B8860B, #1a1200, #0a0a0a)',
      },
      boxShadow: {
        'gold': '0 4px 20px 0 rgba(184, 134, 11, 0.15)',
        'gold-lg': '0 8px 40px 0 rgba(184, 134, 11, 0.2)',
        'gold-glow': '0 0 20px rgba(184, 134, 11, 0.3)',
        'dark': '0 4px 20px 0 rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 8px 40px 0 rgba(0, 0, 0, 0.4)',
        'card-dark': '0 2px 12px 0 rgba(0, 0, 0, 0.2)',
        'card-light': '0 2px 12px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'gradient-shift': 'gradientShift 8s ease infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'theme-switch': 'themeSwitch 0.5s ease-in-out',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(184,134,11,0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(184,134,11,0.4)' },
        },
        themeSwitch: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(0.8)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
      },
      backgroundSize: {
        '400': '400% 400%',
      },
    },
  },
  plugins: [],
};
