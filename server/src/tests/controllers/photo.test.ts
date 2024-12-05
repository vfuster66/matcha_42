// src/tests/controllers/photo.test.ts
import { PhotoController } from '../../controllers/photo';
import { ProfileModel } from '../../models/Profile';
import { PhotoService } from '../../services/photo';
import { Request, Response } from 'express';

jest.mock('../../models/Profile');
jest.mock('../../services/photo');

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (userId?: string, params?: any, body?: any, file?: any): any => ({
  user: userId ? { id: userId } : undefined,
  params,
  body,
  file,
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
      (ProfileModel.getPhotos as jest.Mock).mockResolvedValue([]);
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
      (ProfileModel.setPrimaryPhoto as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

      await PhotoController.setPrimaryPhoto(req, res);

      expect(ProfileModel.setPrimaryPhoto).toHaveBeenCalledWith('user-id', 'photo-id');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Primary photo updated successfully',
      });
    });
  });

  describe('deletePhoto', () => {
    it('should return 401 if user is unauthorized', async () => {
      req = mockRequest(undefined, { photoId: 'photo-id' });

      await PhotoController.deletePhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 400 if photoId is missing', async () => {
      req = mockRequest('user-id', {});

      await PhotoController.deletePhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Photo ID is required' });
    });

    it('should delete photo and respond with success message', async () => {
      req = mockRequest('user-id', { photoId: 'photo-id' });
      (PhotoService.deletePhoto as jest.Mock).mockResolvedValue({ success: true });

      await PhotoController.deletePhoto(req, res);

      expect(PhotoService.deletePhoto).toHaveBeenCalledWith('user-id', 'photo-id');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Photo deleted successfully',
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
  });
});
