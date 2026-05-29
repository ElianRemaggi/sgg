module.exports = function (api) {
  api.cache(false)
  const isTest = process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test'
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: isTest ? 'react' : 'nativewind' }],
      ...(isTest ? [] : ['nativewind/babel']),
    ],
  }
}
