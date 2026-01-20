module.exports = {
  root: true,
  extends: ["../eslint.base.cjs", "plugin:@typescript-eslint/recommended", "prettier"],
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    parser: "@typescript-eslint/parser",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
  },
};
