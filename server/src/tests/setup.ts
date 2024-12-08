// src/tests/setup.ts
import dotenv from 'dotenv';
import { afterEach } from '@jest/globals';

afterEach(() => {
  jest.clearAllMocks();
});


// Configuration de l'environnement de test
dotenv.config({ path: '.env.test' });

// Reset tous les mocks après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Configuration globale pour les tests
const isDebugMode = process.env.DEBUG === 'true';

global.console = {
  ...console,
  log: isDebugMode ? console.log : jest.fn(),
  error: isDebugMode ? console.error : jest.fn(),
  warn: isDebugMode ? console.warn : jest.fn(),
  info: isDebugMode ? console.info : jest.fn(),
};
