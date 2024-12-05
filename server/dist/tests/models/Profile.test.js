"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/models/Profile.test.ts
const Profile_1 = require("../../models/Profile");
const database_1 = require("../../config/database");
jest.mock('../../config/database', () => ({
    db: {
        query: jest.fn()
    }
}));
describe('ProfileModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create a new profile', async () => {
            const mockProfile = {
                user_id: 'test-id',
                first_name: 'John',
                last_name: 'Doe',
                gender: 'male',
                sexual_preferences: 'female',
                biography: 'Test bio',
                birth_date: new Date('1990-01-01')
            };
            database_1.db.query.mockResolvedValue({
                rows: [mockProfile]
            });
            const result = await Profile_1.ProfileModel.create('test-id', mockProfile);
            expect(result).toEqual(mockProfile);
            expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO profiles'), expect.arrayContaining([
                'test-id',
                mockProfile.first_name,
                mockProfile.last_name,
                mockProfile.gender,
                mockProfile.sexual_preferences,
                mockProfile.biography,
                mockProfile.birth_date
            ]));
        });
        it('should handle database errors', async () => {
            database_1.db.query.mockRejectedValue(new Error('Database error'));
            await expect(Profile_1.ProfileModel.create('test-id', {})).rejects.toThrow('Database error');
        });
    });
    describe('update', () => {
        it('should update an existing profile', async () => {
            const mockProfile = {
                user_id: 'test-id',
                biography: 'Updated bio'
            };
            database_1.db.query.mockResolvedValue({
                rows: [mockProfile]
            });
            const result = await Profile_1.ProfileModel.update('test-id', mockProfile);
            expect(result).toEqual(mockProfile);
            expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE profiles'), expect.any(Array));
        });
    });
    describe('findByUserId', () => {
        it('should find profile by user id', async () => {
            const mockProfile = {
                user_id: 'test-id',
                first_name: 'John'
            };
            database_1.db.query.mockResolvedValue({
                rows: [mockProfile]
            });
            const result = await Profile_1.ProfileModel.findByUserId('test-id');
            expect(result).toEqual(mockProfile);
        });
        it('should return null when profile not found', async () => {
            database_1.db.query.mockResolvedValue({
                rows: []
            });
            const result = await Profile_1.ProfileModel.findByUserId('test-id');
            expect(result).toBeNull();
        });
    });
    describe('interest management', () => {
        describe('addInterest', () => {
            it('should add a new interest', async () => {
                database_1.db.query.mockResolvedValueOnce({ rows: [] })
                    .mockResolvedValueOnce({ rows: [] });
                await Profile_1.ProfileModel.addInterest('test-id', 'music');
                expect(database_1.db.query).toHaveBeenCalledTimes(2);
            });
        });
        describe('removeInterest', () => {
            it('should remove an interest', async () => {
                database_1.db.query.mockResolvedValue({ rows: [] });
                await Profile_1.ProfileModel.removeInterest('test-id', 'music');
                expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM user_interests'), ['test-id', 'music']);
            });
        });
        describe('getInterests', () => {
            it('should return user interests', async () => {
                const mockInterests = [
                    { name: 'music' },
                    { name: 'sports' }
                ];
                database_1.db.query.mockResolvedValue({
                    rows: mockInterests
                });
                const result = await Profile_1.ProfileModel.getInterests('test-id');
                expect(result).toEqual(['music', 'sports']);
            });
            it('should return empty array when no interests found', async () => {
                database_1.db.query.mockResolvedValue({
                    rows: []
                });
                const result = await Profile_1.ProfileModel.getInterests('test-id');
                expect(result).toEqual([]);
            });
        });
        describe('Photo management', () => {
            describe('addPhoto', () => {
                it('should add a photo to the database', async () => {
                    database_1.db.query.mockResolvedValue({ rows: [] });
                    await Profile_1.ProfileModel.addPhoto('test-id', 'photo.jpg', true);
                    expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO profile_pictures'), ['test-id', 'photo.jpg', true]);
                });
            });
            describe('getPhotos', () => {
                it('should return photos of a user', async () => {
                    const mockPhotos = [
                        { id: '1', file_path: 'photo1.jpg', is_primary: true, created_at: new Date() },
                        { id: '2', file_path: 'photo2.jpg', is_primary: false, created_at: new Date() }
                    ];
                    database_1.db.query.mockResolvedValue({ rows: mockPhotos });
                    const result = await Profile_1.ProfileModel.getPhotos('test-id');
                    expect(result).toEqual(mockPhotos);
                    expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT id, file_path, is_primary, created_at'), ['test-id']);
                });
            });
            describe('setPrimaryPhoto', () => {
                it('should update the primary photo for a user', async () => {
                    database_1.db.query.mockResolvedValue({ rows: [] });
                    await Profile_1.ProfileModel.setPrimaryPhoto('test-id', 'photo-id');
                    expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE profile_pictures SET is_primary = false'), ['test-id']);
                    expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE profile_pictures SET is_primary = true'), ['photo-id']);
                });
                it('should throw an error if photo does not belong to the user', async () => {
                    database_1.db.query.mockResolvedValue({ rows: [] });
                    await expect(Profile_1.ProfileModel.setPrimaryPhoto('test-id', 'invalid-photo-id')).rejects.toThrow('Photo not found or unauthorized');
                });
            });
            describe('deletePhoto', () => {
                it('should delete a photo from the database', async () => {
                    const mockPhoto = { file_path: 'photo.jpg', is_primary: false };
                    database_1.db.query.mockResolvedValueOnce({ rows: [mockPhoto] }).mockResolvedValueOnce({
                        rows: []
                    });
                    await Profile_1.ProfileModel.deletePhoto('test-id', 'photo-id');
                    expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM profile_pictures'), ['photo-id', 'test-id']);
                });
                it('should set a new primary photo if the deleted photo was primary', async () => {
                    const mockPhoto = { file_path: 'photo.jpg', is_primary: true };
                    database_1.db.query.mockResolvedValueOnce({ rows: [mockPhoto] }).mockResolvedValueOnce({
                        rows: []
                    });
                    await Profile_1.ProfileModel.deletePhoto('test-id', 'photo-id');
                    expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE profile_pictures SET is_primary = true'), ['test-id']);
                });
                it('should throw an error if photo does not exist', async () => {
                    database_1.db.query.mockResolvedValue({ rows: [] });
                    await expect(Profile_1.ProfileModel.deletePhoto('test-id', 'invalid-photo-id')).rejects.toThrow('Photo not found or unauthorized');
                });
            });
        });
    });
});
