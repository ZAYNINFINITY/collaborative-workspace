module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "routes/**/*.js",
    "controllers/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "config/**/*.js",
    "services/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  testTimeout: 10000,
  verbose: true,
  maxWorkers: 1,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
