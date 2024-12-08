import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#39AAA8',
          light: '#53C7C5',
          dark: '#2D8E8C',
          pastel: 'rgba(198,245,244,0.25)',
        },
        pink: {
          DEFAULT: '#DD477D',
          light: '#E4709B',
          dark: '#C83E6F',
          pastel: 'rgba(255,210,220,0.25)',
        },
        neutral: {
          white: '#FFFFFF',
          black: '#213547',
        },
      },
      fontFamily: {
        lato: ['Lato', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.375rem',
      },
    },
    backgroundImage: {
      'gradient-green': 'linear-gradient(90deg, rgba(96,224,222,0.5158263134355305) 0%, rgba(198,245,244,1) 100%)',
      'gradient-pink': 'linear-gradient(90deg, rgba(235,136,172,1) 0%, rgba(240,172,197,1) 100%)',
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    function ({ addComponents }: { addComponents: (components: Record<string, any>) => void }) {
      addComponents({
        '.btn': {
          '@apply font-semibold px-6 py-2 rounded-md transition-all duration-300': {}, // Bouton générique
        },
        '.btn-primary': {
          '@apply bg-teal text-white hover:bg-teal-light': {}, // Bouton principal
        },
        '.btn-secondary': {
          '@apply bg-pink text-white hover:bg-pink-light': {}, // Bouton secondaire
        },
        '.btn-outline': {
          '@apply bg-transparent border-2 border-pink text-pink hover:bg-pink-light hover:text-white': {}, // Bouton outline
        },
      });
    },
  ],
} satisfies Config;
