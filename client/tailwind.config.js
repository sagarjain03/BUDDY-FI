/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm sunset brand, matching the photography used across the app.
        brand: {
          50: '#FFF5ED',
          100: '#FFE8D5',
          200: '#FFCDAA',
          300: '#FFA974',
          400: '#FF7A3C',
          500: '#FF5A1F',
          600: '#F03E06',
          700: '#C72D07',
          800: '#9E260E',
          900: '#7F230F',
        },
        // Deep navy used for text, headers and dark surfaces.
        ink: {
          50: '#F5F6FA',
          100: '#E9EBF2',
          200: '#CFD4E4',
          300: '#A7B0CB',
          400: '#7885AC',
          500: '#586591',
          600: '#454F76',
          700: '#39415F',
          800: '#242A41',
          900: '#141828',
          950: '#0B0E19',
        },
        accent: {
          400: '#3ECFB2',
          500: '#17B79A',
          600: '#0E9280',
        },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20, 24, 40, 0.04), 0 8px 24px rgba(20, 24, 40, 0.08)',
        lift: '0 2px 4px rgba(20, 24, 40, 0.06), 0 16px 40px rgba(20, 24, 40, 0.14)',
        glow: '0 10px 40px -12px rgba(255, 90, 31, 0.55)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.4s ease both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
