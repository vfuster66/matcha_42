"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const matching_1 = __importDefault(require("../../services/matching"));
const database_1 = require("../../config/database");
const matching_2 = require("../../utils/matching");
// Mocks
jest.mock('../../config/database', () => ({
    db: { query: jest.fn() }
}));
jest.mock('../../utils/matching', () => ({
    calculateAge: jest.fn(),
    calculateMatchScore: jest.fn(() => 75)
}));
describe('MatchingService', () => {
    let matchingService;
    const baseUser = {
        id: 1,
        age: 30,
        gender: 'male',
        sexualPreferences: 'female',
        location: {
            city: 'Paris',
            country: 'France'
        },
        interests: ['sports', 'music'],
        fameRating: 50
    };
    const baseFilters = {
        ageRange: { min: 25, max: 35 },
        distance: 10,
        interests: ['music', 'sports'],
        sexualPreference: 'female',
        location: { city: 'Paris', country: 'France' },
        fameRange: { min: 40, max: 80 }
    };
    beforeEach(() => {
        matchingService = new matching_1.default();
        jest.clearAllMocks();
        // Configuration du mock de calculateAge
        matching_2.calculateAge.mockImplementation((birthDate) => {
            const dates = {
                '2004-01-01': 20,
                '1979-01-01': 45,
                '1994-01-01': 30,
                '1990-01-01': 34,
                '1992-01-01': 32
            };
            return dates[birthDate] || 30;
        });
    });
    describe('getPotentialMatches', () => {
        const createDbMatch = (overrides = {}) => ({
            id: 1,
            gender: 'male',
            sexualPreferences: 'female',
            location: { city: 'Paris', country: 'France' },
            birth_date: '1994-01-01',
            interests: ['sports', 'music'],
            ...overrides
        });
        it('should return potential matches with scores', async () => {
            const mockDbResult = {
                rows: [
                    createDbMatch(),
                    createDbMatch({
                        id: 2,
                        birth_date: '1992-01-01',
                        interests: ['music', 'reading']
                    })
                ]
            };
            database_1.db.query.mockResolvedValueOnce(mockDbResult);
            const matches = await matchingService.getPotentialMatches(1, baseFilters);
            expect(database_1.db.query).toHaveBeenCalledWith(expect.any(String), [1, 'female', 'Paris', 'France']);
            expect(matching_2.calculateAge).toHaveBeenCalled();
            expect(matching_2.calculateMatchScore).toHaveBeenCalled();
            expect(matches).toHaveLength(2);
            expect(matches[0]).toHaveProperty('matchScore');
        });
        it('should handle empty results', async () => {
            database_1.db.query.mockResolvedValueOnce({ rows: [] });
            const matches = await matchingService.getPotentialMatches(1, baseFilters);
            expect(matches).toEqual([]);
        });
        it('should handle database errors', async () => {
            database_1.db.query.mockRejectedValueOnce(new Error('DB Error'));
            await expect(matchingService.getPotentialMatches(1, baseFilters))
                .rejects.toThrow('DB Error');
        });
    });
    describe('filterAndScoreMatches', () => {
        const createMatch = (overrides = {}) => ({
            ...baseUser,
            matchScore: 75,
            birth_date: '1994-01-01',
            ...overrides
        });
        it('should filter by age correctly', async () => {
            const matches = [
                createMatch({ birth_date: '2004-01-01' }), // 20 ans
                createMatch({ birth_date: '1979-01-01' }), // 45 ans
                createMatch({ birth_date: '1994-01-01' }) // 30 ans
            ];
            const result = await matchingService
                .filterAndScoreMatches(matches, baseFilters);
            expect(result).toHaveLength(1);
            expect((0, matching_2.calculateAge)(result[0].birth_date)).toBe(30);
        });
        it('should filter by interests', async () => {
            const matches = [
                createMatch({ interests: ['reading', 'cooking'] }),
                createMatch({ interests: ['sports', 'music'] })
            ];
            const result = await matchingService
                .filterAndScoreMatches(matches, baseFilters);
            expect(result).toHaveLength(1);
            expect(result[0].interests).toContain('sports');
        });
        it('should handle edge cases for interests', async () => {
            const testCases = [
                { interests: [], expected: 0 },
                { interests: ['music'], expected: 1 },
                { interests: null, expected: 0 },
                { interests: undefined, expected: 0 }
            ];
            for (const { interests, expected } of testCases) {
                const matches = [createMatch({ interests })];
                const result = await matchingService
                    .filterAndScoreMatches(matches, baseFilters);
                expect(result).toHaveLength(expected);
            }
        });
    });
    describe('getFilteredAndSortedMatches', () => {
        const mockMatches = [
            {
                id: 1,
                age: 30,
                fameRating: 50,
                location: { city: 'Paris', country: 'France' },
                interests: ['sports', 'music'],
                matchScore: 80,
                gender: 'male',
                sexualPreferences: 'female'
            },
            {
                id: 2,
                age: 25,
                fameRating: 70,
                location: { city: 'Lyon', country: 'France' },
                interests: ['music', 'reading'],
                matchScore: 60,
                gender: 'female',
                sexualPreferences: 'male'
            },
            {
                id: 3,
                age: 28,
                fameRating: 55,
                location: { city: 'Paris', country: 'France' },
                interests: ['sports', 'cooking', 'music'],
                matchScore: 70,
                gender: 'female',
                sexualPreferences: 'both'
            }
        ];
        const baseFilters = {
            ageRange: { min: 25, max: 35 },
            distance: 10,
            interests: ['music', 'sports', 'reading'],
            sexualPreference: 'female',
            location: { city: 'Paris', country: 'France' },
            fameRange: { min: 40, max: 80 }
        };
        beforeEach(() => {
            matchingService = new matching_1.default();
            jest.spyOn(matchingService, 'getPotentialMatches')
                .mockResolvedValue(mockMatches);
        });
        it('should apply multiple filters simultaneously', async () => {
            const complexFilters = {
                ...baseFilters,
                fameRange: { min: 60, max: 75 },
                ageRange: { min: 24, max: 26 }
            };
            const result = await matchingService.getFilteredAndSortedMatches(1, complexFilters, { sortBy: 'fameRating', order: 'desc' });
            expect(result).toHaveLength(1);
            expect(result[0].age).toBe(25);
            expect(result[0].fameRating).toBe(70);
        });
        it('should sort by common tags with mixed interests', async () => {
            // Ajout d'un match avec un mélange d'intérêts
            const mixedMatches = [
                ...mockMatches,
                {
                    ...mockMatches[0],
                    id: 4,
                    interests: ['sports', 'music', 'reading', 'cooking'],
                    matchScore: 90
                }
            ];
            jest.spyOn(matchingService, 'getPotentialMatches')
                .mockResolvedValue(mixedMatches);
            // Test tri descendant
            const resultDesc = await matchingService.getFilteredAndSortedMatches(1, baseFilters, { sortBy: 'commonTags', order: 'desc' });
            expect(resultDesc[0].interests).toHaveLength(4);
            expect(resultDesc[0].id).toBe(4);
            // Test tri ascendant
            const resultAsc = await matchingService.getFilteredAndSortedMatches(1, baseFilters, { sortBy: 'commonTags', order: 'asc' });
            expect(resultAsc[resultAsc.length - 1].interests).toHaveLength(4);
        });
        it('should handle location sorting with multiple matches in same city', async () => {
            const sameLocationMatches = [
                ...mockMatches,
                {
                    ...mockMatches[0],
                    id: 4,
                    location: { city: 'Paris', country: 'France' },
                    matchScore: 95
                }
            ];
            jest.spyOn(matchingService, 'getPotentialMatches')
                .mockResolvedValue(sameLocationMatches);
            const result = await matchingService.getFilteredAndSortedMatches(1, baseFilters, { sortBy: 'location', order: 'asc' });
            const parisMatches = result.filter(m => m.location.city === 'Paris');
            expect(parisMatches).toHaveLength(3);
            expect(parisMatches[0].matchScore).toBeGreaterThanOrEqual(parisMatches[1].matchScore);
        });
        it('should properly handle "both" sexual preferences in filtering', async () => {
            const bothPreferenceFilters = {
                ...baseFilters,
                sexualPreference: 'both'
            };
            const result = await matchingService.getFilteredAndSortedMatches(1, bothPreferenceFilters, { sortBy: 'matchScore', order: 'desc' });
            expect(result.some(match => match.sexualPreferences === 'both')).toBe(true);
        });
        it('should maintain stable order when sorting scores are equal', async () => {
            const equalScoreMatches = [
                ...mockMatches,
                {
                    ...mockMatches[0],
                    id: 4,
                    matchScore: 80, // Même score que le premier match
                    fameRating: 50
                }
            ];
            jest.spyOn(matchingService, 'getPotentialMatches')
                .mockResolvedValue(equalScoreMatches);
            const result = await matchingService.getFilteredAndSortedMatches(1, baseFilters, { sortBy: 'matchScore', order: 'desc' });
            const highScoreMatches = result.filter(m => m.matchScore === 80);
            expect(highScoreMatches).toHaveLength(2);
            expect(highScoreMatches[0].id).toBe(1); // Vérifie l'ordre stable
        });
        it('should handle edge cases in fame rating range', async () => {
            const edgeCaseFilters = {
                ...baseFilters,
                fameRange: { min: 50, max: 50 } // Test avec min = max
            };
            const result = await matchingService.getFilteredAndSortedMatches(1, edgeCaseFilters, { sortBy: 'fameRating', order: 'desc' });
            expect(result.every(match => match.fameRating === 50)).toBe(true);
        });
        it('should sort by various criteria', async () => {
            const testCases = [
                {
                    sortBy: 'age',
                    order: 'asc',
                    checkFn: (result) => expect(result[0].age).toBe(25)
                },
                {
                    sortBy: 'fameRating',
                    order: 'desc',
                    checkFn: (result) => expect(result[0].fameRating).toBe(70)
                },
                {
                    sortBy: 'location',
                    order: 'asc',
                    checkFn: (result) => expect(result[0].location.city).toBe('Paris')
                }
            ];
            for (const { sortBy, order, checkFn } of testCases) {
                const result = await matchingService
                    .getFilteredAndSortedMatches(1, baseFilters, { sortBy, order });
                checkFn(result);
            }
        });
        it('should apply fame range filter', async () => {
            const filters = {
                ...baseFilters,
                fameRange: { min: 60, max: 80 }
            };
            const result = await matchingService.getFilteredAndSortedMatches(1, filters, { sortBy: 'fameRating', order: 'desc' });
            expect(result).toHaveLength(1);
            expect(result[0].fameRating).toBe(70);
        });
        it('should handle empty results', async () => {
            jest.spyOn(matchingService, 'getPotentialMatches')
                .mockResolvedValue([]);
            const result = await matchingService.getFilteredAndSortedMatches(1, baseFilters, { sortBy: 'age', order: 'asc' });
            expect(result).toHaveLength(0);
        });
        it('should handle invalid sort options', async () => {
            const result = await matchingService.getFilteredAndSortedMatches(1, baseFilters, { sortBy: 'invalid', order: 'desc' });
            expect(result).toEqual(mockMatches);
        });
    });
});
function createMatch(overrides = {}) {
    return {
        id: 1,
        age: 30,
        gender: 'male',
        sexualPreferences: 'female',
        location: {
            city: 'Paris',
            country: 'France'
        },
        interests: ['sports', 'music'],
        fameRating: 50,
        matchScore: 75,
        birth_date: '1994-01-01',
        ...overrides
    };
}
