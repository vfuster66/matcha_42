import type { Config } from '@jest/types';
import dotenv from 'dotenv';

// Charger le fichier .env.test
dotenv.config({ path: '.env.test' });

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['./src/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/index.ts',
    '!src/tests/**/*.ts'
  ],
  silent: false,
  verbose: true,
};

export default config;
