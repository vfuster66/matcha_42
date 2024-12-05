import { ProfileModel } from '../../models/Profile';
import { db } from '../../config/database';

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

            (db.query as jest.Mock).mockResolvedValue({
                rows: [mockProfile]
            });

            const result = await ProfileModel.create('test-id', mockProfile);
            expect(result).toEqual(mockProfile);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO profiles'),
                expect.arrayContaining([
                    'test-id',
                    mockProfile.first_name,
                    mockProfile.last_name,
                    mockProfile.gender,
                    mockProfile.sexual_preferences,
                    mockProfile.biography,
                    mockProfile.birth_date
                ])
            );
        });

        it('should handle database errors', async () => {
            (db.query as jest.Mock).mockRejectedValue(new Error('Database error'));
            await expect(ProfileModel.create('test-id', {})).rejects.toThrow('Database error');
        });
    });

    describe('update', () => {
        it('should update an existing profile', async () => {
            const mockProfile = {
                user_id: 'test-id',
                biography: 'Updated bio'
            };

            (db.query as jest.Mock).mockResolvedValue({
                rows: [mockProfile]
            });

            const result = await ProfileModel.update('test-id', mockProfile);
            expect(result).toEqual(mockProfile);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE profiles'),
                expect.any(Array)
            );
        });
    });

    describe('findByUserId', () => {
        it('should find profile by user id', async () => {
            const mockProfile = {
                user_id: 'test-id',
                first_name: 'John'
            };

            (db.query as jest.Mock).mockResolvedValue({
                rows: [mockProfile]
            });

            const result = await ProfileModel.findByUserId('test-id');
            expect(result).toEqual(mockProfile);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ['test-id']
            );
        });

        it('should return null when profile not found', async () => {
            (db.query as jest.Mock).mockResolvedValue({
                rows: []
            });

            const result = await ProfileModel.findByUserId('test-id');
            expect(result).toBeNull();
        });
    });

    describe('Interest Management', () => {
        describe('addInterest', () => {
            it('should add a new interest', async () => {
                (db.query as jest.Mock)
                    .mockResolvedValueOnce({ rows: [] })
                    .mockResolvedValueOnce({ rows: [{ name: 'music' }] });

                await ProfileModel.addInterest('test-id', 'music');
                expect(db.query).toHaveBeenCalledTimes(2);
                expect(db.query).toHaveBeenLastCalledWith(
                    expect.stringContaining('INSERT INTO user_interests'),
                    ['test-id', 'music']
                );
            });
        });

        describe('removeInterest', () => {
            it('should remove an interest', async () => {
                (db.query as jest.Mock).mockResolvedValue({ rows: [] });

                await ProfileModel.removeInterest('test-id', 'music');
                expect(db.query).toHaveBeenCalledWith(
                    expect.stringContaining('DELETE FROM user_interests'),
                    ['test-id', 'music']
                );
            });
        });

        describe('getInterests', () => {
            it('should return user interests', async () => {
                const mockInterests = [
                    { name: 'music' },
                    { name: 'sports' }
                ];

                (db.query as jest.Mock).mockResolvedValue({
                    rows: mockInterests
                });

                const result = await ProfileModel.getInterests('test-id');
                expect(result).toEqual(['music', 'sports']);
            });

            it('should return empty array when no interests found', async () => {
                (db.query as jest.Mock).mockResolvedValue({ rows: [] });
                const result = await ProfileModel.getInterests('test-id');
                expect(result).toEqual([]);
            });
        });
    });

    describe('Photo Management', () => {
        describe('setPrimaryPhoto', () => {
            it('should set a photo as primary', async () => {
                // Mock la transaction BEGIN
                (db.query as jest.Mock)
                    .mockResolvedValueOnce({ rows: [] }) // BEGIN
                    .mockResolvedValueOnce({  // Vérification de la photo
                        rows: [{
                            id: '1',
                            user_id: 'test-id',
                            is_primary: false
                        }]
                    })
                    .mockResolvedValueOnce({ rows: [] }) // Reset autres photos
                    .mockResolvedValueOnce({ rows: [] }) // Set nouvelle photo primaire
                    .mockResolvedValueOnce({ rows: [] }); // COMMIT
    
                await ProfileModel.setPrimaryPhoto('test-id', '1');
                
                expect(db.query).toHaveBeenCalledTimes(5);
                expect(db.query).toHaveBeenNthCalledWith(1, 'BEGIN');
                expect(db.query).toHaveBeenNthCalledWith(2, 
                    expect.stringContaining('SELECT id FROM profile_pictures'),
                    ['1', 'test-id']
                );
                expect(db.query).toHaveBeenNthCalledWith(3,
                    expect.stringContaining('UPDATE profile_pictures SET is_primary = false'),
                    ['test-id']
                );
                expect(db.query).toHaveBeenNthCalledWith(4,
                    expect.stringContaining('UPDATE profile_pictures SET is_primary = true'),
                    ['1']
                );
                expect(db.query).toHaveBeenNthCalledWith(5, 'COMMIT');
            });
    
            it('should fail if photo not found', async () => {
                (db.query as jest.Mock)
                    .mockResolvedValueOnce({ rows: [] }) // BEGIN
                    .mockResolvedValueOnce({ rows: [] }); // Vérification photo échoue
    
                await expect(
                    ProfileModel.setPrimaryPhoto('test-id', '999')
                ).rejects.toThrow('Photo not found or unauthorized');
            });
        });

        describe('deletePhoto', () => {
            it('should delete a non-primary photo', async () => {
                const mockPhoto = {
                    id: '1',
                    user_id: 'test-id',
                    file_path: 'test.jpg',
                    is_primary: false
                };

                (db.query as jest.Mock)
                    .mockResolvedValueOnce({ rows: [] }) // BEGIN
                    .mockResolvedValueOnce({  // Vérification photo
                        rows: [mockPhoto]
                    })
                    .mockResolvedValueOnce({ rows: [mockPhoto] }) // DELETE
                    .mockResolvedValueOnce({ rows: [] }); // COMMIT

                await ProfileModel.deletePhoto('test-id', '1');

                expect(db.query).toHaveBeenCalledTimes(4);
                expect(db.query).toHaveBeenNthCalledWith(1, 'BEGIN');
                expect(db.query).toHaveBeenNthCalledWith(2, 
                    expect.stringContaining('SELECT file_path, is_primary FROM profile_pictures'),
                    ['1', 'test-id']
                );
                expect(db.query).toHaveBeenNthCalledWith(3,
                    expect.stringContaining('DELETE FROM profile_pictures'),
                    ['1', 'test-id']
                );
            });

            it('should delete primary photo and set new primary', async () => {
                const mockPrimaryPhoto = {
                    id: '1',
                    user_id: 'test-id',
                    file_path: 'test1.jpg',
                    is_primary: true
                };

                const mockNextPhoto = {
                    id: '2',
                    user_id: 'test-id',
                    file_path: 'test2.jpg',
                    is_primary: false
                };

                (db.query as jest.Mock)
                    .mockResolvedValueOnce({ rows: [] }) // BEGIN
                    .mockResolvedValueOnce({  // Vérification photo
                        rows: [mockPrimaryPhoto]
                    })
                    .mockResolvedValueOnce({ rows: [mockPrimaryPhoto] }) // DELETE
                    .mockResolvedValueOnce({ rows: [mockNextPhoto] }) // SELECT next photo
                    .mockResolvedValueOnce({ rows: [{ ...mockNextPhoto, is_primary: true }] }); // UPDATE new primary

                await ProfileModel.deletePhoto('test-id', '1');

                expect(db.query).toHaveBeenCalledTimes(5);
                expect(db.query).toHaveBeenNthCalledWith(1, 'BEGIN');
                expect(db.query).toHaveBeenNthCalledWith(2, 
                    expect.stringContaining('SELECT file_path, is_primary FROM profile_pictures'),
                    ['1', 'test-id']
                );
            });

            it('should fail if photo not found', async () => {
                (db.query as jest.Mock)
                    .mockResolvedValueOnce({ rows: [] }) // BEGIN
                    .mockResolvedValueOnce({ rows: [] }); // Vérification photo échoue

                await expect(
                    ProfileModel.deletePhoto('test-id', '999')
                ).rejects.toThrow('Photo not found or unauthorized');
            });
        });
    });
});