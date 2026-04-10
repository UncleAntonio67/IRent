/** @type {import('tailwindcss').Config} */
function extractSafeCandidates(content) {
  // WXSS (WeChat) does not support escaped selectors, so we only allow
  // "safe" class candidates that never require escaping.
  // This also prevents Tailwind from accidentally picking up `!block` from JS expressions.
  return content.match(/[A-Za-z0-9_-]+/g) || []
}

module.exports = {
  content: {
    files: ['./index.html', './src/**/*.{vue,js,ts}'],
    extract: {
      DEFAULT: extractSafeCandidates,
    },
  },
  theme: {
    extend: {
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        '3xs': ['8px', { lineHeight: '12px' }],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
  corePlugins: {
    preflight: false,
  },
}
