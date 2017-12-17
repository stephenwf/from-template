var nodeExternals = require('webpack-node-externals');

module.exports = {
  type: 'web-module',
  npm: {
    esModules: false,
    umd: false
  },
  babel: {
    plugins: ['transform-runtime']
  },
  webpack: {
    extra: {
      target: 'node',
      externals: [nodeExternals()],
    }
  }
}
