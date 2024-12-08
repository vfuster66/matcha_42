import express, { Express, Request, Response } from 'express';
import request from 'supertest';
import { configureSecurityMiddleware } from '../../middleware/security';

describe('Security Middleware', () => {
    let app: Express;

    beforeEach(() => {
        // Initialiser l'application Express
        app = express();

        // Appliquer le middleware de sécurité
        configureSecurityMiddleware(app);

        // Ajouter des routes pour les tests
        app.get('/test-helmet', (_req: Request, res: Response) => {
            res.status(200).send('Helmet applied');
        });

        app.get('/test-xss', (_req: Request, res: Response) => {
            res.status(200).send('XSS clean applied');
        });

        app.get('/api/test-rate-limit', (_req: Request, res: Response) => {
            res.status(200).send('Rate limit test');
        });

        app.post('/api/auth/login', (_req: Request, res: Response) => {
            res.status(200).send('Login attempt');
        });
    });

    it('should apply helmet middleware', async () => {
        const response = await request(app).get('/test-helmet');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Helmet applied');
    });

    it('should apply XSS clean middleware', async () => {
        const response = await request(app).get('/test-xss');
        expect(response.status).toBe(200);
        expect(response.text).toBe('XSS clean applied');
    });

    it('should disable X-Powered-By header', async () => {
        const response = await request(app).get('/test-xss');
        expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should limit general API requests', async () => {
        const response = await request(app).get('/api/test-rate-limit');
        expect(response.status).toBe(200);
    });

    it('should block excessive general API requests', async () => {
        for (let i = 0; i < 101; i++) {
            await request(app).get('/api/test-rate-limit');
        }
        const response = await request(app).get('/api/test-rate-limit');
        expect(response.status).toBe(429);
        expect(response.body.message).toBe('Too many requests, please try again later');
    });
    
    it('should limit authentication requests', async () => {
        for (let i = 0; i < 5; i++) {
            await request(app).post('/api/auth/login');
        }
        const response = await request(app).post('/api/auth/login');
        expect(response.status).toBe(429);
        expect(response.body.message).toBe('Too many login attempts, please try again later');
    });
    
});
