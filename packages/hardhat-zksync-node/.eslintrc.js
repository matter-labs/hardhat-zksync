module.exports = {
  extends: [`${__dirname}/../../config/eslint/eslintrc.cjs`],
  parserOptions: {
    project: `${__dirname}/eslint-tsconfig.json`,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "property",
        "format": ["camelCase", "PascalCase", "snake_case"],
        "leadingUnderscore": "allow",
        "filter": {
          "regex": "^[a-zA-Z0-9-_]+$",
          "match": false
        }
      },
    ],
  },
};
