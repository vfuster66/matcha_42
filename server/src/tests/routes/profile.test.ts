import request from 'supertest';
import app from '../../app';
import { ProfileController } from '../../controllers/profile';
import { PhotoController } from '../../controllers/photo';
import { authMiddleware } from '../../middleware/auth';
import multer from 'multer';
import { uploadConfig } from '../../config/upload';

// Mocks
jest.mock('../../controllers/profile');
jest.mock('../../controllers/photo');
jest.mock('../../middleware/auth');
jest.mock('../../config/upload');

describe('Profile Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (authMiddleware as jest.Mock).mockImplementation(
            (req: any, res: any, next: any) => next()
        );
    });

	describe('GET /api/profile', () => {
		it('should call ProfileController.getProfile', async () => {
			const mockProfile = {
				user_id: '1',
				first_name: 'John',
				last_name: 'Doe',
				interests: ['music']
			};

			(ProfileController.getProfile as jest.Mock).mockImplementation((req, res) => {
				res.status(200).json({ profile: mockProfile });
			});

			const response = await request(app)
				.get('/api/profile')
				.set('Authorization', 'Bearer test-token');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ profile: mockProfile });
		});

		it('should handle error if profile not found', async () => {
			(ProfileController.getProfile as jest.Mock).mockImplementation((req, res) => {
				res.status(404).json({ error: 'Profile not found' });
			});

			const response = await request(app)
				.get('/api/profile')
				.set('Authorization', 'Bearer test-token');

			expect(response.status).toBe(404);
			expect(response.body).toEqual({ error: 'Profile not found' });
		});
	});

	describe('PUT /api/profile', () => {
		const updateData = {
			first_name: 'John',
			last_name: 'Doe',
			gender: 'male',
			sexual_preferences: 'female',
			biography: 'Test bio',
			birth_date: '1990-01-01',
			interests: ['music']
		};

		it('should update profile successfully', async () => {
			(ProfileController.updateProfile as jest.Mock).mockImplementation((req, res) => {
				res.status(200).json({
					profile: { ...updateData, user_id: '1' }
				});
			});

			const response = await request(app)
				.put('/api/profile')
				.set('Authorization', 'Bearer test-token')
				.send(updateData);

			expect(response.status).toBe(200);
			expect(response.body.profile).toMatchObject(updateData);
		});
		it('should handle profile update errors', async () => {
			(ProfileController.updateProfile as jest.Mock)
				.mockImplementation((req, res) => {
					throw new Error('Update failed');
				});

			const response = await request(app)
				.put('/api/profile')
				.set('Authorization', 'Bearer test-token')
				.send(updateData);

			expect(response.status).toBe(500);
			expect(response.body).toHaveProperty('error');
		});

		it('should handle validation errors', async () => {
			(ProfileController.updateProfile as jest.Mock)
				.mockImplementation((req, res) => {
					res.status(400).json({ error: 'Invalid data' });
				});

			const response = await request(app)
				.put('/api/profile')
				.set('Authorization', 'Bearer test-token')
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.error).toBe('Invalid data');
		});
	});

    describe('Photo Upload Error Handling', () => {
        const setupUploadMock = (error?: { code?: string; message?: string }) => {
            const mockMiddleware = (req: any, res: any, next: any) => {
                if (error) {
                    next(error);
                } else {
                    next();
                }
            };

            (uploadConfig.single as jest.Mock).mockReturnValue(mockMiddleware);
        };

        beforeEach(() => {
            // Reset le mock à un état par défaut
            setupUploadMock();
        });

        it('should handle file size limit error', async () => {
            setupUploadMock({
                code: 'LIMIT_FILE_SIZE',
                message: 'File too large'
            });

            const response = await request(app)
                .post('/api/profile/photos')
                .set('Authorization', 'Bearer test-token')
                .attach('photo', Buffer.from('test'), 'test.jpg');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'File too large' });
        }, 10000); // Augmentation du timeout

        it('should handle unexpected field error', async () => {
            setupUploadMock({
                code: 'LIMIT_UNEXPECTED_FILE',
                message: 'Unexpected field'
            });

            const response = await request(app)
                .post('/api/profile/photos')
                .set('Authorization', 'Bearer test-token')
                .attach('wrongField', Buffer.from('test'), 'test.jpg');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Unexpected field' });
        }, 10000);

        it('should handle general multer errors with message', async () => {
            setupUploadMock({
                message: 'Custom error message'
            });

            const response = await request(app)
                .post('/api/profile/photos')
                .set('Authorization', 'Bearer test-token')
                .attach('photo', Buffer.from('test'), 'test.jpg');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Custom error message' });
        }, 10000);

        it('should handle unknown errors', async () => {
            setupUploadMock({});

            const response = await request(app)
                .post('/api/profile/photos')
                .set('Authorization', 'Bearer test-token')
                .attach('photo', Buffer.from('test'), 'test.jpg');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An unknown error occurred.' });
        }, 10000);

        it('should handle successful upload after error cases', async () => {
            setupUploadMock(); // Pas d'erreur
            (PhotoController.uploadPhoto as jest.Mock).mockImplementation((req, res) => {
                res.status(200).json({
                    message: 'Photo uploaded successfully',
                    photo: { id: '1', file_path: 'test.jpg' }
                });
            });

            const response = await request(app)
                .post('/api/profile/photos')
                .set('Authorization', 'Bearer test-token')
                .attach('photo', Buffer.from('test'), 'test.jpg');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Photo uploaded successfully');
        }, 10000);
    });

    describe('Authentication Error Handling', () => {
        it('should handle unauthorized access', async () => {
            (authMiddleware as jest.Mock).mockImplementation(
                (req: any, res: any, next: any) => {
                    res.status(401).json({ error: 'Unauthorized' });
                }
            );

            const responses = await Promise.all([
                request(app).get('/api/profile'),
                request(app).put('/api/profile'),
                request(app).post('/api/profile/photos'),
                request(app).put('/api/profile/photos/1/primary'),
                request(app).delete('/api/profile/photos/1')
            ]);

            responses.forEach(response => {
                expect(response.status).toBe(401);
                expect(response.body).toEqual({ error: 'Unauthorized' });
            });
        });

        it('should handle authentication errors', async () => {
            (authMiddleware as jest.Mock).mockImplementation(
                (req: any, res: any, next: any) => {
                    next(new Error('Authentication failed'));
                }
            );

            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', 'invalid-token');

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Profile Photos Routes Error Handling', () => {
        it('should handle set primary photo errors', async () => {
            (PhotoController.setPrimaryPhoto as jest.Mock)
                .mockImplementation((req, res) => {
                    throw new Error('Failed to set primary photo');
                });

            const response = await request(app)
                .put('/api/profile/photos/1/primary')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });

        it('should handle photo deletion errors', async () => {
            (PhotoController.deletePhoto as jest.Mock)
                .mockImplementation((req, res) => {
                    throw new Error('Failed to delete photo');
                });

            const response = await request(app)
                .delete('/api/profile/photos/1')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

	describe('Photo Routes', () => {
        describe('POST /api/profile/photos', () => {
            beforeEach(() => {
                // Configuration par défaut du mock uploadConfig pour le succès
                (uploadConfig.single as jest.Mock).mockImplementation(() => 
                    (req: any, res: any, next: any) => {
                        // Simuler un fichier uploadé avec succès
                        req.file = {
                            buffer: Buffer.from('test image content'),
                            originalname: 'test.jpg',
                            mimetype: 'image/jpeg',
                            path: '/tmp/test.jpg',
                            filename: 'test.jpg'
                        };
                        next();
                    }
                );
            });
			it('should upload photo successfully', async () => {
				const mockPhoto = {
					id: '1',
					file_path: 'test.jpg',
					is_primary: true
				};

				(PhotoController.uploadPhoto as jest.Mock).mockImplementation((req, res) => {
					if (!req.file) {
						return res.status(400).json({ error: 'No file provided' });
					}
					res.status(200).json({
						message: 'Photo uploaded successfully',
						photo: mockPhoto
					});
				});

				const response = await request(app)
					.post('/api/profile/photos')
					.set('Authorization', 'Bearer test-token')
					.attach('photo', Buffer.from('test image content'), {
						filename: 'test.jpg',
						contentType: 'image/jpeg'
					});

				expect(response.status).toBe(200);
				expect(response.body).toEqual({
					message: 'Photo uploaded successfully',
					photo: mockPhoto
				});
			});

			it('should handle photo limit exceeded', async () => {
				(PhotoController.uploadPhoto as jest.Mock).mockImplementation((req, res) => {
					res.status(400).json({
						error: 'Maximum number of photos reached (5)'
					});
				});

				const response = await request(app)
					.post('/api/profile/photos')
					.set('Authorization', 'Bearer test-token')
					.attach('photo', Buffer.from('test image content'), {
						filename: 'test.jpg',
						contentType: 'image/jpeg'
					});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe('Maximum number of photos reached (5)');
			});
		});

		describe('PUT /api/profile/photos/:photoId/primary', () => {
			it('should set primary photo', async () => {
				(PhotoController.setPrimaryPhoto as jest.Mock).mockImplementation((req, res) => {
					res.status(200).json({
						message: 'Primary photo updated successfully'
					});
				});

				const response = await request(app)
					.put('/api/profile/photos/1/primary')
					.set('Authorization', 'Bearer test-token');

				expect(response.status).toBe(200);
				expect(response.body.message).toBe('Primary photo updated successfully');
			});
		});

		describe('DELETE /api/profile/photos/:photoId', () => {
			it('should delete photo', async () => {
				(PhotoController.deletePhoto as jest.Mock).mockImplementation((req, res) => {
					res.status(200).json({
						message: 'Photo deleted successfully'
					});
				});

				const response = await request(app)
					.delete('/api/profile/photos/1')
					.set('Authorization', 'Bearer test-token');

				expect(response.status).toBe(200);
				expect(response.body.message).toBe('Photo deleted successfully');
			});
		});
	});
});