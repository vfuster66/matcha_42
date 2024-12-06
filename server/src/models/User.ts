// server/src/models/User.ts
import { db } from '../config/database';
import { User, DatabaseError } from '../types';
import bcrypt from 'bcrypt';

export class UserModel {
  private static readonly SALT_ROUNDS = 10;

  static async create(username: string, email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      const result = await db.query<User>(
        `INSERT INTO users (username, email, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, username, email, is_verified, created_at, last_login`,
        [username, email, hashedPassword]
      );
      
      return result.rows[0];
    } catch (error) {
      const err = error as DatabaseError;
      if (err.constraint === 'users_username_key') {
        throw new Error('Username already exists');
      }
      if (err.constraint === 'users_email_key') {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await db.query<User>(
      'SELECT id, username, email, is_verified, created_at, last_login FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

    static async verifyPassword(email: string, password: string): Promise<boolean> {
        const result = await db.query<{ password_hash: string }>(
            'SELECT password_hash FROM users WHERE email = $1 AND is_verified = true',
            [email]
        );
        if (!result.rows[0]) return false;
        
        return bcrypt.compare(password, result.rows[0].password_hash);
    }

    static async updatePassword(userId: number, newPassword: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await db.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, userId]
        );
    }
}