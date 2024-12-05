// src/tests/controllers/profile.test.ts
import { Request, Response } from 'express';
import { ProfileController } from '../../controllers/profile';
import { ProfileModel } from '../../models/Profile';
import { profileSchema } from '../../utils/validators';

// Mock des dépendances
jest.mock('../../models/Profile', () => ({
	ProfileModel: {
		findByUserId: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		getInterests: jest.fn(),
		addInterest: jest.fn(),
		removeInterest: jest.fn(),
	}
}));

jest.mock('../../utils/validators', () => ({
	profileSchema: {
		parse: jest.fn()
	}
}));

describe('ProfileController', () => {
	interface CustomRequest extends Request {
		user?: { id: string };
	}
	let mockRequest: Partial<CustomRequest>;
	let mockResponse: Partial<Response>;
	let responseObject: any = {};

	beforeEach(() => {
		jest.clearAllMocks();

		mockRequest = {
			user: { id: 'test-user-id' },
			body: {
				gender: 'male',
				sexual_preferences: 'female',
				biography: 'Test biography',
				birth_date: '1990-01-01',
				interests: ['music', 'sports'],
				first_name: 'John',
				last_name: 'Doe'
			}
		};

		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockImplementation(result => {
				responseObject = result;
				return mockResponse;
			})
		};

		(profileSchema.parse as jest.Mock).mockImplementation(data => data);
	});

	describe('updateProfile', () => {
		it('should create a new profile if it does not exist', async () => {
			const mockProfile = null;
			(ProfileModel.findByUserId as jest.Mock).mockResolvedValue(mockProfile);

			const mockCreatedProfile = {
				user_id: 'test-user-id',
				...mockRequest.body,
				birth_date: new Date('1990-01-01')
			};
			(ProfileModel.create as jest.Mock).mockResolvedValue(mockCreatedProfile);
			(ProfileModel.getInterests as jest.Mock).mockResolvedValue([]);

			await ProfileController.updateProfile(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(ProfileModel.create).toHaveBeenCalled();
			expect(responseObject).toHaveProperty('profile');
		});

		it('should update existing profile', async () => {
			// Mock du profil existant
			const existingProfile = {
				user_id: 'test-user-id',
				gender: 'male',
				sexual_preferences: 'female',
				biography: 'Old bio',
				interests: ['music']
			};
			(ProfileModel.findByUserId as jest.Mock).mockResolvedValue(existingProfile);

			// Mock de la mise à jour
			const updatedProfile = {
				...existingProfile,
				biography: 'Test biography'
			};
			(ProfileModel.update as jest.Mock).mockResolvedValue(updatedProfile);

			// Mock des intérêts
			(ProfileModel.getInterests as jest.Mock)
				.mockResolvedValueOnce(['music'])
				.mockResolvedValueOnce(['music', 'sports']);

			await ProfileController.updateProfile(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(ProfileModel.update).toHaveBeenCalled();
			expect(mockResponse.json).toHaveBeenCalledWith({
				profile: expect.objectContaining({
					biography: 'Test biography'
				})
			});
		});

		it('should handle unauthorized requests', async () => {
			mockRequest.user = undefined;

			await ProfileController.updateProfile(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(responseObject).toHaveProperty('error', 'Unauthorized');
		});

		it('should handle validation errors', async () => {
			(profileSchema.parse as jest.Mock).mockImplementation(() => {
				throw new Error('Validation failed');
			});

			await ProfileController.updateProfile(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(responseObject).toHaveProperty('error', 'Validation failed');
		});
	});

	describe('getProfile', () => {
		it('should return profile with interests', async () => {
			const mockProfile = {
				user_id: 'test-user-id',
				gender: 'male',
				sexual_preferences: 'female',
				biography: 'Test biography'
			};
			const mockInterests = ['music', 'sports'];

			(ProfileModel.findByUserId as jest.Mock).mockResolvedValue(mockProfile);
			(ProfileModel.getInterests as jest.Mock).mockResolvedValue(mockInterests);

			await ProfileController.getProfile(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(responseObject.profile).toEqual({
				...mockProfile,
				interests: mockInterests
			});
		});

		it('should handle profile not found', async () => {
			(ProfileModel.findByUserId as jest.Mock).mockResolvedValue(null);

			await ProfileController.getProfile(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(responseObject).toHaveProperty('error', 'Profile not found');
		});

		it('should handle unauthorized requests', async () => {
			mockRequest.user = undefined;

			await ProfileController.getProfile(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(responseObject).toHaveProperty('error', 'Unauthorized');
		});

		it('should handle server errors', async () => {
			(ProfileModel.findByUserId as jest.Mock).mockRejectedValue(new Error('Database error'));

			await ProfileController.getProfile(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(responseObject).toHaveProperty('error', 'Internal server error');
		});
	});
});