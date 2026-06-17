/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette from the RUKN deck (README §10)
        navy: '#12233D',
        petrol: '#0E5A63',
        amber: '#D98A3D',
        danger: '#C2452F',
        positive: '#3E7C5A',
        surface: {
          0: '#FFFFFF',
          1: '#F6F8F8',
          2: '#EDF1F2',
        },
        ink: {
          DEFAULT: '#12233D',
          soft: '#51606F',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'Calibri', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,35,61,0.04), 0 8px 24px rgba(18,35,61,0.06)',
        lift: '0 8px 30px rgba(18,35,61,0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeup: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.96)' },
          '60%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        fadeup: 'fadeup 0.5s cubic-bezier(0.16,1,0.3,1) both',
        pop: 'pop 0.35s ease-out',
      },
    },
  },
  plugins: [],
}
