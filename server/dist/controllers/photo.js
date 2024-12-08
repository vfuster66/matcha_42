"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoController = void 0;
const photo_1 = require("../services/photo");
const Profile_1 = require("../models/Profile");
const fameRating_1 = require("../services/fameRating");
class PhotoController {
    static async uploadPhoto(req, res) {
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
            const photos = await Profile_1.ProfileModel.getPhotos(userId);
            if (photos.length >= 5) {
                res.status(400).json({ error: 'Maximum number of photos (5) reached' });
                return;
            }
            const isPrimary = photos.length === 0; // Premier photo = photo principale
            const result = await photo_1.PhotoService.processAndSavePhoto(userId, req.file, isPrimary);
            await fameRating_1.FameRatingService.updateFameRating(userId);
            res.json({
                message: 'Photo uploaded successfully',
                photo: result
            });
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    static async setPrimaryPhoto(req, res) {
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
            await Profile_1.ProfileModel.setPrimaryPhoto(userId, photoId);
            await fameRating_1.FameRatingService.updateFameRating(userId);
            res.json({
                message: 'Primary photo updated successfully'
            });
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    static async deletePhoto(req, res) {
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
            await photo_1.PhotoService.deletePhoto(userId, photoId);
            await fameRating_1.FameRatingService.updateFameRating(userId);
            res.json({
                message: 'Photo deleted successfully'
            });
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    static async getPhotos(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const photos = await Profile_1.ProfileModel.getPhotos(userId);
            res.json({ photos });
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
}
exports.PhotoController = PhotoController;
