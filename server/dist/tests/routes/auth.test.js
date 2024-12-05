"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/routes/auth.test.ts
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../routes/auth"));
const auth_2 = require("../../controllers/auth");
jest.mock('../../controllers/auth');
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/auth', auth_1.default);
// Middleware d'erreur simulé pour les tests
app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});
describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /auth/register', () => {
        it('should call AuthController.register and return 201 on success', async () => {
            auth_2.AuthController.register.mockImplementation(async (req, res) => {
                res.status(201).json({ message: 'User registered' });
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123!',
            });
            expect(auth_2.AuthController.register).toHaveBeenCalled();
            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: 'User registered' });
        });
        it('should return 500 if AuthController.register throws an error', async () => {
            auth_2.AuthController.register.mockImplementation(() => {
                throw new Error('Internal Server Error');
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123!',
            });
            expect(auth_2.AuthController.register).toHaveBeenCalled();
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal Server Error' });
        });
    });
    describe('POST /auth/login', () => {
        it('should call AuthController.login and return 200 on success', async () => {
            auth_2.AuthController.login.mockImplementation(async (req, res) => {
                res.status(200).json({ message: 'Login successful', token: 'mock-token' });
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({
                email: 'test@example.com',
                password: 'Password123!',
            });
            expect(auth_2.AuthController.login).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Login successful',
                token: 'mock-token',
            });
        });
        it('should return 500 if AuthController.login throws an error', async () => {
            auth_2.AuthController.login.mockImplementation(() => {
                throw new Error('Internal Server Error');
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({
                email: 'test@example.com',
                password: 'Password123!',
            });
            expect(auth_2.AuthController.login).toHaveBeenCalled();
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal Server Error' });
        });
    });
});
