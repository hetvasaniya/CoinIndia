/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        mist: {
          blue: '#99CDD8',
          mint: '#DAEBE3',
          peach: '#FDE8D3',
          rose: '#F3C3B2',
          sage: '#CFD6C4',
          charcoal: '#657166',
        },
        cream: '#F8FBFD',
        parchment: '#EEF5F9',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #BDD8E9 0%, #DAEBE3 35%, #FDE8D3 70%, #F3C3B2 100%)',
        'gradient-body': 'linear-gradient(180deg, #EEF5F9 0%, #BDD8E9 30%, #DAEBE3 60%, #F8FBFD 100%)',
        'gradient-dark': 'linear-gradient(135deg, #001D39 0%, #0A4174 100%)',
        'gradient-btn': 'linear-gradient(135deg, #0A4174 0%, #49769F 100%)',
        'gradient-btn-hover': 'linear-gradient(135deg, #001D39 0%, #0A4174 100%)',
        'gradient-card': 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #001D39 0%, #0A4174 80%, #49769F 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 29, 57, 0.08)',
        'glass-lg': '0 12px 48px 0 rgba(0, 29, 57, 0.12)',
        'ocean': '0 4px 20px 0 rgba(10, 65, 116, 0.15)',
      },
    },
  },
  plugins: [],
};
