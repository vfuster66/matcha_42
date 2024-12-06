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
        // Construction d'un UserProfile représentant l'utilisateur courant
        const mainUserProfile: UserProfile = {
            id: 0, // À remplacer par l'ID réel de l'utilisateur, si disponible
            location: {
                city: filters.location.city,
                country: filters.location.country
            },
            interests: filters.interests,
            fameRating: 50, // Valeur par défaut, à ajuster
            gender: 'both', // Valeur par défaut, remplacer par la vraie info utilisateur
            sexualPreferences: filters.sexualPreference,
            age: Math.round((filters.ageRange.min + filters.ageRange.max) / 2) // approximation
        };

        return matches
            .filter(match => {
                const age = calculateAge(match.birth_date);
                const hasCommonInterests = match.interests && match.interests.some(
                    (i: string) => filters.interests.includes(i)
                );
                
                return (
                    age >= filters.ageRange.min && 
                    age <= filters.ageRange.max &&
                    hasCommonInterests
                );
            })
            .map(match => {
                const matchUserProfile: UserProfile = {
                    id: match.id,
                    location: { city: match.city, country: match.country },
                    interests: match.interests || [],
                    fameRating: 50, // Valeur par défaut, ajuster si vous avez la donnée
                    gender: match.gender,
                    sexualPreferences: match.sexual_preferences,
                    age: calculateAge(match.birth_date)
                };

                const score = calculateMatchScore(mainUserProfile, matchUserProfile);
                return { ...matchUserProfile, matchScore: score };
            })
            .sort((a, b) => b.matchScore - a.matchScore);
    }
}

export default MatchingService;
