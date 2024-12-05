// server/src/utils/validators.ts
import { z } from 'zod';

export const registerSchema = z.object({
	username: z.string()
		.min(3, 'Username must be at least 3 characters')
		.max(50, 'Username must not exceed 50 characters')
		.regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),

	email: z.string()
		.email('Invalid email format')
		.max(255, 'Email must not exceed 255 characters'),

	password: z.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/.*[A-Z].*/, 'Password must contain at least one uppercase letter')
		.regex(/.*[a-z].*/, 'Password must contain at least one lowercase letter')
		.regex(/.*\d.*/, 'Password must contain at least one number')
		.regex(/.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?].*/, 'Password must contain at least one special character'),

	confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"],
});

export const loginSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
});

export const profileSchema = z.object({
	gender: z.enum(['male', 'female', 'other']),
	sexual_preferences: z.enum(['male', 'female', 'both']),
	biography: z.string()
		.min(10, 'Biography must be at least 10 characters long')
		.max(500, 'Biography must not exceed 500 characters'),
	interests: z.array(z.string())
		.min(1, 'At least one interest is required')
		.max(10, 'Maximum 10 interests allowed'),
	birth_date: z.string()
		.refine((date) => {
			const birthDate = new Date(date);
			const age = (new Date().getFullYear() - birthDate.getFullYear());
			return age >= 18;
		}, 'You must be at least 18 years old'),
	first_name: z.string().min(2).max(50).optional(),
	last_name: z.string().min(2).max(50).optional(),
});