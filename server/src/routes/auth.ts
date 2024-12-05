// server/src/routes/auth.ts
import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth';

const router = Router();

// Création de wrappers avec le bon typage
const registerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await AuthController.register(req, res);
  } catch (error) {
    next(error);
  }
};

const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await AuthController.login(req, res);
  } catch (error) {
    next(error);
  }
};

// Utilisation des wrappers comme handlers de route
router.post('/register', registerHandler);
router.post('/login', loginHandler);

export default router;