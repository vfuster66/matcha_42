// src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';
import { createServer } from 'http';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import { ChatService } from './services/chat';
import { configureSecurityMiddleware } from './middleware/security';

// Configuration des variables d'environnement
config();

// Création de l'application et du serveur
const app: Express = express();
const server = createServer(app);

// Initialisation des services
const chatService = new ChatService(server);

// Middlewares globaux
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

configureSecurityMiddleware(app);
app.use(helmet());
app.use(
  compression({
      threshold: 0, // Compresse toutes les réponses, même celles inférieures à 1 Ko
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Route pour tester la compression (à retirer en production)
app.get('/test-compression', (req: Request, res: Response) => {
    res.send('Compression test');
});

app.get('/test-error', () => {
  throw 'Non-standard error'; // Simule une erreur non-standard
});

// Gestion des erreurs pour les routes inexistantes
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

// Middleware global de gestion des erreurs
interface CustomError extends Error {
    status?: number;
}

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Something broke!'
    });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (typeof err === 'string') {
      res.status(500).json({ error: 'Something broke!' });
  } else if (err instanceof Error) {
      res.status((err as CustomError).status || 500).json({ error: err.message });
  } else {
      res.status(500).json({ error: 'Unknown error occurred' });
  }
});

// Démarrage du serveur si l'environnement n'est pas en mode test
if (process.env.NODE_ENV !== 'test') {
    const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
