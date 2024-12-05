// src/controllers/profile.ts
import { Request, Response } from 'express';
import { ProfileModel } from '../models/Profile';
import { profileSchema } from '../utils/validators';

// Interface déplacée en haut pour meilleure lisibilité
export interface CustomRequest extends Request {  // Ajout de 'export' si nécessaire ailleurs
  user?: {
    id: string;
  };
}

export class ProfileController {
  static async updateProfile(req: CustomRequest, res: Response): Promise<void> {
    try {
      const validatedData = profileSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      let profile = await ProfileModel.findByUserId(userId);
      if (!profile) {
        profile = await ProfileModel.create(userId, {
          ...validatedData,
          birth_date: new Date(validatedData.birth_date)
        });
      } else {
        profile = await ProfileModel.update(userId, {
          ...validatedData,
          birth_date: new Date(validatedData.birth_date)
        });
      }

      // Gérer les intérêts
      const currentInterests = await ProfileModel.getInterests(userId);
      const newInterests = validatedData.interests || [];

      // Supprimer les intérêts qui ne sont plus présents
      for (const interest of currentInterests) {
        if (!newInterests.includes(interest)) {
          await ProfileModel.removeInterest(userId, interest);
        }
      }

      // Ajouter les nouveaux intérêts
      for (const interest of newInterests) {
        if (!currentInterests.includes(interest)) {
          await ProfileModel.addInterest(userId, interest);
        }
      }

      const updatedInterests = await ProfileModel.getInterests(userId);

      res.json({
        profile: {
          ...profile,
          interests: updatedInterests
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;  // Ajout du return pour éviter la double réponse
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getProfile(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const profile = await ProfileModel.findByUserId(userId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const interests = await ProfileModel.getInterests(userId);

      res.json({
        profile: {
          ...profile,
          interests
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default ProfileController;  // Ajout d'un export par défaut