module.exports = {
  env: {
    es2021: true,
    node: true,
    mocha: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        offsetTernaryExpressions: true,
      },
    ],
    quotes: ['error', 'single', { avoidEscape: true }],
    semi: ['error', 'always'],
    'no-console': 0,
  },
};
