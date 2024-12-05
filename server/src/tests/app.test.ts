// src/tests/app.test.ts
import request from 'supertest';
import app from '../app';
import { AuthController } from '../controllers/auth';

jest.mock('../controllers/auth');

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Global Error Handling', () => {
    it('should return 404 for an unknown route', async () => {
      const response = await request(app).get('/unknown-route');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not Found'
      });
    });

    it('should handle errors thrown in routes', async () => {
      const errorMessage = 'Test error';
      (AuthController.register as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(AuthController.register).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: errorMessage
      });
    });
  });
});