module.exports = {
  extends: [`${__dirname}/../../config/eslint/eslintrc.cjs`],
  parserOptions: {
    project: `${__dirname}/eslint-tsconfig.json`,
    sourceType: "module",
  },
};
