/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'page-gradient': 'radial-gradient(circle at 20% 10%, #fef3c7 0%, #fafaf9 36%, #f5f5f4 100%)',
      },
      boxShadow: {
        soft: '0 16px 36px rgba(28, 25, 23, 0.08)',
      },
    },
  },
  plugins: [],
}

