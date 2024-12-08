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
  (req, res, next) => {
    uploadConfig.single('photo')(req, res, (err) => {
      if (err) {
        // Gestion des erreurs spécifiques Multer
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(500).json({ error: 'File too large' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(500).json({ error: 'Unexpected field' });
        }
        // Gestion des erreurs générales
        if (err.message) {
          return res.status(500).json({ error: err.message });
        }
        // Erreur inconnue
        return res.status(500).json({ error: 'An unknown error occurred.' });
      }
      next(); // Continue vers PhotoController.uploadPhoto
    });
  },
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
