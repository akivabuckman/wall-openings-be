import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                module: 'CommonJS',
                moduleResolution: 'node',
            },
        }],
    },
    moduleNameMapper: {
        '^nanoid$': '<rootDir>/tests/__mocks__/nanoid.js',
    },
};

export default config;
