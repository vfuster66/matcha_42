"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/setup.ts
const dotenv_1 = __importDefault(require("dotenv"));
const globals_1 = require("@jest/globals");
(0, globals_1.afterEach)(() => {
    jest.clearAllMocks();
});
// Configuration de l'environnement de test
dotenv_1.default.config({ path: '.env.test' });
// Reset tous les mocks après chaque test
(0, globals_1.afterEach)(() => {
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
