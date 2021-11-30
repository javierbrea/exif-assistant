module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  plugins: ["prettier", "jest"],
  extends: ["prettier", "plugin:jest/recommended"],
  settings: {
    jest: {
      version: require("jest/package.json").version,
    },
  },
  rules: {
    "prettier/prettier": [
      "error",
      {
        printWidth: 99,
        parser: "flow",
      },
    ],
    "no-shadow": "error",
    "no-undef": "error",
    "no-unused-vars": ["error", { vars: "all", args: "after-used", ignoreRestSiblings: false }],
  },
  overrides: [
    {
      files: ["test/specs/*.spec.js"],
      env: {
        node: true,
        es6: true,
        "jest/globals": true,
      },
    },
  ],
};
