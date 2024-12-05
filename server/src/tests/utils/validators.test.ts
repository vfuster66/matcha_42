// src/tests/utils/validators.test.ts
import { registerSchema, loginSchema } from '../../utils/validators';
import { ZodError } from 'zod';

describe('Validators', () => {
  describe('registerSchema', () => {
    const validData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    it('should validate correct registration data', () => {
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    describe('username validation', () => {
      it('should reject usernames that are too short', () => {
        const data = { ...validData, username: 'ab' };
        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it('should reject usernames that are too long', () => {
        const data = { ...validData, username: 'a'.repeat(51) };
        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it('should reject usernames with invalid characters', () => {
        const invalidUsernames = ['user@name', 'user name', 'user$name', 'user.name'];
        invalidUsernames.forEach(username => {
          expect(() => registerSchema.parse({ ...validData, username }))
            .toThrow(ZodError);
        });
      });

      it('should accept valid usernames', () => {
        const validUsernames = ['user123', 'user_name', 'user-name', 'userName'];
        validUsernames.forEach(username => {
          expect(() => registerSchema.parse({ ...validData, username }))
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
          expect(() => registerSchema.parse({ ...validData, email }))
            .toThrow(ZodError);
        });
      });

      it('should reject emails that are too long', () => {
        const longEmail = `${'a'.repeat(247)}@test.com`; // 256 chars
        expect(() => registerSchema.parse({ ...validData, email: longEmail }))
          .toThrow(ZodError);
      });

      it('should accept valid emails', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.com',
          'user+test@domain.co.uk'
        ];
        validEmails.forEach(email => {
          expect(() => registerSchema.parse({ ...validData, email }))
            .not.toThrow();
        });
      });
    });

    describe('password validation', () => {
      it('should reject passwords that are too short', () => {
        const data = { ...validData, password: 'Pass1!', confirmPassword: 'Pass1!' };
        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it('should require at least one uppercase letter', () => {
        const data = {
          ...validData,
          password: 'password123!',
          confirmPassword: 'password123!'
        };
        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it('should require at least one lowercase letter', () => {
        const data = {
          ...validData,
          password: 'PASSWORD123!',
          confirmPassword: 'PASSWORD123!'
        };
        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it('should require at least one number', () => {
        const data = {
          ...validData,
          password: 'Password!',
          confirmPassword: 'Password!'
        };
        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it('should require at least one special character', () => {
        const data = {
          ...validData,
          password: 'Password123',
          confirmPassword: 'Password123'
        };
        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it('should require matching passwords', () => {
        const data = {
          ...validData,
          password: 'Password123!',
          confirmPassword: 'Password123?'
        };
        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });
    });
  });

  describe('loginSchema', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password'
    };

    it('should validate correct login data', () => {
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const data = { ...validData, email: 'invalid-email' };
      expect(() => loginSchema.parse(data)).toThrow(ZodError);
    });

    it('should reject empty password', () => {
      const data = { ...validData, password: '' };
      expect(() => loginSchema.parse(data)).toThrow(ZodError);
    });

    it('should handle missing fields', () => {
      const incompleteData = {};
      expect(() => loginSchema.parse(incompleteData)).toThrow(ZodError);
    });
  });
});