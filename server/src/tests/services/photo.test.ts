// Mocks
jest.mock('../../controllers/profile');
jest.mock('../../controllers/photo');
jest.mock('../../middleware/auth');
jest.mock('multer', () => {
  const multer = () => {
    return {
      single: (): (req: any, res: any, next: any) => void => (req, res, next) => next(),
    };
  };
  multer.diskStorage = () => {};
  return multer;
});

import request from 'supertest';
import { ProfileController } from '../../controllers/profile';
import { PhotoController } from '../../controllers/photo';
import { authMiddleware } from '../../middleware/auth';
import app from '../../app';


describe('Profile Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authMiddleware as jest.Mock).mockImplementation((req, res, next) => next());
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
      expect(ProfileController.getProfile).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      (ProfileController.getProfile as jest.Mock).mockImplementation(() => {
        throw new Error('Internal Server Error');
      });

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });
  });

  describe('PUT /api/profile', () => {
    const updateData = {
      first_name: 'John',
      last_name: 'Doe',
      interests: ['music']
    };

    it('should call ProfileController.updateProfile', async () => {
      (ProfileController.updateProfile as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ profile: { ...updateData, id: 1 } });
      });

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('profile');
      expect(ProfileController.updateProfile).toHaveBeenCalled();
    });
  });

  describe('Photo Routes', () => {
    describe('POST /api/profile/photos', () => {
      const testImageBuffer = Buffer.from('fake image data');
      const mockPhoto = {
        id: '1',
        file_path: 'test.jpg',
        is_primary: true
      };

      it('should handle successful photo upload', async () => {
        (PhotoController.uploadPhoto as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            message: 'Photo uploaded successfully',
            photo: mockPhoto
          });
        });

        const response = await request(app)
          .post('/api/profile/photos')
          .set('Authorization', 'Bearer test-token')
          .attach('photo', testImageBuffer, {
            filename: 'test.jpg',
            contentType: 'image/jpeg'
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Photo uploaded successfully');
        expect(response.body.photo).toEqual(mockPhoto);
        expect(PhotoController.uploadPhoto).toHaveBeenCalled();
      });

      it('should handle maximum photos limit', async () => {
        (PhotoController.uploadPhoto as jest.Mock).mockImplementation((req, res) => {
          res.status(400).json({
            error: 'Maximum number of photos reached (5)'
          });
        });

        const response = await request(app)
          .post('/api/profile/photos')
          .set('Authorization', 'Bearer test-token')
          .attach('photo', testImageBuffer, {
            filename: 'test.jpg',
            contentType: 'image/jpeg'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Maximum number of photos reached (5)');
      });
    });

    describe('PUT /api/profile/photos/:photoId/primary', () => {
      it('should set photo as primary', async () => {
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
        expect(PhotoController.setPrimaryPhoto).toHaveBeenCalled();
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
        expect(PhotoController.deletePhoto).toHaveBeenCalled();
      });
    });
  });
});
