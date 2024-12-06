// server/src/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import { Express } from 'express';

export const configureSecurityMiddleware = (app: Express) => {
    app.use(helmet());
    app.use(xss());
    app.disable('x-powered-by');

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests, please try again later'
    });

    app.use('/api/', limiter);

    // Limiter spécifique pour l'authentification
    const authLimiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 5,
        message: 'Too many login attempts, please try again later'
    });

    app.use('/api/auth/login', authLimiter);
};