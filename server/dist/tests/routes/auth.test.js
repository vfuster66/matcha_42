"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../routes/auth"));
const auth_2 = require("../../controllers/auth");
// Mock des dépendances
jest.mock('../../controllers/auth', () => ({
    AuthController: {
        register: jest.fn(),
        login: jest.fn()
    }
}));
// Mock du middleware de validation
jest.mock('../../middleware/validation', () => ({
    validateRequest: () => (req, res, next) => next()
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/auth', auth_1.default);
// Middleware d'erreur pour les tests
app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});
describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /auth/register', () => {
        const registerData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'Password123!',
            confirmPassword: 'Password123!' // Ajouté pour la validation
        };
        it('should call AuthController.register and return 201 on success', async () => {
            const mockRegister = jest.fn().mockImplementation((req, res) => {
                res.status(201).json({ message: 'User registered' });
            });
            auth_2.AuthController.register = mockRegister;
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send(registerData);
            expect(mockRegister).toHaveBeenCalled();
            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: 'User registered' });
        });
        it('should return 500 if AuthController.register throws an error', async () => {
            const mockRegister = jest.fn().mockImplementation(() => {
                throw new Error('Internal Server Error');
            });
            auth_2.AuthController.register = mockRegister;
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send(registerData);
            expect(mockRegister).toHaveBeenCalled();
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal Server Error' });
        });
    });
    describe('POST /auth/login', () => {
        const loginData = {
            email: 'test@example.com',
            password: 'Password123!'
        };
        it('should call AuthController.login and return 200 on success', async () => {
            const mockLogin = jest.fn().mockImplementation((req, res) => {
                res.status(200).json({
                    message: 'Login successful',
                    token: 'mock-token'
                });
            });
            auth_2.AuthController.login = mockLogin;
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send(loginData);
            expect(mockLogin).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Login successful',
                token: 'mock-token'
            });
        });
        it('should return 500 if AuthController.login throws an error', async () => {
            const mockLogin = jest.fn().mockImplementation(() => {
                throw new Error('Internal Server Error');
            });
            auth_2.AuthController.login = mockLogin;
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send(loginData);
            expect(mockLogin).toHaveBeenCalled();
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal Server Error' });
        });
    });
});
