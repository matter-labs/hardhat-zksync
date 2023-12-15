module.exports = {
    extends: [`${__dirname}/../../config/eslint/eslintrc.cjs`],
    parserOptions: {
      project: `${__dirname}/tsconfig.json`,
      sourceType: "module",
    },
  };