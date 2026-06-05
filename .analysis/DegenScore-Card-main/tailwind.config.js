module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neonCyan: '#5eead4',
        neonPurple: '#a78bfa',
        neonPink: '#ff6fd8',
        darkBg: '#020617',
      },
      boxShadow: {
        'neon-lg': '0 10px 60px rgba(80, 32, 160, 0.35)',
      },
    },
  },
  plugins: [],
};
