/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@csstools/postcss-global-data': {
      files: [
        'node_modules/@nolli/ui/src/styles/global.css',
      ],
    },
    'postcss-custom-properties': { preserve: false },
    'postcss-custom-media': { preserve: false },
  },
}

export default config
