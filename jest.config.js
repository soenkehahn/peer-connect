/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  transform: {
    "^.+\\.tsx?$": [
      "esbuild-jest",
      {
        sourcemap: true,
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  testEnvironment: "jsdom",
};

module.exports = config;
