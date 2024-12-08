// server/src/services/matching.ts
import { db } from '../config/database';
import { calculateAge, calculateMatchScore, UserProfile } from '../utils/matching';

interface MatchFilters {
    ageRange: { min: number; max: number };
    distance: number; // en km
    interests: string[];
    sexualPreference: string;
    location: {
        city: string;
        country: string;
    };
}

interface SortOptions {
    sortBy: 'age' | 'location' | 'fameRating' | 'commonTags';
    order: 'asc' | 'desc';
}

interface MatchFilters {
    ageRange: { min: number; max: number };
    distance: number;
    interests: string[];
    sexualPreference: string;
    location: {
        city: string;
        country: string;
    };
    fameRange?: { min: number; max: number };
}

class MatchingService {
    async getPotentialMatches(userId: number, filters: MatchFilters) {
        const query = `
            SELECT 
                u.id, u.gender, u.sexual_preferences,
                u.city, u.country,
                u.birth_date,
                array_agg(i.tag) as interests
            FROM users u
            LEFT JOIN user_interests i ON u.id = i.user_id
            WHERE u.id != $1
            AND u.is_active = true
            AND (
                u.sexual_preferences = $2 
                OR u.sexual_preferences = 'both'
            )
            AND (
                u.city = $3 
                OR u.country = $4
            )
            GROUP BY u.id
        `;
 
        const result = await db.query(query, [
            userId, 
            filters.sexualPreference,
            filters.location.city,
            filters.location.country
        ]);

        const matches = result.rows; // rows est reconnu par TypeScript si db est bien typé

        return this.filterAndScoreMatches(matches, filters);
    }
 
    private filterAndScoreMatches(matches: any[], filters: MatchFilters) {
        // Construire le profil principal de l'utilisateur
        const mainUserProfile: UserProfile = {
            id: 0,
            location: {
                city: filters.location.city,
                country: filters.location.country,
            },
            interests: filters.interests,
            fameRating: 50,
            gender: 'both',
            sexualPreferences: filters.sexualPreference,
            age: Math.round((filters.ageRange.min + filters.ageRange.max) / 2),
        };
    
        // Précalculer les âges
        const matchesWithAge = matches.map(match => ({
            ...match,
            age: calculateAge(match.birth_date),
        }));
    
        // Filtrer les utilisateurs et calculer les scores
        return matchesWithAge
            .filter(match => {
                const hasCommonInterests = match.interests?.some(
                    (i: string) => filters.interests.includes(i)
                );
    
                return (
                    match.age >= filters.ageRange.min &&
                    match.age <= filters.ageRange.max &&
                    hasCommonInterests
                );
            })
            .map(match => {
                const matchUserProfile: UserProfile = {
                    id: match.id,
                    location: { city: match.city, country: match.country },
                    interests: match.interests || [],
                    fameRating: 50,
                    gender: match.gender,
                    sexualPreferences: match.sexual_preferences,
                    age: match.age,
                };
    
                const score = calculateMatchScore(mainUserProfile, matchUserProfile);
    
                return { ...matchUserProfile, matchScore: score };
            })
            .sort((a, b) => b.matchScore - a.matchScore);
    }
    

    async getFilteredAndSortedMatches(
        userId: number, 
        filters: MatchFilters, 
        sortOptions: SortOptions
    ) {
        // D'abord obtenir les matches potentiels
        let matches = await this.getPotentialMatches(userId, filters);
        
        // Appliquer les filtres supplémentaires
        if (filters.fameRange) {
            matches = matches.filter(match => 
                match.fameRating >= filters.fameRange!.min && 
                match.fameRating <= filters.fameRange!.max
            );
        }

        // Appliquer le tri
        return matches.sort((a, b) => {
            switch(sortOptions.sortBy) {
                case 'age':
                    const comparison = a.age - b.age;
                    return sortOptions.order === 'asc' ? comparison : -comparison;
                
                case 'location':
                    if (a.location.city === filters.location.city) return -1;
                    if (b.location.city === filters.location.city) return 1;
                    return 0;
                
                case 'fameRating':
                    return sortOptions.order === 'asc' 
                        ? a.fameRating - b.fameRating 
                        : b.fameRating - a.fameRating;
                
                case 'commonTags':
                    const aCommonTags = a.interests.filter(tag => 
                        filters.interests.includes(tag)).length;
                    const bCommonTags = b.interests.filter(tag => 
                        filters.interests.includes(tag)).length;
                    return sortOptions.order === 'asc' 
                        ? aCommonTags - bCommonTags 
                        : bCommonTags - aCommonTags;
                
                default:
                    return 0;
            }
        });
    }
}

export default MatchingService;
