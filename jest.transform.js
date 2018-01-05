require("babel-core/register");
require("babel-polyfill");
require('regenerator-runtime/runtime');

module.exports = require('babel-jest').createTransformer({
  presets: ['flow', 'es2015', 'stage-1'], // or whatever you need
  plugins: [
    ["transform-async-to-generator"],
    ["transform-runtime", {
      "polyfill": true,
      "regenerator": true
    }]
  ]
});