// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const NO_COVERAGE_REQUIRED = {
  functions: 0,
  branches: 0,
  statements: 0,
  lines: 0,
};

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ["src/**"],

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    "./src/run.js": NO_COVERAGE_REQUIRED,
    "./src/program.js": NO_COVERAGE_REQUIRED,
  },

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The glob patterns Jest uses to detect test files
  testMatch: ["<rootDir>/test/unit/**/*.spec.js"],
  // testMatch: ["<rootDir>/test/unit/**/tableFormats.spec.js"],
};
