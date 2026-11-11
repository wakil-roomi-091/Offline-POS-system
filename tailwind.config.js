/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#3FA9A8',
          hover: '#359392',
          action: '#43AAA9',
          light: '#EBF7F7',
          surface: '#F7F8FA',
          dark: '#2E7C7B',
        },
        dine: {
          50: '#F0F9F9',
          100: '#DDF2F1',
          200: '#BCE4E3',
          300: '#8CD0CE',
          400: '#52B6B4',
          500: '#3FA9A8',
          600: '#2B9695',
          700: '#237877',
          800: '#1D5F5E',
          900: '#184C4C',
        },
        canvas: '#F4F7F9',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
