module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        dark: 'var(--color-dark)',
        accent: 'var(--color-accent)',
        bg: 'var(--color-bg)'
      }
    }
  },
  plugins: []
};
