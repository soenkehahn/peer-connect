/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      tsconfig: {
        noUnusedParameters: false,
      },
    },
  },
};
