import { db } from '../config/database';

export class FameRatingService {
    static readonly MAX_RATING = 100;
    static readonly MIN_RATING = 0;

    // Calcul du fame rating basé sur plusieurs critères
    static async calculateFameRating(userId: string): Promise<number> {
        try {
            const stats = await this.getUserStats(userId);
            
            let rating = 50; // Score de base

            // Photos (20 points max)
            rating += (stats.photoCount / 5) * 20;

            // Profil complété (10 points)
            rating += stats.isProfileComplete ? 10 : 0;

            // Nombre de "flash" reçus (25 points max)
            rating += Math.min((stats.flashesReceived / 10) * 25, 25);

            // Nombre de vues de profil (15 points max)
            rating += Math.min((stats.profileViews / 20) * 15, 15);

            // Taux de réponse aux messages (20 points max)
            const responseRate = stats.messagesReceived > 0 
                ? (stats.messagesAnswered / stats.messagesReceived) 
                : 0;
            rating += responseRate * 20;

            // Activité récente (10 points)
            if (stats.lastActivity && (Date.now() - stats.lastActivity.getTime()) < 7 * 24 * 60 * 60 * 1000) {
                rating += 10;
            }

            return Math.min(Math.max(Math.round(rating), this.MIN_RATING), this.MAX_RATING);
        } catch (error) {
            console.error('Error calculating fame rating:', error);
            return 50; // Valeur par défaut en cas d'erreur
        }
    }

    private static async getUserStats(userId: string) {
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM profile_pictures WHERE user_id = $1) as photo_count,
                (SELECT COUNT(*) FROM user_likes WHERE liked_user_id = $1) as flashes_received,
                (SELECT COUNT(*) FROM profile_views WHERE viewed_user_id = $1) as profile_views,
                (SELECT COUNT(*) FROM messages WHERE receiver_id = $1) as messages_received,
                (SELECT COUNT(*) FROM messages WHERE sender_id = $1) as messages_sent,
                (SELECT last_login FROM users WHERE id = $1) as last_activity,
                (
                    SELECT CASE 
                        WHEN gender IS NOT NULL 
                        AND sexual_preferences IS NOT NULL 
                        AND biography IS NOT NULL 
                        AND birth_date IS NOT NULL 
                        THEN true 
                        ELSE false 
                    END 
                    FROM profiles 
                    WHERE user_id = $1
                ) as is_profile_complete
        `, [userId]);

        return {
            photoCount: stats.rows[0].photo_count || 0,
            flashesReceived: stats.rows[0].flashes_received || 0,
            profileViews: stats.rows[0].profile_views || 0,
            messagesReceived: stats.rows[0].messages_received || 0,
            messagesAnswered: stats.rows[0].messages_sent || 0,
            lastActivity: stats.rows[0].last_activity,
            isProfileComplete: stats.rows[0].is_profile_complete || false
        };
    }

    // Mise à jour du fame rating
    static async updateFameRating(userId: string): Promise<void> {
        const newRating = await this.calculateFameRating(userId);
        await db.query(
            'UPDATE profiles SET fame_rating = $1 WHERE user_id = $2',
            [newRating, userId]
        );
    }

    // Obtention du fame rating actuel
    static async getFameRating(userId: string): Promise<number> {
        const result = await db.query(
            'SELECT fame_rating FROM profiles WHERE user_id = $1',
            [userId]
        );
        return result.rows[0]?.fame_rating || 50;
    }
}