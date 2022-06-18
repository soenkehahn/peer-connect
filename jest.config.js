/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

module.exports = config;