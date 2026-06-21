module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.tsx?$': ['@swc/jest'],
    },
    collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/tests/**/*.ts'],
};
