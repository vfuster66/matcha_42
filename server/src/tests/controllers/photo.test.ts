// src/tests/controllers/photo.test.ts
import { PhotoController } from '../../controllers/photo';
import { ProfileModel } from '../../models/Profile';
import { PhotoService } from '../../services/photo';
import { Request, Response } from 'express';
import { FameRatingService } from '../../services/fameRating';

jest.mock('../../models/Profile');
jest.mock('../../services/photo');
jest.mock('../../services/fameRating', () => ({
	FameRatingService: {
		updateFameRating: jest.fn(),
	},
}));

const mockResponse = (): Response => {
	const res = {} as Response;
	res.status = jest.fn().mockReturnThis();
	res.json = jest.fn().mockReturnThis();
	return res;
};

const mockRequest = (userId?: string, params?: any, body?: any, file?: any): any => ({
	user: userId ? { id: userId } : undefined,
	params,
	body,
	file,
});

beforeEach(() => {
	jest.clearAllMocks();
	(ProfileModel.getPhotos as jest.Mock).mockResolvedValue([]);
	(PhotoService.processAndSavePhoto as jest.Mock).mockResolvedValue({
		filename: 'test_processed.jpg',
		thumbnail: 'test_thumb.jpg',
	});
	(ProfileModel.setPrimaryPhoto as jest.Mock).mockResolvedValue(undefined);
	(PhotoService.deletePhoto as jest.Mock).mockResolvedValue(undefined);
});


