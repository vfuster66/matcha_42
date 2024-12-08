// src/tests/auth.test.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthController } from '../../controllers/auth';
import { UserModel } from '../../models/User';
import { sendVerificationEmail } from '../../services/email';
import { registerSchema, loginSchema } from '../../utils/validators';

// Mock des dépendances
jest.mock('../../models/User');
jest.mock('../../services/email');
jest.mock('jsonwebtoken');
jest.mock('../../utils/validators');

describe('AuthController', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let responseObject: { user?: any; token?: string; error?: string; message?: string } = {};

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
			(registerSchema.parse as jest.Mock).mockReturnValue(mockRequest.body);
			// Mock du token par défaut
			(jwt.sign as jest.Mock).mockReturnValue('mock_token');
		});

		it('should handle non-Error objects in catch', async () => {
			(UserModel.create as jest.Mock).mockRejectedValue('Non-Error object');

			await AuthController.register(mockRequest as Request, mockResponse as Response);

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

			(UserModel.create as jest.Mock).mockResolvedValue(mockUser);
			(sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

			await AuthController.register(mockRequest as Request, mockResponse as Response);

			expect(registerSchema.parse).toHaveBeenCalledWith(mockRequest.body);
			expect(UserModel.create).toHaveBeenCalledWith(
				'testuser',
				'test@example.com',
				'Password123!'
			);
			expect(jwt.sign).toHaveBeenCalledWith(
				{ id: mockUser.id },
				process.env.JWT_SECRET,
				{ expiresIn: '24h' }
			);
			expect(sendVerificationEmail).toHaveBeenCalledWith(
				'test@example.com',
				'mock_token'
			);
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
			(registerSchema.parse as jest.Mock).mockImplementation(() => {
				throw validationError;
			});

			await AuthController.register(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(responseObject).toMatchObject({
				error: 'Validation failed'
			});
			expect(UserModel.create).not.toHaveBeenCalled();
		});

		it('should handle email sending failure', async () => {
			const mockUser = {
				id: '123',
				username: 'testuser',
				email: 'test@example.com',
				is_verified: false,
			};

			(UserModel.create as jest.Mock).mockResolvedValue(mockUser);
			(sendVerificationEmail as jest.Mock).mockRejectedValue(new Error('Email sending failed'));

			await AuthController.register(mockRequest as Request, mockResponse as Response);

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

			(UserModel.create as jest.Mock).mockResolvedValue(mockUser);
			(jwt.sign as jest.Mock).mockImplementation(() => {
				throw new Error('JWT signing failed');
			});

			await AuthController.register(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(responseObject).toMatchObject({
				error: 'Internal server error',
			});
		});
	});

	describe('login', () => {
		beforeEach(() => {
			// Mock de la validation par défaut
			(loginSchema.parse as jest.Mock).mockReturnValue({
				email: 'test@example.com',
				password: 'Password123!'
			});
			// Mock du token par défaut
			(jwt.sign as jest.Mock).mockReturnValue('mock_token');
		});

		it('should handle invalid credentials with non-existing user', async () => {
			(UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

			await AuthController.login(mockRequest as Request, mockResponse as Response);

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

			(UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
			(UserModel.verifyPassword as jest.Mock).mockResolvedValue(false);

			await AuthController.login(mockRequest as Request, mockResponse as Response);

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

			(UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
			(UserModel.verifyPassword as jest.Mock).mockResolvedValue(true);

			await AuthController.login(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(responseObject).toMatchObject({
				error: 'Please verify your email first'
			});
		});

		it('should handle non-Error objects in catch for login', async () => {
			(UserModel.findByEmail as jest.Mock).mockRejectedValue('Non-Error object');

			await AuthController.login(mockRequest as Request, mockResponse as Response);

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

			(UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
			(UserModel.verifyPassword as jest.Mock).mockResolvedValue(true);

			await AuthController.login(mockRequest as Request, mockResponse as Response);

			expect(loginSchema.parse).toHaveBeenCalledWith(mockRequest.body);
			expect(UserModel.findByEmail).toHaveBeenCalledWith('test@example.com');
			expect(UserModel.verifyPassword).toHaveBeenCalledWith(
				'test@example.com',
				'Password123!'
			);
			expect(jwt.sign).toHaveBeenCalledWith(
				{ id: mockUser.id },
				process.env.JWT_SECRET,
				{ expiresIn: '24h' }
			);
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

			(UserModel.create as jest.Mock).mockResolvedValue(mockUser);
			(sendVerificationEmail as jest.Mock).mockRejectedValue(new Error('Email sending failed'));

			await AuthController.register(mockRequest as Request, mockResponse as Response);

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

			(UserModel.create as jest.Mock).mockResolvedValue(mockUser);
			(jwt.sign as jest.Mock).mockImplementation(() => {
				throw new Error('JWT signing failed');
			});

			await AuthController.register(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(responseObject).toMatchObject({
				error: 'Internal server error',
			});
		});

		it('should handle database errors', async () => {
			(UserModel.findByEmail as jest.Mock).mockRejectedValue(new Error('Database error'));

			await AuthController.login(mockRequest as Request, mockResponse as Response);

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

			(UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
			(UserModel.verifyPassword as jest.Mock).mockRejectedValue(new Error('Verification failed'));

			await AuthController.login(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(responseObject).toMatchObject({
				error: 'Internal server error',
			});
		});
	});
});