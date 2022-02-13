module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  plugins: ["prettier", "jest", "boundaries", "no-only-tests", "import", "mocha"],
  extends: [
    "prettier",
    "plugin:jest/recommended",
    "plugin:boundaries/strict",
    "plugin:mocha/recommended",
    "plugin:import/recommended",
  ],
  settings: {
    jest: {
      version: require("jest/package.json").version,
    },
    "boundaries/include": ["src/**/*"],
    "boundaries/elements": [
      {
        type: "support",
        pattern: "src/support/*",
        mode: "full",
        capture: ["elementName"],
      },
      {
        type: "exif",
        pattern: "src/exif",
        mode: "folder",
      },
      {
        type: "reports",
        pattern: "src/reports",
        mode: "folder",
      },
      {
        type: "assistant",
        pattern: "src/assistant",
        mode: "folder",
      },
      {
        type: "program",
        pattern: "src/program.js",
        mode: "full",
      },
      {
        type: "runner",
        pattern: "src/run.js",
        mode: "full",
      },
    ],
    "import/resolver": {
      "eslint-import-resolver-node": {},
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
    "boundaries/element-types": [
      2,
      {
        default: "disallow",
        rules: [
          // TODO. Migrate to ESM and define rules https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
        ],
      },
    ],
    "no-shadow": [2, { builtinGlobals: true, hoist: "all" }],
    "no-undef": "error",
    "no-unused-vars": ["error", { vars: "all", args: "after-used", ignoreRestSiblings: false }],
    "mocha/no-setup-in-describe": [0],
    "mocha/no-mocha-arrows": [0],
    "no-only-tests/no-only-tests": [2],
    "jest/expect-expect": [0], // Some expects are in functions
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
    {
      files: ["src/**/*.js"],
      rules: {
        "no-shadow": [
          2,
          { builtinGlobals: true, hoist: "all", allow: ["before", "after", "run"] },
        ],
      },
    },
  ],
};
