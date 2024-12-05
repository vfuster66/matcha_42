// src/controllers/photo.ts
import { Request, Response } from 'express';
import { User } from '../types';
import { PhotoService } from '../services/photo';
import { ProfileModel } from '../models/Profile';

interface CustomRequest extends Request {
 user?: {
   id: string;
 };
}

export class PhotoController {
 static async uploadPhoto(req: CustomRequest, res: Response): Promise<void> {
   try {
     if (!req.file) {
       res.status(400).json({ error: 'No file provided' });
       return;
     }

     const userId = req.user?.id;
     if (!userId) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
     }

     const photos = await ProfileModel.getPhotos(userId);
     const isPrimary = photos.length === 0; // Premier photo = photo principale

     const result = await PhotoService.processAndSavePhoto(
       userId,
       req.file,
       isPrimary
     );

     res.json({
       message: 'Photo uploaded successfully',
       photo: result
     });
   } catch (error) {
     if (error instanceof Error) {
       res.status(400).json({ error: error.message });
     } else {
       res.status(500).json({ error: 'Internal server error' });
     }
   }
 }

 static async setPrimaryPhoto(req: CustomRequest, res: Response): Promise<void> {
   try {
     const userId = req.user?.id;
     const { photoId } = req.params;

     if (!userId) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
     }

     if (!photoId) {
       res.status(400).json({ error: 'Photo ID is required' });
       return;
     }

     await ProfileModel.setPrimaryPhoto(userId, photoId);

     res.json({
       message: 'Primary photo updated successfully'
     });
   } catch (error) {
     if (error instanceof Error) {
       res.status(400).json({ error: error.message });
     } else {
       res.status(500).json({ error: 'Internal server error' });
     }
   }
 }

 static async deletePhoto(req: CustomRequest, res: Response): Promise<void> {
   try {
     const userId = req.user?.id;
     const { photoId } = req.params;

     if (!userId) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
     }

     if (!photoId) {
       res.status(400).json({ error: 'Photo ID is required' });
       return;
     }

     await PhotoService.deletePhoto(userId, photoId);

     res.json({
       message: 'Photo deleted successfully'
     });
   } catch (error) {
     if (error instanceof Error) {
       res.status(400).json({ error: error.message });
     } else {
       res.status(500).json({ error: 'Internal server error' });
     }
   }
 }

 static async getPhotos(req: CustomRequest, res: Response): Promise<void> {
   try {
     const userId = req.user?.id;

     if (!userId) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
     }

     const photos = await ProfileModel.getPhotos(userId);

     res.json({
       photos
     });
   } catch (error) {
     if (error instanceof Error) {
       res.status(400).json({ error: error.message });
     } else {
       res.status(500).json({ error: 'Internal server error' });
     }
   }
 }
}