describe('PhotoController', () => {
	let req: any;
	let res: Response;

	beforeEach(() => {
		req = {};
		res = mockResponse();
		jest.clearAllMocks();
	});

	describe('uploadPhoto', () => {
		it('should return 400 if no file is provided', async () => {
			req = mockRequest('user-id');
			await PhotoController.uploadPhoto(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ error: 'No file provided' });
		});

		it('should return 401 if user is unauthorized', async () => {
			req = mockRequest(undefined, {}, {}, {});

			await PhotoController.uploadPhoto(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
		});

		it('should upload photo and respond with success message', async () => {
			req = mockRequest('user-id', {}, {}, { path: 'test-path', filename: 'test.jpg' });
			(ProfileModel.getPhotos as jest.Mock).mockResolvedValueOnce([]);
			(PhotoService.processAndSavePhoto as jest.Mock).mockResolvedValue({
				filename: 'test_processed.jpg',
				thumbnail: 'test_thumb.jpg',
			});

			await PhotoController.uploadPhoto(req, res);

			expect(ProfileModel.getPhotos).toHaveBeenCalledWith('user-id');
			expect(PhotoService.processAndSavePhoto).toHaveBeenCalledWith('user-id', req.file, true);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Photo uploaded successfully',
				photo: { filename: 'test_processed.jpg', thumbnail: 'test_thumb.jpg' },
			});
		});
        it('should return 400 when maximum photos limit is reached', async () => {
            req = mockRequest('user-id', {}, {}, { path: 'test-path', filename: 'test.jpg' });
            const existingPhotos = Array(5).fill({ id: 'photo-id', file_path: 'test.jpg' });
            (ProfileModel.getPhotos as jest.Mock).mockResolvedValueOnce(existingPhotos);

            await PhotoController.uploadPhoto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Maximum number of photos (5) reached' 
            });
        });

        it('should handle photo processing errors', async () => {
            req = mockRequest('user-id', {}, {}, { path: 'test-path', filename: 'test.jpg' });
            const processingError = new Error('Processing failed');
            (PhotoService.processAndSavePhoto as jest.Mock)
                .mockRejectedValueOnce(processingError);

            await PhotoController.uploadPhoto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Processing failed' 
            });
        });

        it('should handle unexpected errors', async () => {
            req = mockRequest('user-id', {}, {}, { path: 'test-path', filename: 'test.jpg' });
            (PhotoService.processAndSavePhoto as jest.Mock)
                .mockRejectedValueOnce('Unexpected error');

            await PhotoController.uploadPhoto(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Internal server error' 
            });
        });
	});

	describe('setPrimaryPhoto', () => {
		it('should return 401 if user is unauthorized', async () => {
			req = mockRequest(undefined, { photoId: 'photo-id' });

			await PhotoController.setPrimaryPhoto(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
		});

		it('should return 400 if photoId is missing', async () => {
			req = mockRequest('user-id', {});

			await PhotoController.setPrimaryPhoto(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ error: 'Photo ID is required' });
		});

		it('should set primary photo and respond with success message', async () => {
			req = mockRequest('user-id', { photoId: 'photo-id' });
			(ProfileModel.setPrimaryPhoto as jest.Mock).mockResolvedValue(undefined);

			await PhotoController.setPrimaryPhoto(req, res);

			expect(ProfileModel.setPrimaryPhoto).toHaveBeenCalledWith('user-id', 'photo-id');
			expect(res.json).toHaveBeenCalledWith({
				message: 'Primary photo updated successfully',
			});
		});
        it('should handle photo not found error', async () => {
            req = mockRequest('user-id', { photoId: 'photo-id' });
            const notFoundError = new Error('Photo not found');
            (ProfileModel.setPrimaryPhoto as jest.Mock)
                .mockRejectedValueOnce(notFoundError);

            await PhotoController.setPrimaryPhoto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Photo not found' 
            });
        });

        it('should handle fame rating update errors', async () => {
            req = mockRequest('user-id', { photoId: 'photo-id' });
            (ProfileModel.setPrimaryPhoto as jest.Mock).mockResolvedValueOnce(undefined);
            (FameRatingService.updateFameRating as jest.Mock)
                .mockRejectedValueOnce(new Error('Fame update failed'));

            await PhotoController.setPrimaryPhoto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Fame update failed' 
            });
        });
	});

	describe('deletePhoto', () => {
		it('should delete photo and respond with success message', async () => {
			req = {
				user: { id: 'user-id' },
				params: { photoId: 'photo-id' },
			};

			(PhotoService.deletePhoto as jest.Mock).mockResolvedValue(undefined);
			(FameRatingService.updateFameRating as jest.Mock).mockResolvedValue(undefined);

			await PhotoController.deletePhoto(req, res);

			expect(PhotoService.deletePhoto).toHaveBeenCalledWith('user-id', 'photo-id');
			expect(FameRatingService.updateFameRating).toHaveBeenCalledWith('user-id');
			expect(res.json).toHaveBeenCalledWith({
				message: 'Photo deleted successfully',
			});
		});

		it('should delete photo and respond with success message', async () => {
			req = mockRequest('user-id', { photoId: 'photo-id' });

			// Mock les dépendances
			(PhotoService.deletePhoto as jest.Mock).mockResolvedValue(undefined);
			(FameRatingService.updateFameRating as jest.Mock).mockResolvedValue(undefined);

			await PhotoController.deletePhoto(req, res);

			// Vérifie que les services sont appelés avec les bons paramètres
			expect(PhotoService.deletePhoto).toHaveBeenCalledWith('user-id', 'photo-id');
			expect(FameRatingService.updateFameRating).toHaveBeenCalledWith('user-id');

			// Vérifie la réponse
			expect(res.json).toHaveBeenCalledWith({
				message: 'Photo deleted successfully',
			});
		});
        it('should handle unauthorized deletion attempts', async () => {
            req = mockRequest(undefined, { photoId: 'photo-id' });

            await PhotoController.deletePhoto(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Unauthorized' 
            });
        });

        it('should handle missing photo ID', async () => {
            req = mockRequest('user-id', {});

            await PhotoController.deletePhoto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Photo ID is required' 
            });
        });

        it('should handle photo not found error', async () => {
            req = mockRequest('user-id', { photoId: 'photo-id' });
            const notFoundError = new Error('Photo not found');
            (PhotoService.deletePhoto as jest.Mock)
                .mockRejectedValueOnce(notFoundError);

            await PhotoController.deletePhoto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Photo not found' 
            });
        });

        it('should handle fame rating update errors after deletion', async () => {
            req = mockRequest('user-id', { photoId: 'photo-id' });
            (PhotoService.deletePhoto as jest.Mock).mockResolvedValueOnce(undefined);
            (FameRatingService.updateFameRating as jest.Mock)
                .mockRejectedValueOnce(new Error('Fame update failed'));

            await PhotoController.deletePhoto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Fame update failed' 
            });
        });
	});


	describe('getPhotos', () => {
		it('should return 401 if user is unauthorized', async () => {
			req = mockRequest(undefined);

			await PhotoController.getPhotos(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
		});

		it('should fetch and return photos', async () => {
			req = mockRequest('user-id');
			(ProfileModel.getPhotos as jest.Mock).mockResolvedValue([
				{ id: '1', file_path: 'test1.jpg', is_primary: true },
				{ id: '2', file_path: 'test2.jpg', is_primary: false },
			]);

			await PhotoController.getPhotos(req, res);

			expect(ProfileModel.getPhotos).toHaveBeenCalledWith('user-id');
			expect(res.json).toHaveBeenCalledWith({
				photos: [
					{ id: '1', file_path: 'test1.jpg', is_primary: true },
					{ id: '2', file_path: 'test2.jpg', is_primary: false },
				],
			});
		});
        it('should handle database errors', async () => {
            req = mockRequest('user-id');
            const dbError = new Error('Database error');
            (ProfileModel.getPhotos as jest.Mock).mockRejectedValueOnce(dbError);

            await PhotoController.getPhotos(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Database error' 
            });
        });

        it('should handle unexpected errors during photo retrieval', async () => {
            req = mockRequest('user-id');
            (ProfileModel.getPhotos as jest.Mock).mockRejectedValueOnce('Unexpected error');

            await PhotoController.getPhotos(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Internal server error' 
            });
        });
	});
});
