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

interface Error {
    status?: number;
    message?: string;
    stack?: string;
}

config();
const app: Express = express();
const server = createServer(app);
const chatService = new ChatService(server);

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

configureSecurityMiddleware(app);
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Error Handling
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Something broke!'
    });
});

// Server
if (process.env.NODE_ENV !== 'test') {
    const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;