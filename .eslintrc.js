module.exports = {
  env: {
    es6: true,
    node: true,
    mocha: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: '2018',
    sourceType: 'module',
  },
  rules: {
    'arrow-parens': ['error', 'as-needed'],
    'comma-dangle': ['error', 'never'],
    semi: ['error', 'never'],
    strict: ['error', 'never']
  }
}
