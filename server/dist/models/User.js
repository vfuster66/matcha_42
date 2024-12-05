"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
// server/src/models/User.ts
const database_1 = require("../config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserModel {
    static async create(username, email, password) {
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        try {
            const result = await database_1.db.query(`INSERT INTO users (username, email, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, username, email, is_verified, created_at, last_login`, [username, email, hashedPassword]);
            return result.rows[0];
        }
        catch (error) {
            const err = error;
            if (err.constraint === 'users_username_key') {
                throw new Error('Username already exists');
            }
            if (err.constraint === 'users_email_key') {
                throw new Error('Email already exists');
            }
            throw error;
        }
    }
    static async findByEmail(email) {
        const result = await database_1.db.query('SELECT id, username, email, is_verified, created_at, last_login FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }
    static async verifyPassword(email, password) {
        const result = await database_1.db.query('SELECT password_hash FROM users WHERE email = $1', [email]);
        if (!result.rows[0])
            return false;
        return bcrypt_1.default.compare(password, result.rows[0].password_hash);
    }
}
exports.UserModel = UserModel;
