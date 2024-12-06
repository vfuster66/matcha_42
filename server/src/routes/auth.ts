import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth';
import { validateRequest } from '../middleware/validation';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
 try {
   return await AuthController.register(req, res);
 } catch (error) {
   next(error);
   return;
 }
};

const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
 try {
   return await AuthController.login(req, res); 
 } catch (error) {
   next(error);
   return;
 }
};

router.post('/register',
 validateRequest(registerSchema),
 registerHandler
);

router.post('/login', 
 validateRequest(loginSchema),
 loginHandler
);

export default router;