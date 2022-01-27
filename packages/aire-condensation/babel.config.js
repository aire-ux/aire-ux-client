module.exports = {
  env: {
    test: {
      plugins: ["transform-es2015-modules-commonjs"]
    }

  },
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
};