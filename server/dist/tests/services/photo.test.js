"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/services/photo.test.ts
const sharp_1 = __importDefault(require("sharp"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const photo_1 = require("../../services/photo");
const Profile_1 = require("../../models/Profile");
jest.mock('fs/promises');
jest.mock('sharp');
jest.mock('../../models/Profile');
describe('PhotoService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('processAndSavePhoto', () => {
        const userId = 'test-user';
        const file = {
            path: '/tmp/test.jpg',
            filename: 'test.jpg'
        };
        it('should process and save photo successfully', async () => {
            const mockAddPhoto = jest.fn();
            const mockGetPhotos = jest.fn().mockResolvedValue([]);
            Profile_1.ProfileModel.addPhoto = mockAddPhoto;
            Profile_1.ProfileModel.getPhotos = mockGetPhotos;
            const result = await photo_1.PhotoService.processAndSavePhoto(userId, file, true);
            expect(promises_1.default.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
            expect(sharp_1.default).toHaveBeenCalledWith(file.path);
            expect(mockAddPhoto).toHaveBeenCalledWith(userId, expect.any(String), true);
            expect(result).toEqual({
                filename: expect.stringContaining('_processed.jpg'),
                thumbnail: expect.stringContaining('_thumb.jpg')
            });
            expect(promises_1.default.unlink).toHaveBeenCalledWith(file.path);
        });
        it('should throw error if photo limit is exceeded', async () => {
            Profile_1.ProfileModel.getPhotos = jest.fn().mockResolvedValue(Array(6).fill({}));
            await expect(photo_1.PhotoService.processAndSavePhoto(userId, file, false)).rejects.toThrow('Maximum number of photos reached (5)');
            expect(promises_1.default.unlink).toHaveBeenCalledWith(file.path);
        });
        it('should clean up on error', async () => {
            sharp_1.default.mockImplementation(() => {
                throw new Error('Sharp error');
            });
            await expect(photo_1.PhotoService.processAndSavePhoto(userId, file, false)).rejects.toThrow('Sharp error');
            expect(promises_1.default.unlink).toHaveBeenCalledWith(file.path);
        });
    });
    describe('deletePhoto', () => {
        const userId = 'test-user';
        const photoId = 'test-photo';
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'profiles');
        const mockPhotos = [
            { id: 'test-photo', file_path: 'test_processed.jpg' },
            { id: 'another-photo', file_path: 'another_processed.jpg' }
        ];
        it('should delete photo successfully', async () => {
            Profile_1.ProfileModel.getPhotos = jest.fn().mockResolvedValue(mockPhotos);
            Profile_1.ProfileModel.deletePhoto = jest.fn();
            await photo_1.PhotoService.deletePhoto(userId, photoId);
            expect(Profile_1.ProfileModel.getPhotos).toHaveBeenCalledWith(userId);
            expect(Profile_1.ProfileModel.deletePhoto).toHaveBeenCalledWith(userId, photoId);
            expect(promises_1.default.unlink).toHaveBeenCalledWith(path_1.default.join(uploadDir, 'test_processed.jpg'));
            expect(promises_1.default.unlink).toHaveBeenCalledWith(path_1.default.join(uploadDir, 'test_thumb.jpg'));
        });
        it('should throw error if photo is not found', async () => {
            Profile_1.ProfileModel.getPhotos = jest.fn().mockResolvedValue(mockPhotos);
            await expect(photo_1.PhotoService.deletePhoto(userId, 'nonexistent-photo')).rejects.toThrow('Photo not found or unauthorized');
            expect(Profile_1.ProfileModel.deletePhoto).not.toHaveBeenCalled();
            expect(promises_1.default.unlink).not.toHaveBeenCalled();
        });
        it('should handle file deletion errors gracefully', async () => {
            Profile_1.ProfileModel.getPhotos = jest.fn().mockResolvedValue(mockPhotos);
            Profile_1.ProfileModel.deletePhoto = jest.fn();
            promises_1.default.unlink.mockRejectedValueOnce(new Error('File error'));
            await expect(photo_1.PhotoService.deletePhoto(userId, photoId)).resolves.not.toThrow();
            expect(Profile_1.ProfileModel.getPhotos).toHaveBeenCalledWith(userId);
            expect(Profile_1.ProfileModel.deletePhoto).toHaveBeenCalledWith(userId, photoId);
            expect(promises_1.default.unlink).toHaveBeenCalledWith(path_1.default.join(uploadDir, 'test_processed.jpg'));
            expect(promises_1.default.unlink).toHaveBeenCalledWith(path_1.default.join(uploadDir, 'test_thumb.jpg'));
        });
    });
});
