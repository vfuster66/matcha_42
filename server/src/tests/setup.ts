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
global.console = {
  ...console,
  // Désactiver les logs pendant les tests
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};