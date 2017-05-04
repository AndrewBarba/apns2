module.exports = {
  "env": {
    "es6": true,
    "node": true,
    "mocha": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
  },
  "globals": {
    "Promise": false
  },
  "rules": {
    "arrow-parens": ["error", "as-needed"],
    "comma-dangle": ["error", "never"],
    "no-restricted-globals": ["error", "Promise"],
    "semi": ["error", "never"],
    "strict": ["error", "never"]
  }
}
