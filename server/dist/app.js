"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = require("dotenv");
const http_1 = require("http");
const auth_1 = __importDefault(require("./routes/auth"));
const profile_1 = __importDefault(require("./routes/profile"));
const chat_1 = require("./services/chat");
const security_1 = require("./middleware/security");
// Configuration des variables d'environnement
(0, dotenv_1.config)();
// Création de l'application et du serveur
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Initialisation des services
const chatService = new chat_1.ChatService(server);
// Middlewares globaux
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
(0, security_1.configureSecurityMiddleware)(app);
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)({
    threshold: 0, // Compresse toutes les réponses, même celles inférieures à 1 Ko
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes API
app.use('/api/auth', auth_1.default);
app.use('/api/profile', profile_1.default);
// Route pour tester la compression (à retirer en production)
app.get('/test-compression', (req, res) => {
    res.send('Compression test');
});
app.get('/test-error', () => {
    throw 'Non-standard error'; // Simule une erreur non-standard
});
// Gestion des erreurs pour les routes inexistantes
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Something broke!'
    });
});
app.use((err, req, res, next) => {
    console.error(err);
    if (typeof err === 'string') {
        res.status(500).json({ error: 'Something broke!' });
    }
    else if (err instanceof Error) {
        res.status(err.status || 500).json({ error: err.message });
    }
    else {
        res.status(500).json({ error: 'Unknown error occurred' });
    }
});
// Démarrage du serveur si l'environnement n'est pas en mode test
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
exports.default = app;
