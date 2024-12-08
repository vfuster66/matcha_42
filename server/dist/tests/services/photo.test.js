"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const photo_1 = require("../../services/photo");
const Profile_1 = require("../../models/Profile");
const sharp_1 = __importDefault(require("sharp"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// Mocks
jest.mock('sharp');
jest.mock('fs/promises');
jest.mock('path');
jest.mock('../../models/Profile');
describe('PhotoService', () => {
    const mockUserId = '123';
    const mockFile = {
        filename: 'test.jpg',
        path: '/tmp/test.jpg',
        fieldname: 'photo',
        originalname: 'original.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: '/tmp',
        buffer: Buffer.from('test'),
        stream: null
    };
    beforeEach(() => {
        jest.clearAllMocks();
        path_1.default.join.mockImplementation((...args) => args.join('/'));
        path_1.default.parse.mockReturnValue({ name: 'test' });
        sharp_1.default.mockReturnValue({
            resize: jest.fn().mockReturnThis(),
            jpeg: jest.fn().mockReturnThis(),
            toFile: jest.fn().mockResolvedValue(undefined)
        });
    });
    describe('processAndSavePhoto', () => {
        beforeEach(() => {
            promises_1.default.mkdir.mockResolvedValue(undefined);
            promises_1.default.unlink.mockResolvedValue(undefined);
            Profile_1.ProfileModel.getPhotos.mockResolvedValue([]);
            Profile_1.ProfileModel.addPhoto.mockResolvedValue({ id: '1' });
        });
        it('should process and save a new photo successfully', async () => {
            const result = await photo_1.PhotoService.processAndSavePhoto(mockUserId, mockFile);
            expect(result).toEqual({
                filename: 'test_processed.jpg',
                thumbnail: 'test_thumb.jpg',
                isPrimary: true
            });
            expect(sharp_1.default).toHaveBeenCalledWith(mockFile.path);
            expect(Profile_1.ProfileModel.addPhoto).toHaveBeenCalledWith(mockUserId, 'test_processed.jpg', true);
            expect(promises_1.default.unlink).toHaveBeenCalledWith(mockFile.path);
        });
        it('should throw error when photo limit is reached', async () => {
            const existingPhotos = Array(5).fill({ id: '1', file_path: 'test.jpg' });
            Profile_1.ProfileModel.getPhotos.mockResolvedValue(existingPhotos);
            await expect(photo_1.PhotoService.processAndSavePhoto(mockUserId, mockFile))
                .rejects
                .toThrow('Maximum number of photos reached (5)');
        });
        it('should handle sharp processing errors', async () => {
            const mockError = new Error('Processing failed');
            sharp_1.default.mockReturnValue({
                resize: jest.fn().mockReturnThis(),
                jpeg: jest.fn().mockReturnThis(),
                toFile: jest.fn().mockRejectedValue(mockError)
            });
            await expect(photo_1.PhotoService.processAndSavePhoto(mockUserId, mockFile))
                .rejects
                .toThrow('Processing failed');
            expect(promises_1.default.unlink).toHaveBeenCalledWith(mockFile.path);
        });
        it('should set isPrimary true for first photo', async () => {
            Profile_1.ProfileModel.getPhotos.mockResolvedValue([]);
            await photo_1.PhotoService.processAndSavePhoto(mockUserId, mockFile, false);
            expect(Profile_1.ProfileModel.addPhoto).toHaveBeenCalledWith(mockUserId, 'test_processed.jpg', true);
        });
        it('should handle mkdir errors', async () => {
            promises_1.default.mkdir.mockRejectedValue(new Error('mkdir failed'));
            await expect(photo_1.PhotoService.processAndSavePhoto(mockUserId, mockFile))
                .rejects
                .toThrow('mkdir failed');
        });
    });
    describe('deletePhoto', () => {
        const mockPhotoId = '1';
        const mockPhoto = {
            id: mockPhotoId,
            file_path: 'test_processed.jpg',
            is_primary: false
        };
        beforeEach(() => {
            Profile_1.ProfileModel.getPhotos.mockResolvedValue([mockPhoto]);
            Profile_1.ProfileModel.deletePhoto.mockResolvedValue(undefined);
            promises_1.default.unlink.mockResolvedValue(undefined);
        });
        it('should delete photo successfully', async () => {
            await photo_1.PhotoService.deletePhoto(mockUserId, mockPhotoId);
            expect(Profile_1.ProfileModel.deletePhoto).toHaveBeenCalledWith(mockUserId, mockPhotoId);
            expect(promises_1.default.unlink).toHaveBeenCalledTimes(2); // processed + thumbnail
        });
        it('should throw error when photo not found', async () => {
            Profile_1.ProfileModel.getPhotos.mockResolvedValue([]);
            await expect(photo_1.PhotoService.deletePhoto(mockUserId, mockPhotoId))
                .rejects
                .toThrow('Photo not found or unauthorized');
        });
        it('should handle fs.unlink errors gracefully', async () => {
            promises_1.default.unlink.mockRejectedValue(new Error('unlink failed'));
            await photo_1.PhotoService.deletePhoto(mockUserId, mockPhotoId);
            expect(Profile_1.ProfileModel.deletePhoto).toHaveBeenCalled();
        });
        it('should handle ProfileModel.deletePhoto errors', async () => {
            Profile_1.ProfileModel.deletePhoto.mockRejectedValue(new Error('delete failed'));
            await expect(photo_1.PhotoService.deletePhoto(mockUserId, mockPhotoId))
                .rejects
                .toThrow('Failed to delete photo: delete failed');
        });
    });
    describe('validatePhotoLimit', () => {
        it('should return true when under photo limit', async () => {
            Profile_1.ProfileModel.getPhotos.mockResolvedValue([]);
            const result = await photo_1.PhotoService.validatePhotoLimit(mockUserId);
            expect(result).toBe(true);
        });
        it('should throw error when at photo limit', async () => {
            Profile_1.ProfileModel.getPhotos.mockResolvedValue(Array(5).fill({}));
            await expect(photo_1.PhotoService.validatePhotoLimit(mockUserId))
                .rejects
                .toThrow('Maximum number of photos (5) reached');
        });
    });
    describe('hasProfilePicture', () => {
        it('should return true when primary photo exists', async () => {
            Profile_1.ProfileModel.getPhotos.mockResolvedValue([
                { is_primary: true }
            ]);
            const result = await photo_1.PhotoService.hasProfilePicture(mockUserId);
            expect(result).toBe(true);
        });
        it('should return false when no primary photo exists', async () => {
            Profile_1.ProfileModel.getPhotos.mockResolvedValue([
                { is_primary: false }
            ]);
            const result = await photo_1.PhotoService.hasProfilePicture(mockUserId);
            expect(result).toBe(false);
        });
        it('should return false when no photos exist', async () => {
            Profile_1.ProfileModel.getPhotos.mockResolvedValue([]);
            const result = await photo_1.PhotoService.hasProfilePicture(mockUserId);
            expect(result).toBe(false);
        });
    });
});
