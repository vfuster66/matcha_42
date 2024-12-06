// server/src/utils/matching.ts

interface UserProfile {
    id: number;
    location: { city: string; country: string };
    interests: string[];
    fameRating: number;
    gender: string;
    sexualPreferences: string;
    age: number;
}

export function calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

interface ScoredUserProfile extends UserProfile {
    matchScore: number;
}

// Export de la fonction calculateMatchScore en dehors d’une classe
export function calculateMatchScore(user1: UserProfile, user2: UserProfile): number {
    let score = 0;
    
    // Location (30%)
    if (user1.location.city === user2.location.city) score += 30;
    else if (user1.location.country === user2.location.country) score += 15;
    
    // Intérêts communs (40%)
    const commonInterests = user1.interests.filter(tag => user2.interests.includes(tag));
    score += (commonInterests.length / Math.max(user1.interests.length, 1)) * 40;
    
    // Différence de "fame rating" (30%)
    const fameRatingDiff = Math.abs(user1.fameRating - user2.fameRating);
    score += (100 - fameRatingDiff) * 0.3;
    
    return Math.min(score, 100);
}

// Fonction utilitaire pour trouver des matches (facultatif, utilisé si besoin)
export async function findMatches(user: UserProfile, potentialMatches: UserProfile[]): Promise<ScoredUserProfile[]> {
    return potentialMatches
        .filter(match => {
            // Filtrage par orientation sexuelle
            const genderMatch = 
                (user.sexualPreferences === 'both' || user.sexualPreferences === match.gender) &&
                (match.sexualPreferences === 'both' || match.sexualPreferences === user.gender);
            
            return genderMatch;
        })
        .map(match => ({
            ...match,
            matchScore: calculateMatchScore(user, match)
        }))
        .sort((a, b) => b.matchScore - a.matchScore);
}

export type { UserProfile, ScoredUserProfile };
