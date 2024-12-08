import request from 'supertest';
import express, { Application } from 'express';
import authRoutes from '../../routes/auth';
import { AuthController } from '../../controllers/auth';
import { validateRequest } from '../../middleware/validation';

// Mock des dépendances
jest.mock('../../controllers/auth', () => ({
    AuthController: {
        register: jest.fn(),
        login: jest.fn()
    }
}));

// Mock du middleware de validation
jest.mock('../../middleware/validation', () => ({
    validateRequest: () => (req: any, res: any, next: any) => next()
}));

const app: Application = express();
app.use(express.json());
app.use('/auth', authRoutes);

// Middleware d'erreur pour les tests
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
            (AuthController.register as jest.Mock) = mockRegister;

            const response = await request(app)
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
            (AuthController.register as jest.Mock) = mockRegister;

            const response = await request(app)
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
            (AuthController.login as jest.Mock) = mockLogin;

            const response = await request(app)
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
            (AuthController.login as jest.Mock) = mockLogin;

            const response = await request(app)
                .post('/auth/login')
                .send(loginData);

            expect(mockLogin).toHaveBeenCalled();
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal Server Error' });
        });
    });
});