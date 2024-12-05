import { UserModel } from '../../models/User';
import { db } from '../../config/database';
import bcrypt from 'bcrypt';

// Mock des dépendances
jest.mock('../../config/database');
jest.mock('bcrypt');

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user and return the user object', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        is_verified: false,
        created_at: new Date(),
        last_login: null,
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');

      const result = await UserModel.create(
        'testuser',
        'test@example.com',
        'Password123!'
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['testuser', 'test@example.com', 'hashed_password']
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if username already exists', async () => {
      const dbError = new Error('Database error') as any;
      dbError.constraint = 'users_username_key';

      (db.query as jest.Mock).mockRejectedValueOnce(dbError);

      await expect(
        UserModel.create('testuser', 'test@example.com', 'Password123!')
      ).rejects.toThrow('Username already exists');
    });

    it('should throw an error if email already exists', async () => {
      const dbError = new Error('Database error') as any;
      dbError.constraint = 'users_email_key';

      (db.query as jest.Mock).mockRejectedValueOnce(dbError);

      await expect(
        UserModel.create('testuser', 'test@example.com', 'Password123!')
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('findByEmail', () => {
    it('should return a user if the email exists', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        is_verified: false,
        created_at: new Date(),
        last_login: null,
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

      const result = await UserModel.findByEmail('test@example.com');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if the email does not exist', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await UserModel.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    it('should return true for a correct password', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ password_hash: 'hashed_password' }],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await UserModel.verifyPassword(
        'test@example.com',
        'Password123!'
      );

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT password_hash'),
        ['test@example.com']
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashed_password');
      expect(result).toBe(true);
    });

    it('should return false for an incorrect password', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ password_hash: 'hashed_password' }],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const result = await UserModel.verifyPassword(
        'test@example.com',
        'WrongPassword!'
      );

      expect(result).toBe(false);
    });

    it('should return false if the user does not exist', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await UserModel.verifyPassword(
        'nonexistent@example.com',
        'Password123!'
      );

      expect(result).toBe(false);
    });
  });
});
