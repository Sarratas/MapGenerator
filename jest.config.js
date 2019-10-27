module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverageFrom : ["src/*.ts", "!src/index.ts"],
};