/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kaluli: {
          red: '#ED1651',
          redDark: '#C4103F',
          gold: '#F5B942',
          goldSoft: '#FBE3B0',
          navy: '#0B1130',
          navyLight: '#161E4A',
          ink: '#161A2E',
          cream: '#FFF9F3',
          mist: '#F4F1EA',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', 'ui-rounded', 'system-ui', 'sans-serif'],
        body: ['"Nunito"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(11, 17, 48, 0.25)',
        pop: '0 6px 0 0 rgba(0,0,0,0.15)',
      },
      backgroundImage: {
        'kaluli-hero': 'radial-gradient(120% 120% at 50% -10%, #3A1030 0%, #0B1130 55%, #0B1130 100%)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        pop: 'pop 0.25s ease-out',
        slideUp: 'slideUp 0.35s ease-out',
      },
    },
  },
  plugins: [],
}
