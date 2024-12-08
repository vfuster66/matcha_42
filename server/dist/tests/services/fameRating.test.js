"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fameRating_1 = require("../../services/fameRating");
const database_1 = require("../../config/database");
// Mock de la base de données
jest.mock('../../config/database', () => ({
    db: {
        query: jest.fn(),
    },
}));
describe('FameRatingService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('calculateFameRating', () => {
        it('should calculate fame rating based on user stats', async () => {
            const mockStats = {
                photoCount: 5,
                flashesReceived: 20,
                profileViews: 40,
                messagesReceived: 10,
                messagesAnswered: 5,
                lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Activité récente
                isProfileComplete: true,
            };
            jest.spyOn(fameRating_1.FameRatingService, 'getUserStats').mockResolvedValueOnce(mockStats);
            const rating = await fameRating_1.FameRatingService.calculateFameRating('user-id');
            expect(rating).toBeLessThanOrEqual(100);
            expect(rating).toBeGreaterThanOrEqual(0);
        });
        it('should return default fame rating on error', async () => {
            jest.spyOn(fameRating_1.FameRatingService, 'getUserStats').mockRejectedValueOnce(new Error('DB Error'));
            const rating = await fameRating_1.FameRatingService.calculateFameRating('user-id');
            expect(rating).toBe(50); // Valeur par défaut
        });
    });
    describe('getUserStats', () => {
        it('should return user stats from the database', async () => {
            const mockQueryResult = {
                rows: [
                    {
                        photo_count: 3,
                        flashes_received: 15,
                        profile_views: 25,
                        messages_received: 8,
                        messages_sent: 5,
                        last_activity: new Date(),
                        is_profile_complete: true,
                    },
                ],
            };
            database_1.db.query.mockResolvedValueOnce(mockQueryResult);
            const stats = await fameRating_1.FameRatingService.getUserStats('user-id');
            expect(database_1.db.query).toHaveBeenCalledWith(expect.any(String), ['user-id']);
            expect(stats).toEqual({
                photoCount: 3,
                flashesReceived: 15,
                profileViews: 25,
                messagesReceived: 8,
                messagesAnswered: 5,
                lastActivity: mockQueryResult.rows[0].last_activity,
                isProfileComplete: true,
            });
        });
        it('should handle missing or null values in stats', async () => {
            const mockQueryResult = {
                rows: [
                    {
                        photo_count: null,
                        flashes_received: null,
                        profile_views: null,
                        messages_received: null,
                        messages_sent: null,
                        last_activity: null,
                        is_profile_complete: null,
                    },
                ],
            };
            database_1.db.query.mockResolvedValueOnce(mockQueryResult);
            const stats = await fameRating_1.FameRatingService.getUserStats('user-id');
            expect(stats).toEqual({
                photoCount: 0,
                flashesReceived: 0,
                profileViews: 0,
                messagesReceived: 0,
                messagesAnswered: 0,
                lastActivity: null,
                isProfileComplete: false,
            });
        });
    });
    describe('updateFameRating', () => {
        it('should update the fame rating in the database', async () => {
            jest.spyOn(fameRating_1.FameRatingService, 'calculateFameRating').mockResolvedValueOnce(85);
            await fameRating_1.FameRatingService.updateFameRating('user-id');
            expect(fameRating_1.FameRatingService.calculateFameRating).toHaveBeenCalledWith('user-id');
            expect(database_1.db.query).toHaveBeenCalledWith('UPDATE profiles SET fame_rating = $1 WHERE user_id = $2', [85, 'user-id']);
        });
        it('should handle errors during update', async () => {
            jest.spyOn(fameRating_1.FameRatingService, 'calculateFameRating').mockRejectedValueOnce(new Error('DB Error'));
            await expect(fameRating_1.FameRatingService.updateFameRating('user-id')).rejects.toThrow('DB Error');
        });
    });
    describe('getFameRating', () => {
        it('should return the fame rating from the database', async () => {
            database_1.db.query.mockResolvedValueOnce({
                rows: [{ fame_rating: 75 }],
            });
            const rating = await fameRating_1.FameRatingService.getFameRating('user-id');
            expect(database_1.db.query).toHaveBeenCalledWith('SELECT fame_rating FROM profiles WHERE user_id = $1', ['user-id']);
            expect(rating).toBe(75);
        });
        it('should return default fame rating if no value is found', async () => {
            database_1.db.query.mockResolvedValueOnce({ rows: [] });
            const rating = await fameRating_1.FameRatingService.getFameRating('user-id');
            expect(rating).toBe(50); // Valeur par défaut
        });
        it('should handle errors during retrieval', async () => {
            database_1.db.query.mockRejectedValueOnce(new Error('DB Error'));
            await expect(fameRating_1.FameRatingService.getFameRating('user-id')).rejects.toThrow('DB Error');
        });
    });
});
