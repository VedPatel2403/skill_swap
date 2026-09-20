/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffaf0',
          100: '#fef3c7',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#faa121',
          500: '#f97316',
          600: '#e05504',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        brand: {
          cream: '#FEF8E0',
          sand: '#F0ECC7',
          terracotta: '#E05504',
          amber: '#FAA121',
          sage: '#AFDFB5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
