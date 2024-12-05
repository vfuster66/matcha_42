"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/utils/validators.test.ts
const validators_1 = require("../../utils/validators");
const zod_1 = require("zod");
describe('Validators', () => {
    describe('registerSchema', () => {
        const validData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'Password123!',
            confirmPassword: 'Password123!'
        };
        it('should validate correct registration data', () => {
            expect(() => validators_1.registerSchema.parse(validData)).not.toThrow();
        });
        describe('username validation', () => {
            it('should reject usernames that are too short', () => {
                const data = { ...validData, username: 'ab' };
                expect(() => validators_1.registerSchema.parse(data)).toThrow(zod_1.ZodError);
            });
            it('should reject usernames that are too long', () => {
                const data = { ...validData, username: 'a'.repeat(51) };
                expect(() => validators_1.registerSchema.parse(data)).toThrow(zod_1.ZodError);
            });
            it('should reject usernames with invalid characters', () => {
                const invalidUsernames = ['user@name', 'user name', 'user$name', 'user.name'];
                invalidUsernames.forEach(username => {
                    expect(() => validators_1.registerSchema.parse({ ...validData, username }))
                        .toThrow(zod_1.ZodError);
                });
            });
            it('should accept valid usernames', () => {
                const validUsernames = ['user123', 'user_name', 'user-name', 'userName'];
                validUsernames.forEach(username => {
                    expect(() => validators_1.registerSchema.parse({ ...validData, username }))
                        .not.toThrow();
                });
            });
        });
        describe('email validation', () => {
            it('should reject invalid email formats', () => {
                const invalidEmails = [
                    'invalid',
                    'invalid@',
                    '@invalid.com',
                    'invalid@.com',
                    'invalid@com'
                ];
                invalidEmails.forEach(email => {
                    expect(() => validators_1.registerSchema.parse({ ...validData, email }))
                        .toThrow(zod_1.ZodError);
                });
            });
            it('should reject emails that are too long', () => {
                const longEmail = `${'a'.repeat(247)}@test.com`; // 256 chars
                expect(() => validators_1.registerSchema.parse({ ...validData, email: longEmail }))
                    .toThrow(zod_1.ZodError);
            });
            it('should accept valid emails', () => {
                const validEmails = [
                    'test@example.com',
                    'user.name@domain.com',
                    'user+test@domain.co.uk'
                ];
                validEmails.forEach(email => {
                    expect(() => validators_1.registerSchema.parse({ ...validData, email }))
                        .not.toThrow();
                });
            });
        });
        describe('password validation', () => {
            it('should reject passwords that are too short', () => {
                const data = { ...validData, password: 'Pass1!', confirmPassword: 'Pass1!' };
                expect(() => validators_1.registerSchema.parse(data)).toThrow(zod_1.ZodError);
            });
            it('should require at least one uppercase letter', () => {
                const data = {
                    ...validData,
                    password: 'password123!',
                    confirmPassword: 'password123!'
                };
                expect(() => validators_1.registerSchema.parse(data)).toThrow(zod_1.ZodError);
            });
            it('should require at least one lowercase letter', () => {
                const data = {
                    ...validData,
                    password: 'PASSWORD123!',
                    confirmPassword: 'PASSWORD123!'
                };
                expect(() => validators_1.registerSchema.parse(data)).toThrow(zod_1.ZodError);
            });
            it('should require at least one number', () => {
                const data = {
                    ...validData,
                    password: 'Password!',
                    confirmPassword: 'Password!'
                };
                expect(() => validators_1.registerSchema.parse(data)).toThrow(zod_1.ZodError);
            });
            it('should require at least one special character', () => {
                const data = {
                    ...validData,
                    password: 'Password123',
                    confirmPassword: 'Password123'
                };
                expect(() => validators_1.registerSchema.parse(data)).toThrow(zod_1.ZodError);
            });
            it('should require matching passwords', () => {
                const data = {
                    ...validData,
                    password: 'Password123!',
                    confirmPassword: 'Password123?'
                };
                expect(() => validators_1.registerSchema.parse(data)).toThrow(zod_1.ZodError);
            });
        });
    });
    describe('loginSchema', () => {
        const validData = {
            email: 'test@example.com',
            password: 'password'
        };
        it('should validate correct login data', () => {
            expect(() => validators_1.loginSchema.parse(validData)).not.toThrow();
        });
        it('should reject invalid email format', () => {
            const data = { ...validData, email: 'invalid-email' };
            expect(() => validators_1.loginSchema.parse(data)).toThrow(zod_1.ZodError);
        });
        it('should reject empty password', () => {
            const data = { ...validData, password: '' };
            expect(() => validators_1.loginSchema.parse(data)).toThrow(zod_1.ZodError);
        });
        it('should handle missing fields', () => {
            const incompleteData = {};
            expect(() => validators_1.loginSchema.parse(incompleteData)).toThrow(zod_1.ZodError);
        });
    });
});
