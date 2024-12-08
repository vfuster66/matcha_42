"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureSecurityMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const xss_clean_1 = __importDefault(require("xss-clean"));
const configureSecurityMiddleware = (app) => {
    app.use((0, helmet_1.default)());
    app.use((0, xss_clean_1.default)());
    app.disable('x-powered-by');
    // Middleware de limitation générale
    const limiter = (0, express_rate_limit_1.default)({
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
    const authLimiter = (0, express_rate_limit_1.default)({
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
exports.configureSecurityMiddleware = configureSecurityMiddleware;
