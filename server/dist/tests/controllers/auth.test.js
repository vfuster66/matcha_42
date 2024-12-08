"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../../controllers/auth");
const User_1 = require("../../models/User");
const email_1 = require("../../services/email");
const validators_1 = require("../../utils/validators");
// Mock des dépendances
jest.mock('../../models/User');
jest.mock('../../services/email');
jest.mock('jsonwebtoken');
jest.mock('../../utils/validators');
describe('AuthController', () => {
    let mockRequest;
    let mockResponse;
    let responseObject = {};
    beforeEach(() => {
        mockRequest = {
            body: {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123!',
                confirmPassword: 'Password123!'
            }
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockImplementation((result) => {
                responseObject = result;
            })
        };
        // Reset des mocks
        jest.clearAllMocks();
    });
    describe('register', () => {
        beforeEach(() => {
            // Mock de la validation par défaut
            validators_1.registerSchema.parse.mockReturnValue(mockRequest.body);
            // Mock du token par défaut
            jsonwebtoken_1.default.sign.mockReturnValue('mock_token');
        });
        it('should handle non-Error objects in catch', async () => {
            User_1.UserModel.create.mockRejectedValue('Non-Error object');
            await auth_1.AuthController.register(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({
                error: 'Internal server error'
            });
        });
        it('should successfully register a new user', async () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                is_verified: false
            };
            User_1.UserModel.create.mockResolvedValue(mockUser);
            email_1.sendVerificationEmail.mockResolvedValue(undefined);
            await auth_1.AuthController.register(mockRequest, mockResponse);
            expect(validators_1.registerSchema.parse).toHaveBeenCalledWith(mockRequest.body);
            expect(User_1.UserModel.create).toHaveBeenCalledWith('testuser', 'test@example.com', 'Password123!');
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ id: mockUser.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            expect(email_1.sendVerificationEmail).toHaveBeenCalledWith('test@example.com', 'mock_token');
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(responseObject).toMatchObject({
                message: expect.any(String),
                user: expect.objectContaining({
                    id: mockUser.id,
                    username: mockUser.username,
                    email: mockUser.email
                })
            });
        });
        it('should handle validation errors', async () => {
            const validationError = new Error('Validation failed');
            validators_1.registerSchema.parse.mockImplementation(() => {
                throw validationError;
            });
            await auth_1.AuthController.register(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject).toMatchObject({
                error: 'Validation failed'
            });
            expect(User_1.UserModel.create).not.toHaveBeenCalled();
        });
        it('should handle email sending failure', async () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                is_verified: false,
            };
            User_1.UserModel.create.mockResolvedValue(mockUser);
            email_1.sendVerificationEmail.mockRejectedValue(new Error('Email sending failed'));
            await auth_1.AuthController.register(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject).toMatchObject({
                error: 'Email sending failed',
            });
        });
        it('should handle JWT signing errors', async () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                is_verified: false,
            };
            User_1.UserModel.create.mockResolvedValue(mockUser);
            jsonwebtoken_1.default.sign.mockImplementation(() => {
                throw new Error('JWT signing failed');
            });
            await auth_1.AuthController.register(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({
                error: 'Internal server error',
            });
        });
    });
    describe('login', () => {
        beforeEach(() => {
            // Mock de la validation par défaut
            validators_1.loginSchema.parse.mockReturnValue({
                email: 'test@example.com',
                password: 'Password123!'
            });
            // Mock du token par défaut
            jsonwebtoken_1.default.sign.mockReturnValue('mock_token');
        });
        it('should handle invalid credentials with non-existing user', async () => {
            User_1.UserModel.findByEmail.mockResolvedValue(null);
            await auth_1.AuthController.login(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(responseObject).toMatchObject({
                error: 'Invalid credentials'
            });
        });
        it('should handle invalid password', async () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                is_verified: true
            };
            User_1.UserModel.findByEmail.mockResolvedValue(mockUser);
            User_1.UserModel.verifyPassword.mockResolvedValue(false);
            await auth_1.AuthController.login(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(responseObject).toMatchObject({
                error: 'Invalid credentials'
            });
        });
        it('should handle unverified user', async () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                is_verified: false
            };
            User_1.UserModel.findByEmail.mockResolvedValue(mockUser);
            User_1.UserModel.verifyPassword.mockResolvedValue(true);
            await auth_1.AuthController.login(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(responseObject).toMatchObject({
                error: 'Please verify your email first'
            });
        });
        it('should handle non-Error objects in catch for login', async () => {
            User_1.UserModel.findByEmail.mockRejectedValue('Non-Error object');
            await auth_1.AuthController.login(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({
                error: 'Internal server error'
            });
        });
        it('should successfully log in a verified user', async () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                is_verified: true
            };
            User_1.UserModel.findByEmail.mockResolvedValue(mockUser);
            User_1.UserModel.verifyPassword.mockResolvedValue(true);
            await auth_1.AuthController.login(mockRequest, mockResponse);
            expect(validators_1.loginSchema.parse).toHaveBeenCalledWith(mockRequest.body);
            expect(User_1.UserModel.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(User_1.UserModel.verifyPassword).toHaveBeenCalledWith('test@example.com', 'Password123!');
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ id: mockUser.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            expect(responseObject).toMatchObject({
                message: 'Login successful',
                token: 'mock_token',
                user: expect.objectContaining({
                    id: mockUser.id,
                    username: mockUser.username,
                    email: mockUser.email
                })
            });
        });
        it('should handle email sending failure', async () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                is_verified: false
            };
            User_1.UserModel.create.mockResolvedValue(mockUser);
            email_1.sendVerificationEmail.mockRejectedValue(new Error('Email sending failed'));
            await auth_1.AuthController.register(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseObject).toMatchObject({
                error: 'Email sending failed'
            });
        });
        it('should handle JWT signing errors', async () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                is_verified: false,
            };
            User_1.UserModel.create.mockResolvedValue(mockUser);
            jsonwebtoken_1.default.sign.mockImplementation(() => {
                throw new Error('JWT signing failed');
            });
            await auth_1.AuthController.register(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({
                error: 'Internal server error',
            });
        });
        it('should handle database errors', async () => {
            User_1.UserModel.findByEmail.mockRejectedValue(new Error('Database error'));
            await auth_1.AuthController.login(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({
                error: 'Internal server error',
            });
        });
        it('should handle password verification errors', async () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                is_verified: true,
            };
            User_1.UserModel.findByEmail.mockResolvedValue(mockUser);
            User_1.UserModel.verifyPassword.mockRejectedValue(new Error('Verification failed'));
            await auth_1.AuthController.login(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({
                error: 'Internal server error',
            });
        });
    });
});
