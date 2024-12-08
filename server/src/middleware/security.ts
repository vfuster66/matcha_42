import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import { Express } from 'express';

export const configureSecurityMiddleware = (app: Express) => {
    app.use(helmet());
    app.use(xss());
    app.disable('x-powered-by');

    // Middleware de limitation générale
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Nombre maximal de requêtes
        standardHeaders: true, // Inclure les headers standards
        legacyHeaders: false, // Désactiver les anciens headers
        handler: (req, res) => {
            res.status(429).json({
                message: 'Too many requests, please try again later'
            });
        },
    });

    app.use('/api/', limiter);

    // Middleware de limitation pour l'authentification
    const authLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 heure
        max: 5, // Nombre maximal de tentatives de connexion
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                message: 'Too many login attempts, please try again later'
            });
        },
    });

    app.use('/api/auth/login', authLimiter);
};
