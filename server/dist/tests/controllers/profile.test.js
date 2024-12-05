"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const profile_1 = require("../../controllers/profile");
const Profile_1 = require("../../models/Profile");
const validators_1 = require("../../utils/validators");
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
    let mockRequest;
    let mockResponse;
    let responseObject = {};
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
        validators_1.profileSchema.parse.mockImplementation(data => data);
    });
    describe('updateProfile', () => {
        it('should create a new profile if it does not exist', async () => {
            const mockProfile = null;
            Profile_1.ProfileModel.findByUserId.mockResolvedValue(mockProfile);
            const mockCreatedProfile = {
                user_id: 'test-user-id',
                ...mockRequest.body,
                birth_date: new Date('1990-01-01')
            };
            Profile_1.ProfileModel.create.mockResolvedValue(mockCreatedProfile);
            Profile_1.ProfileModel.getInterests.mockResolvedValue([]);
            await profile_1.ProfileController.updateProfile(mockRequest, mockResponse);
            expect(Profile_1.ProfileModel.create).toHaveBeenCalled();
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
            Profile_1.ProfileModel.findByUserId.mockResolvedValue(existingProfile);
            // Mock de la mise à jour
            const updatedProfile = {
                ...existingProfile,
                biography: 'Test biography'
            };
            Profile_1.ProfileModel.update.mockResolvedValue(updatedProfile);
            // Mock des intérêts
            Profile_1.ProfileModel.getInterests
                .mockResolvedValueOnce(['music'])
                .mockResolvedValueOnce(['music', 'sports']);
            await profile_1.ProfileController.updateProfile(mockRequest, mockResponse);
            expect(Profile_1.ProfileModel.update).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({
                profile: expect.objectContaining({
                    biography: 'Test biography'
                })
            });
        });
        it('should handle unauthorized requests', async () => {
            mockRequest.user = undefined;
            await profile_1.ProfileController.updateProfile(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(responseObject).toHaveProperty('error', 'Unauthorized');
        });
        it('should handle validation errors', async () => {
            validators_1.profileSchema.parse.mockImplementation(() => {
                throw new Error('Validation failed');
            });
            await profile_1.ProfileController.updateProfile(mockRequest, mockResponse);
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
            Profile_1.ProfileModel.findByUserId.mockResolvedValue(mockProfile);
            Profile_1.ProfileModel.getInterests.mockResolvedValue(mockInterests);
            await profile_1.ProfileController.getProfile(mockRequest, mockResponse);
            expect(responseObject.profile).toEqual({
                ...mockProfile,
                interests: mockInterests
            });
        });
        it('should handle profile not found', async () => {
            Profile_1.ProfileModel.findByUserId.mockResolvedValue(null);
            await profile_1.ProfileController.getProfile(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(responseObject).toHaveProperty('error', 'Profile not found');
        });
        it('should handle unauthorized requests', async () => {
            mockRequest.user = undefined;
            await profile_1.ProfileController.getProfile(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(responseObject).toHaveProperty('error', 'Unauthorized');
        });
        it('should handle server errors', async () => {
            Profile_1.ProfileModel.findByUserId.mockRejectedValue(new Error('Database error'));
            await profile_1.ProfileController.getProfile(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toHaveProperty('error', 'Internal server error');
        });
    });
});
