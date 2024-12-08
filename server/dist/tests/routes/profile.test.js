"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const profile_1 = require("../../controllers/profile");
const photo_1 = require("../../controllers/photo");
const auth_1 = require("../../middleware/auth");
// Mocks
jest.mock('../../controllers/profile');
jest.mock('../../controllers/photo');
jest.mock('../../middleware/auth');
jest.mock('multer', () => {
    const multerMock = () => ({
        single: () => (req, res, next) => {
            req.file = {
                buffer: Buffer.from('test image content'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg'
            };
            next();
        }
    });
    multerMock.diskStorage = () => ({});
    return multerMock;
});
jest.mock('../../config/upload', () => ({
    uploadConfig: {
        single: () => (req, res, next) => {
            req.file = {
                buffer: Buffer.from('test image content'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg'
            };
            next();
        }
    }
}));
describe('Profile Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock l'authentification pour toutes les routes
        auth_1.authMiddleware.mockImplementation((req, res, next) => next());
    });
    describe('GET /api/profile', () => {
        it('should call ProfileController.getProfile', async () => {
            const mockProfile = {
                user_id: '1',
                first_name: 'John',
                last_name: 'Doe',
                interests: ['music']
            };
            profile_1.ProfileController.getProfile.mockImplementation((req, res) => {
                res.status(200).json({ profile: mockProfile });
            });
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/profile')
                .set('Authorization', 'Bearer test-token');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ profile: mockProfile });
        });
        it('should handle error if profile not found', async () => {
            profile_1.ProfileController.getProfile.mockImplementation((req, res) => {
                res.status(404).json({ error: 'Profile not found' });
            });
            const response = await (0, supertest_1.default)(app_1.default)
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
            profile_1.ProfileController.updateProfile.mockImplementation((req, res) => {
                res.status(200).json({
                    profile: { ...updateData, user_id: '1' }
                });
            });
            const response = await (0, supertest_1.default)(app_1.default)
                .put('/api/profile')
                .set('Authorization', 'Bearer test-token')
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.profile).toMatchObject(updateData);
        });
    });
    describe('Photo Routes', () => {
        describe('POST /api/profile/photos', () => {
            it('should upload photo successfully', async () => {
                const mockPhoto = {
                    id: '1',
                    file_path: 'test.jpg',
                    is_primary: true
                };
                photo_1.PhotoController.uploadPhoto.mockImplementation((req, res) => {
                    if (!req.file) {
                        return res.status(400).json({ error: 'No file provided' });
                    }
                    res.status(200).json({
                        message: 'Photo uploaded successfully',
                        photo: mockPhoto
                    });
                });
                const response = await (0, supertest_1.default)(app_1.default)
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
                photo_1.PhotoController.uploadPhoto.mockImplementation((req, res) => {
                    res.status(400).json({
                        error: 'Maximum number of photos reached (5)'
                    });
                });
                const response = await (0, supertest_1.default)(app_1.default)
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
                photo_1.PhotoController.setPrimaryPhoto.mockImplementation((req, res) => {
                    res.status(200).json({
                        message: 'Primary photo updated successfully'
                    });
                });
                const response = await (0, supertest_1.default)(app_1.default)
                    .put('/api/profile/photos/1/primary')
                    .set('Authorization', 'Bearer test-token');
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Primary photo updated successfully');
            });
        });
        describe('DELETE /api/profile/photos/:photoId', () => {
            it('should delete photo', async () => {
                photo_1.PhotoController.deletePhoto.mockImplementation((req, res) => {
                    res.status(200).json({
                        message: 'Photo deleted successfully'
                    });
                });
                const response = await (0, supertest_1.default)(app_1.default)
                    .delete('/api/profile/photos/1')
                    .set('Authorization', 'Bearer test-token');
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Photo deleted successfully');
            });
        });
    });
});
