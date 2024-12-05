// src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';

interface Error {
  status?: number;
  message?: string;
  stack?: string;
}

config();
const app: Express = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Middleware pour les routes non trouvées (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Gestion des erreurs
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Something broke!' 
  });
});

// Ne démarrer le serveur que si nous ne sommes pas en mode test
if (process.env.NODE_ENV !== 'test') {
  const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;