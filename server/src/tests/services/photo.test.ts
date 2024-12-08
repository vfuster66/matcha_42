import { PhotoService } from '../../services/photo';
import { ProfileModel } from '../../models/Profile';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// Mocks
jest.mock('sharp');
jest.mock('fs/promises');
jest.mock('path');
jest.mock('../../models/Profile');

describe('PhotoService', () => {
    const mockUserId = '123';
    const mockFile: Express.Multer.File = {
        filename: 'test.jpg',
        path: '/tmp/test.jpg',
        fieldname: 'photo',
        originalname: 'original.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: '/tmp',
        buffer: Buffer.from('test'),
        stream: null as any
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
        (path.parse as jest.Mock).mockReturnValue({ name: 'test' });
        (sharp as jest.Mock).mockReturnValue({
            resize: jest.fn().mockReturnThis(),
            jpeg: jest.fn().mockReturnThis(),
            toFile: jest.fn().mockResolvedValue(undefined)
        });
    });

    describe('processAndSavePhoto', () => {
        beforeEach(() => {
            (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
            (fs.unlink as jest.Mock).mockResolvedValue(undefined);
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValue([]);
            (ProfileModel.addPhoto as jest.Mock).mockResolvedValue({ id: '1' });
        });

        it('should process and save a new photo successfully', async () => {
            const result = await PhotoService.processAndSavePhoto(mockUserId, mockFile);

            expect(result).toEqual({
                filename: 'test_processed.jpg',
                thumbnail: 'test_thumb.jpg',
                isPrimary: true
            });

            expect(sharp).toHaveBeenCalledWith(mockFile.path);
            expect(ProfileModel.addPhoto).toHaveBeenCalledWith(
                mockUserId,
                'test_processed.jpg',
                true
            );
            expect(fs.unlink).toHaveBeenCalledWith(mockFile.path);
        });

        it('should throw error when photo limit is reached', async () => {
            const existingPhotos = Array(5).fill({ id: '1', file_path: 'test.jpg' });
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValue(existingPhotos);

            await expect(PhotoService.processAndSavePhoto(mockUserId, mockFile))
                .rejects
                .toThrow('Maximum number of photos reached (5)');
        });

        it('should handle sharp processing errors', async () => {
            const mockError = new Error('Processing failed');
            (sharp as jest.Mock).mockReturnValue({
                resize: jest.fn().mockReturnThis(),
                jpeg: jest.fn().mockReturnThis(),
                toFile: jest.fn().mockRejectedValue(mockError)
            });

            await expect(PhotoService.processAndSavePhoto(mockUserId, mockFile))
                .rejects
                .toThrow('Processing failed');
            
            expect(fs.unlink).toHaveBeenCalledWith(mockFile.path);
        });

        it('should set isPrimary true for first photo', async () => {
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValue([]);

            await PhotoService.processAndSavePhoto(mockUserId, mockFile, false);

            expect(ProfileModel.addPhoto).toHaveBeenCalledWith(
                mockUserId,
                'test_processed.jpg',
                true
            );
        });

        it('should handle mkdir errors', async () => {
            (fs.mkdir as jest.Mock).mockRejectedValue(new Error('mkdir failed'));

            await expect(PhotoService.processAndSavePhoto(mockUserId, mockFile))
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
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValue([mockPhoto]);
            (ProfileModel.deletePhoto as jest.Mock).mockResolvedValue(undefined);
            (fs.unlink as jest.Mock).mockResolvedValue(undefined);
        });

        it('should delete photo successfully', async () => {
            await PhotoService.deletePhoto(mockUserId, mockPhotoId);

            expect(ProfileModel.deletePhoto).toHaveBeenCalledWith(mockUserId, mockPhotoId);
            expect(fs.unlink).toHaveBeenCalledTimes(2); // processed + thumbnail
        });

        it('should throw error when photo not found', async () => {
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValue([]);

            await expect(PhotoService.deletePhoto(mockUserId, mockPhotoId))
                .rejects
                .toThrow('Photo not found or unauthorized');
        });

        it('should handle fs.unlink errors gracefully', async () => {
            (fs.unlink as jest.Mock).mockRejectedValue(new Error('unlink failed'));

            await PhotoService.deletePhoto(mockUserId, mockPhotoId);

            expect(ProfileModel.deletePhoto).toHaveBeenCalled();
        });

        it('should handle ProfileModel.deletePhoto errors', async () => {
            (ProfileModel.deletePhoto as jest.Mock).mockRejectedValue(new Error('delete failed'));

            await expect(PhotoService.deletePhoto(mockUserId, mockPhotoId))
                .rejects
                .toThrow('Failed to delete photo: delete failed');
        });
    });

    describe('validatePhotoLimit', () => {
        it('should return true when under photo limit', async () => {
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValue([]);

            const result = await PhotoService.validatePhotoLimit(mockUserId);
            expect(result).toBe(true);
        });

        it('should throw error when at photo limit', async () => {
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValue(Array(5).fill({}));

            await expect(PhotoService.validatePhotoLimit(mockUserId))
                .rejects
                .toThrow('Maximum number of photos (5) reached');
        });
    });

    describe('hasProfilePicture', () => {
        it('should return true when primary photo exists', async () => {
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValue([
                { is_primary: true }
            ]);

            const result = await PhotoService.hasProfilePicture(mockUserId);
            expect(result).toBe(true);
        });

        it('should return false when no primary photo exists', async () => {
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValue([
                { is_primary: false }
            ]);

            const result = await PhotoService.hasProfilePicture(mockUserId);
            expect(result).toBe(false);
        });

        it('should return false when no photos exist', async () => {
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValue([]);

            const result = await PhotoService.hasProfilePicture(mockUserId);
            expect(result).toBe(false);
        });
    });
});