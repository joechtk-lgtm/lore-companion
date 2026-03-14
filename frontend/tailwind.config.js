/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0e0d0b',
        surface: '#111009',
        card: '#16130a',
        border: '#2e2614',
        accent: '#c9a84c',
        'text-primary': '#e8dfc0',
        'text-secondary': '#9a9070',
        'text-muted': '#5a5540',
        'text-ghost': '#3a3520',
        'bubble-user': '#1c180c',
        'bubble-border': '#2e2614',
        'answer-bg': '#0e0d0b',
        'answer-border': '#1e1c14',
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        body: ['Crimson Pro', 'serif'],
      },
      borderRadius: {
        card: '12px',
        pill: '20px',
        phone: '36px',
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
}
