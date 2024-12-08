"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/controllers/photo.test.ts
const photo_1 = require("../../controllers/photo");
const Profile_1 = require("../../models/Profile");
const photo_2 = require("../../services/photo");
const fameRating_1 = require("../../services/fameRating");
jest.mock('../../models/Profile');
jest.mock('../../services/photo');
jest.mock('../../services/fameRating', () => ({
    FameRatingService: {
        updateFameRating: jest.fn(),
    },
}));
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res;
};
const mockRequest = (userId, params, body, file) => ({
    user: userId ? { id: userId } : undefined,
    params,
    body,
    file,
});
beforeEach(() => {
    jest.clearAllMocks();
    Profile_1.ProfileModel.getPhotos.mockResolvedValue([]);
    photo_2.PhotoService.processAndSavePhoto.mockResolvedValue({
        filename: 'test_processed.jpg',
        thumbnail: 'test_thumb.jpg',
    });
    Profile_1.ProfileModel.setPrimaryPhoto.mockResolvedValue(undefined);
    photo_2.PhotoService.deletePhoto.mockResolvedValue(undefined);
});
describe('PhotoController', () => {
    let req;
    let res;
    beforeEach(() => {
        req = {};
        res = mockResponse();
        jest.clearAllMocks();
    });
    describe('uploadPhoto', () => {
        it('should return 400 if no file is provided', async () => {
            req = mockRequest('user-id');
            await photo_1.PhotoController.uploadPhoto(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'No file provided' });
        });
        it('should return 401 if user is unauthorized', async () => {
            req = mockRequest(undefined, {}, {}, {});
            await photo_1.PhotoController.uploadPhoto(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
        it('should upload photo and respond with success message', async () => {
            req = mockRequest('user-id', {}, {}, { path: 'test-path', filename: 'test.jpg' });
            Profile_1.ProfileModel.getPhotos.mockResolvedValueOnce([]);
            photo_2.PhotoService.processAndSavePhoto.mockResolvedValue({
                filename: 'test_processed.jpg',
                thumbnail: 'test_thumb.jpg',
            });
            await photo_1.PhotoController.uploadPhoto(req, res);
            expect(Profile_1.ProfileModel.getPhotos).toHaveBeenCalledWith('user-id');
            expect(photo_2.PhotoService.processAndSavePhoto).toHaveBeenCalledWith('user-id', req.file, true);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Photo uploaded successfully',
                photo: { filename: 'test_processed.jpg', thumbnail: 'test_thumb.jpg' },
            });
        });
    });
    describe('setPrimaryPhoto', () => {
        it('should return 401 if user is unauthorized', async () => {
            req = mockRequest(undefined, { photoId: 'photo-id' });
            await photo_1.PhotoController.setPrimaryPhoto(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
        it('should return 400 if photoId is missing', async () => {
            req = mockRequest('user-id', {});
            await photo_1.PhotoController.setPrimaryPhoto(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Photo ID is required' });
        });
        it('should set primary photo and respond with success message', async () => {
            req = mockRequest('user-id', { photoId: 'photo-id' });
            Profile_1.ProfileModel.setPrimaryPhoto.mockResolvedValue(undefined);
            await photo_1.PhotoController.setPrimaryPhoto(req, res);
            expect(Profile_1.ProfileModel.setPrimaryPhoto).toHaveBeenCalledWith('user-id', 'photo-id');
            expect(res.json).toHaveBeenCalledWith({
                message: 'Primary photo updated successfully',
            });
        });
    });
    describe('deletePhoto', () => {
        it('should delete photo and respond with success message', async () => {
            req = {
                user: { id: 'user-id' },
                params: { photoId: 'photo-id' },
            };
            photo_2.PhotoService.deletePhoto.mockResolvedValue(undefined);
            fameRating_1.FameRatingService.updateFameRating.mockResolvedValue(undefined);
            await photo_1.PhotoController.deletePhoto(req, res);
            expect(photo_2.PhotoService.deletePhoto).toHaveBeenCalledWith('user-id', 'photo-id');
            expect(fameRating_1.FameRatingService.updateFameRating).toHaveBeenCalledWith('user-id');
            expect(res.json).toHaveBeenCalledWith({
                message: 'Photo deleted successfully',
            });
        });
        it('should delete photo and respond with success message', async () => {
            req = mockRequest('user-id', { photoId: 'photo-id' });
            // Mock les dépendances
            photo_2.PhotoService.deletePhoto.mockResolvedValue(undefined);
            fameRating_1.FameRatingService.updateFameRating.mockResolvedValue(undefined);
            await photo_1.PhotoController.deletePhoto(req, res);
            // Vérifie que les services sont appelés avec les bons paramètres
            expect(photo_2.PhotoService.deletePhoto).toHaveBeenCalledWith('user-id', 'photo-id');
            expect(fameRating_1.FameRatingService.updateFameRating).toHaveBeenCalledWith('user-id');
            // Vérifie la réponse
            expect(res.json).toHaveBeenCalledWith({
                message: 'Photo deleted successfully',
            });
        });
    });
    describe('getPhotos', () => {
        it('should return 401 if user is unauthorized', async () => {
            req = mockRequest(undefined);
            await photo_1.PhotoController.getPhotos(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
        it('should fetch and return photos', async () => {
            req = mockRequest('user-id');
            Profile_1.ProfileModel.getPhotos.mockResolvedValue([
                { id: '1', file_path: 'test1.jpg', is_primary: true },
                { id: '2', file_path: 'test2.jpg', is_primary: false },
            ]);
            await photo_1.PhotoController.getPhotos(req, res);
            expect(Profile_1.ProfileModel.getPhotos).toHaveBeenCalledWith('user-id');
            expect(res.json).toHaveBeenCalledWith({
                photos: [
                    { id: '1', file_path: 'test1.jpg', is_primary: true },
                    { id: '2', file_path: 'test2.jpg', is_primary: false },
                ],
            });
        });
    });
});
