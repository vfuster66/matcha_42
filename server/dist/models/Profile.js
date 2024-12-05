"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileModel = void 0;
// src/models/Profile.ts
const database_1 = require("../config/database");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class ProfileModel {
    static async create(userId, profileData) {
        const result = await database_1.db.query(`INSERT INTO profiles (
        user_id, first_name, last_name, gender, 
        sexual_preferences, biography, birth_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`, [
            userId,
            profileData.first_name,
            profileData.last_name,
            profileData.gender,
            profileData.sexual_preferences,
            profileData.biography,
            profileData.birth_date
        ]);
        return result.rows[0];
    }
    static async update(userId, profileData) {
        const result = await database_1.db.query(`UPDATE profiles
       SET first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           gender = COALESCE($4, gender),
           sexual_preferences = COALESCE($5, sexual_preferences),
           biography = COALESCE($6, biography),
           birth_date = COALESCE($7, birth_date),
           last_location_update = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`, [
            userId,
            profileData.first_name,
            profileData.last_name,
            profileData.gender,
            profileData.sexual_preferences,
            profileData.biography,
            profileData.birth_date
        ]);
        return result.rows[0];
    }
    static async findByUserId(userId) {
        const result = await database_1.db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        return result.rows[0] || null;
    }
    static async addInterest(userId, interestName) {
        // D'abord, insérer l'intérêt s'il n'existe pas
        await database_1.db.query(`INSERT INTO interests (name) 
       VALUES ($1) 
       ON CONFLICT (name) DO NOTHING`, [interestName.toLowerCase()]);
        // Ensuite, lier l'intérêt à l'utilisateur
        await database_1.db.query(`INSERT INTO user_interests (user_id, interest_id)
       SELECT $1, id FROM interests WHERE name = $2
       ON CONFLICT DO NOTHING`, [userId, interestName.toLowerCase()]);
    }
    static async removeInterest(userId, interestName) {
        await database_1.db.query(`DELETE FROM user_interests
       WHERE user_id = $1 AND interest_id IN (
         SELECT id FROM interests WHERE name = $2
       )`, [userId, interestName.toLowerCase()]);
    }
    static async getInterests(userId) {
        const result = await database_1.db.query(`SELECT i.name
       FROM interests i
       JOIN user_interests ui ON ui.interest_id = i.id
       WHERE ui.user_id = $1`, [userId]);
        return result.rows.map(row => row.name);
    }
    static async addPhoto(userId, filename, isPrimary = false) {
        try {
            // Commencez une transaction
            await database_1.db.query('BEGIN');
            if (isPrimary) {
                // Reset all other photos to non-primary
                await database_1.db.query('UPDATE profile_pictures SET is_primary = false WHERE user_id = $1', [userId]);
            }
            await database_1.db.query(`INSERT INTO profile_pictures (user_id, file_path, is_primary)
			 VALUES ($1, $2, $3)`, [userId, filename, isPrimary]);
            await database_1.db.query('COMMIT');
        }
        catch (error) {
            await database_1.db.query('ROLLBACK');
            throw error;
        }
    }
    static async getPhotos(userId) {
        const result = await database_1.db.query(`SELECT id, file_path, is_primary, created_at 
       FROM profile_pictures 
       WHERE user_id = $1
       ORDER BY created_at DESC`, [userId]);
        return result.rows;
    }
    static async setPrimaryPhoto(userId, photoId) {
        try {
            // Commencez une transaction
            await database_1.db.query('BEGIN');
            // Vérifier que la photo appartient à l'utilisateur
            const photo = await database_1.db.query('SELECT id FROM profile_pictures WHERE id = $1 AND user_id = $2', [photoId, userId]);
            if (!photo.rows[0]) {
                throw new Error('Photo not found or unauthorized');
            }
            // Reset all photos to non-primary
            await database_1.db.query('UPDATE profile_pictures SET is_primary = false WHERE user_id = $1', [userId]);
            // Set the selected photo as primary
            await database_1.db.query('UPDATE profile_pictures SET is_primary = true WHERE id = $1', [photoId]);
            // Commit la transaction
            await database_1.db.query('COMMIT');
        }
        catch (error) {
            // Rollback en cas d'erreur
            await database_1.db.query('ROLLBACK');
            throw error;
        }
    }
    static async deletePhoto(userId, photoId) {
        try {
            await database_1.db.query('BEGIN');
            // Get photo info before deletion
            const photo = await database_1.db.query('SELECT file_path, is_primary FROM profile_pictures WHERE id = $1 AND user_id = $2', [photoId, userId]);
            if (!photo.rows[0]) {
                throw new Error('Photo not found or unauthorized');
            }
            // Delete from database
            await database_1.db.query('DELETE FROM profile_pictures WHERE id = $1 AND user_id = $2', [photoId, userId]);
            if (photo.rows[0].is_primary) {
                await database_1.db.query(`
			  UPDATE profile_pictures 
			  SET is_primary = true 
			  WHERE user_id = $1 
			  AND id = (
				SELECT id FROM profile_pictures 
				WHERE user_id = $1 
				ORDER BY created_at DESC 
				LIMIT 1
			  )`, [userId]);
            }
            await database_1.db.query('COMMIT');
            // Delete files
            await promises_1.default.unlink(path_1.default.join(process.cwd(), 'uploads', 'profiles', photo.rows[0].file_path))
                .catch(() => { }); // Ignore file deletion errors
            await promises_1.default.unlink(path_1.default.join(process.cwd(), 'uploads', 'profiles', photo.rows[0].file_path.replace('_processed', '_thumb')))
                .catch(() => { });
        }
        catch (error) {
            await database_1.db.query('ROLLBACK');
            throw error;
        }
    }
}
exports.ProfileModel = ProfileModel;
