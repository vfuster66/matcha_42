"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const email_1 = require("@/services/email");
const validators_1 = require("../utils/validators");
class AuthController {
    static async register(req, res) {
        try {
            const validatedData = validators_1.registerSchema.parse(req.body);
            const user = await User_1.UserModel.create(validatedData.username, validatedData.email, validatedData.password);
            const verificationToken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            await (0, email_1.sendVerificationEmail)(user.email, verificationToken);
            res.status(201).json({
                message: 'Registration successful. Please check your email to verify your account.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('Email sending failed')) {
                    res.status(400).json({ error: error.message });
                }
                else if (error.message.includes('JWT signing failed')) {
                    res.status(500).json({ error: 'Internal server error' });
                }
                else {
                    res.status(400).json({ error: error.message });
                }
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    static async login(req, res) {
        try {
            const validatedData = validators_1.loginSchema.parse(req.body);
            const user = await User_1.UserModel.findByEmail(validatedData.email);
            if (!user) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            const validPassword = await User_1.UserModel.verifyPassword(validatedData.email, validatedData.password);
            if (!validPassword) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            if (!user.is_verified) {
                res.status(403).json({ error: 'Please verify your email first' });
                return;
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('Verification failed')) {
                    res.status(500).json({ error: 'Internal server error' });
                }
                else if (error.message.includes('Database error')) {
                    res.status(500).json({ error: 'Internal server error' });
                }
                else {
                    res.status(400).json({ error: error.message });
                }
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
}
exports.AuthController = AuthController;
