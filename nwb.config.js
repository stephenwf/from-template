var nodeExternals = require('webpack-node-externals');

module.exports = {
  type: 'web-module',
  npm: {
    esModules: false,
    umd: false
  },
  webpack: {
    extra: {
      target: 'node',
      externals: [nodeExternals()],
    }
  }
}
