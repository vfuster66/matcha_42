"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matching_1 = require("../../utils/matching");
describe('Matching Utils', () => {
    describe('calculateAge', () => {
        it('should calculate age correctly', () => {
            const today = new Date();
            const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
            expect((0, matching_1.calculateAge)(birthDate)).toBe(25);
        });
        it('should handle birthdays that have not occurred this year', () => {
            const today = new Date();
            const birthDate = new Date(today.getFullYear() - 25, today.getMonth() + 1, today.getDate());
            expect((0, matching_1.calculateAge)(birthDate)).toBe(24);
        });
        it('should handle same day birthdays', () => {
            const today = new Date();
            const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
            expect((0, matching_1.calculateAge)(birthDate)).toBe(25);
        });
        it('should handle leap years', () => {
            const today = new Date(2024, 2, 1); // March 1, 2024
            const birthDate = new Date(2000, 1, 29); // February 29, 2000
            jest.spyOn(Date, 'now').mockImplementation(() => today.getTime());
            expect((0, matching_1.calculateAge)(birthDate)).toBe(24);
        });
    });
    describe('calculateMatchScore', () => {
        const baseUser = {
            id: 1,
            location: { city: 'Paris', country: 'France' },
            interests: ['music', 'movies', 'travel'],
            fameRating: 80,
            gender: 'male',
            sexualPreferences: 'female',
            age: 25
        };
        it('should give maximum score for identical locations and interests', () => {
            const user2 = { ...baseUser, id: 2 };
            const score = (0, matching_1.calculateMatchScore)(baseUser, user2);
            expect(score).toBe(100);
        });
        it('should calculate score for same country but different city', () => {
            const user2 = {
                ...baseUser,
                id: 2,
                location: { ...baseUser.location, city: 'Lyon' }
            };
            const score = (0, matching_1.calculateMatchScore)(baseUser, user2);
            expect(score).toBe(75); // 25 (country) + 30 (interests) + 20 (fame)
        });
        it('should calculate score based on common interests', () => {
            const user2 = {
                ...baseUser,
                id: 2,
                location: { city: 'Berlin', country: 'Germany' },
                interests: ['music', 'sports']
            };
            const expectedInterestScore = (1 / 3) * 30; // 1 common interest out of 3
            const expectedFameScore = 20; // Same fame rating
            expect((0, matching_1.calculateMatchScore)(baseUser, user2)).toBe(expectedInterestScore + expectedFameScore);
        });
        it('should handle empty interests array', () => {
            const user2 = {
                ...baseUser,
                id: 2,
                interests: []
            };
            const score = (0, matching_1.calculateMatchScore)(baseUser, user2);
            expect(score).toBe(70); // 50 (location) + 0 (interests) + 20 (fame)
        });
        it('should handle different fame ratings', () => {
            const user2 = {
                ...baseUser,
                id: 2,
                fameRating: 30
            };
            const expectedFameScore = (100 - Math.abs(80 - 30)) * 0.2;
            const totalScore = 50 + 30 + expectedFameScore; // location + interests + fame
            expect((0, matching_1.calculateMatchScore)(baseUser, user2)).toBe(totalScore);
        });
    });
    describe('findMatches', () => {
        const baseUser = {
            id: 1,
            location: { city: 'Paris', country: 'France' },
            interests: ['music', 'movies'],
            fameRating: 80,
            gender: 'male',
            sexualPreferences: 'female',
            age: 25
        };
        const createPotentialMatch = (overrides = {}) => ({
            ...baseUser,
            id: Math.random(),
            ...overrides
        });
        it('should filter matches based on sexual preferences', async () => {
            const potentialMatches = [
                createPotentialMatch({
                    gender: 'female',
                    sexualPreferences: 'male'
                }),
                createPotentialMatch({
                    gender: 'male',
                    sexualPreferences: 'female'
                }),
                createPotentialMatch({
                    gender: 'female',
                    sexualPreferences: 'female'
                })
            ];
            const matches = await (0, matching_1.findMatches)(baseUser, potentialMatches);
            expect(matches).toHaveLength(1);
            expect(matches[0].gender).toBe('female');
            expect(matches[0].sexualPreferences).toBe('male');
        });
        it('should handle "both" sexual preferences', async () => {
            const userWithBothPreference = createPotentialMatch({
                gender: 'male',
                sexualPreferences: 'both'
            });
            const potentialMatches = [
                createPotentialMatch({
                    gender: 'female',
                    sexualPreferences: 'both'
                }),
                createPotentialMatch({
                    gender: 'male',
                    sexualPreferences: 'male'
                })
            ];
            const matches = await (0, matching_1.findMatches)(userWithBothPreference, potentialMatches);
            expect(matches).toHaveLength(2);
        });
        it('should sort matches by score in descending order', async () => {
            const potentialMatches = [
                createPotentialMatch({
                    gender: 'female',
                    sexualPreferences: 'male',
                    location: { city: 'Lyon', country: 'France' }
                }),
                createPotentialMatch({
                    gender: 'female',
                    sexualPreferences: 'male',
                    location: { city: 'Paris', country: 'France' }
                })
            ];
            const matches = await (0, matching_1.findMatches)(baseUser, potentialMatches);
            expect(matches).toHaveLength(2);
            expect(matches[0].matchScore).toBeGreaterThan(matches[1].matchScore);
        });
        it('should handle empty potential matches array', async () => {
            const matches = await (0, matching_1.findMatches)(baseUser, []);
            expect(matches).toEqual([]);
        });
        it('should handle no compatible matches', async () => {
            const potentialMatches = [
                createPotentialMatch({
                    gender: 'male',
                    sexualPreferences: 'male'
                }),
                createPotentialMatch({
                    gender: 'female',
                    sexualPreferences: 'female'
                })
            ];
            const matches = await (0, matching_1.findMatches)(baseUser, potentialMatches);
            expect(matches).toEqual([]);
        });
    });
});
