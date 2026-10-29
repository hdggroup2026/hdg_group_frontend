/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    // MỤC 718 (29/10/2026) — G1: lớp `bg-hdg-card`, `text-hdg-primary`… trỏ vào biến
    // của src/design/tokens.css. CHỈ THÊM lớp mới — lớp Tailwind cũ không đổi gì.
    extend: {
      colors: {
        hdg: {
          primary: 'var(--hdg-primary)',
          bg: 'var(--hdg-bg)',
          card: 'var(--hdg-card)',
          border: 'var(--hdg-border)',
          text: 'var(--hdg-text)',
          muted: 'var(--hdg-text-muted)',
          gold: 'var(--hdg-gold)',
          success: 'var(--hdg-success)',
          warning: 'var(--hdg-warning)',
          danger: 'var(--hdg-danger)',
          info: 'var(--hdg-info)',
        },
      },
      borderRadius: { 'hdg-control': '9px', 'hdg-card': '14px' },
    },
  },
  plugins: [],
}