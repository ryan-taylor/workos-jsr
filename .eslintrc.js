module.exports = {
  plugins: ['deno'],
  extends: ['plugin:deno/recommended'],
  env: { 'deno/globals': true },
  rules: {
    quotes: ['error', 'single'],
  },
}; 