"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../../models/User");
const database_1 = require("../../config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
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
            database_1.db.query.mockResolvedValueOnce({ rows: [mockUser] });
            bcrypt_1.default.hash.mockResolvedValueOnce('hashed_password');
            const result = await User_1.UserModel.create('testuser', 'test@example.com', 'Password123!');
            expect(bcrypt_1.default.hash).toHaveBeenCalledWith('Password123!', 10);
            expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'), ['testuser', 'test@example.com', 'hashed_password']);
            expect(result).toEqual(mockUser);
        });
        it('should throw an error if username already exists', async () => {
            const dbError = new Error('Database error');
            dbError.constraint = 'users_username_key';
            database_1.db.query.mockRejectedValueOnce(dbError);
            await expect(User_1.UserModel.create('testuser', 'test@example.com', 'Password123!')).rejects.toThrow('Username already exists');
        });
        it('should throw an error if email already exists', async () => {
            const dbError = new Error('Database error');
            dbError.constraint = 'users_email_key';
            database_1.db.query.mockRejectedValueOnce(dbError);
            await expect(User_1.UserModel.create('testuser', 'test@example.com', 'Password123!')).rejects.toThrow('Email already exists');
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
            database_1.db.query.mockResolvedValueOnce({ rows: [mockUser] });
            const result = await User_1.UserModel.findByEmail('test@example.com');
            expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['test@example.com']);
            expect(result).toEqual(mockUser);
        });
        it('should return null if the email does not exist', async () => {
            database_1.db.query.mockResolvedValueOnce({ rows: [] });
            const result = await User_1.UserModel.findByEmail('nonexistent@example.com');
            expect(result).toBeNull();
        });
    });
    describe('verifyPassword', () => {
        it('should return true for a correct password', async () => {
            database_1.db.query.mockResolvedValueOnce({
                rows: [{ password_hash: 'hashed_password' }],
            });
            bcrypt_1.default.compare.mockResolvedValueOnce(true);
            const result = await User_1.UserModel.verifyPassword('test@example.com', 'Password123!');
            expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT password_hash'), ['test@example.com']);
            expect(bcrypt_1.default.compare).toHaveBeenCalledWith('Password123!', 'hashed_password');
            expect(result).toBe(true);
        });
        it('should return false for an incorrect password', async () => {
            database_1.db.query.mockResolvedValueOnce({
                rows: [{ password_hash: 'hashed_password' }],
            });
            bcrypt_1.default.compare.mockResolvedValueOnce(false);
            const result = await User_1.UserModel.verifyPassword('test@example.com', 'WrongPassword!');
            expect(result).toBe(false);
        });
        it('should return false if the user does not exist', async () => {
            database_1.db.query.mockResolvedValueOnce({ rows: [] });
            const result = await User_1.UserModel.verifyPassword('nonexistent@example.com', 'Password123!');
            expect(result).toBe(false);
        });
    });
});
