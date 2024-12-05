"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileSchema = exports.loginSchema = exports.registerSchema = void 0;
// server/src/utils/validators.ts
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    username: zod_1.z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must not exceed 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
    email: zod_1.z.string()
        .email('Invalid email format')
        .max(255, 'Email must not exceed 255 characters'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/.*[A-Z].*/, 'Password must contain at least one uppercase letter')
        .regex(/.*[a-z].*/, 'Password must contain at least one lowercase letter')
        .regex(/.*\d.*/, 'Password must contain at least one number')
        .regex(/.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?].*/, 'Password must contain at least one special character'),
    confirmPassword: zod_1.z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.profileSchema = zod_1.z.object({
    gender: zod_1.z.enum(['male', 'female', 'other']),
    sexual_preferences: zod_1.z.enum(['male', 'female', 'both']),
    biography: zod_1.z.string()
        .min(10, 'Biography must be at least 10 characters long')
        .max(500, 'Biography must not exceed 500 characters'),
    interests: zod_1.z.array(zod_1.z.string())
        .min(1, 'At least one interest is required')
        .max(10, 'Maximum 10 interests allowed'),
    birth_date: zod_1.z.string()
        .refine((date) => {
        const birthDate = new Date(date);
        const age = (new Date().getFullYear() - birthDate.getFullYear());
        return age >= 18;
    }, 'You must be at least 18 years old'),
    first_name: zod_1.z.string().min(2).max(50).optional(),
    last_name: zod_1.z.string().min(2).max(50).optional(),
});
