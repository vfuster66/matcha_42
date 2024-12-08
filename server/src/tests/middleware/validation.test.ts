// src/tests/middleware/validation.test.ts
import { validateRequest, errorHandler } from '../../middleware/validation';
import { z as zod } from 'zod';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

describe('Validation Middleware', () => {
    const schema = zod.object({
        username: zod.string().min(3, 'Username must be at least 3 characters'),
        email: zod.string().email('Invalid email format'),
        password: zod.string().min(8, 'Password must be at least 8 characters'),
    });

    let app: express.Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    it('should call next if validation succeeds', async () => {
        const mockHandler = jest.fn((req: Request, res: Response) => {
            res.status(200).json({ message: 'Success' });
        });

        app.post(
            '/test',
            validateRequest(schema),
            mockHandler
        );

        const response = await request(app)
            .post('/test')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123!',
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Success' });
        expect(mockHandler).toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
        app.post('/test', validateRequest(schema));

        const response = await request(app)
            .post('/test')
            .send({
                username: 'tu', // Too short
                email: 'invalidemail',
                password: 'short',
            });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ message: 'Username must be at least 3 characters' }),
                expect.objectContaining({ message: 'Invalid email format' }),
                expect.objectContaining({ message: 'Password must be at least 8 characters' }),
            ])
        );
    });
});

describe('Error Handler Middleware', () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Route de test pour générer des erreurs
        app.get('/test-validation-error', (req: Request, res: Response, next: NextFunction) => {
            const validationError = new Error('Validation error');
            (validationError as any).name = 'ValidationError';
            (validationError as any).errors = [{ message: 'Invalid data' }];
            next(validationError);
        });

        app.get('/test-other-error', (req: Request, res: Response, next: NextFunction) => {
            next(new Error('Unexpected error'));
        });

        app.use(errorHandler);
    });

    it('should return 400 for validation errors', async () => {
        const response = await request(app).get('/test-validation-error');
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.errors).toEqual([{ message: 'Invalid data' }]);
    });

    it('should return 500 for other errors', async () => {
        const response = await request(app).get('/test-other-error');
        expect(response.status).toBe(500);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Internal server error');
    });
});