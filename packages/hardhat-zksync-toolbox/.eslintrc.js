module.exports = {
  extends: [`${__dirname}/../../config/eslint/eslintrc.cjs`],
  parserOptions: {
    project: `${__dirname}/eslint-tsconfig.json`,
    sourceType: "module",
  },
  overrides: [
    {
      files: ["test/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
      rules: {
        "@typescript-eslint/no-unused-expressions": "off",
      }
    }
  ]
};
