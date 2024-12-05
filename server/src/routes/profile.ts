import { Router, Request, Response, NextFunction } from 'express';
import { ProfileController, CustomRequest } from '../controllers/profile';
import { uploadConfig } from '../config/upload';
import { PhotoController } from '../controllers/photo';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Création de wrappers avec le bon typage
const getProfileHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await ProfileController.getProfile(req as CustomRequest, res);
  } catch (error) {
    next(error);
  }
};

const updateProfileHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await ProfileController.updateProfile(req as CustomRequest, res);
  } catch (error) {
    next(error);
  }
};

// Routes
router.get('/', authMiddleware, getProfileHandler);
router.put('/', authMiddleware, updateProfileHandler);

router.post(
  '/photos',
  authMiddleware,
  uploadConfig.single('photo'),
  PhotoController.uploadPhoto
);

router.put(
  '/photos/:photoId/primary',
  authMiddleware,
  PhotoController.setPrimaryPhoto
);

router.delete(
  '/photos/:photoId',
  authMiddleware,
  PhotoController.deletePhoto
);

export default router;
