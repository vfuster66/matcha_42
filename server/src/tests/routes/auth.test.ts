// src/tests/routes/auth.test.ts
import request from 'supertest';
import express, { Application } from 'express';
import authRoutes from '../../routes/auth';
import { AuthController } from '../../controllers/auth';

jest.mock('../../controllers/auth');

const app: Application = express();
app.use(express.json());
app.use('/auth', authRoutes);

// Middleware d'erreur simulé pour les tests
app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should call AuthController.register and return 201 on success', async () => {
      (AuthController.register as jest.Mock).mockImplementation(
        async (req, res) => {
          res.status(201).json({ message: 'User registered' });
        }
      );

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(AuthController.register).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'User registered' });
    });

    it('should return 500 if AuthController.register throws an error', async () => {
      (AuthController.register as jest.Mock).mockImplementation(() => {
        throw new Error('Internal Server Error');
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(AuthController.register).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('POST /auth/login', () => {
    it('should call AuthController.login and return 200 on success', async () => {
      (AuthController.login as jest.Mock).mockImplementation(async (req, res) => {
        res.status(200).json({ message: 'Login successful', token: 'mock-token' });
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(AuthController.login).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Login successful',
        token: 'mock-token',
      });
    });

    it('should return 500 if AuthController.login throws an error', async () => {
      (AuthController.login as jest.Mock).mockImplementation(() => {
        throw new Error('Internal Server Error');
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(AuthController.login).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });
});
