"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/services/email.test.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const email_1 = require("../../services/email");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.test' });
jest.mock('nodemailer');
describe('Email Service', () => {
    const mockSendMail = jest.fn();
    const mockCreateTransport = jest.fn().mockReturnValue({
        sendMail: mockSendMail,
    });
    beforeAll(() => {
        process.env.SMTP_HOST = 'smtp.gmail.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'test@example.com';
        process.env.SMTP_PASS = 'test_password';
        process.env.CLIENT_URL = 'http://localhost:3000';
        nodemailer_1.default.createTransport = mockCreateTransport;
    });
    beforeEach(() => {
        jest.clearAllMocks();
        mockSendMail.mockReset();
        mockCreateTransport.mockClear();
    });
    describe('sendVerificationEmail', () => {
        it('should successfully send a verification email', async () => {
            mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });
            await expect((0, email_1.sendVerificationEmail)('user@example.com', 'test-token')).resolves.not.toThrow();
            expect(mockSendMail).toHaveBeenCalledWith({
                from: process.env.SMTP_USER,
                to: 'user@example.com',
                subject: 'Verify your Matcha account',
                html: expect.stringContaining('Welcome to Matcha!')
            });
        });
        it('should handle email sending failure', async () => {
            const errorMessage = 'SMTP error';
            mockSendMail.mockRejectedValueOnce(new Error(errorMessage));
            const consoleSpy = jest.spyOn(console, 'error');
            await expect((0, email_1.sendVerificationEmail)('user@example.com', 'test-token')).rejects.toThrow('Failed to send verification email');
            expect(consoleSpy).toHaveBeenCalledWith('Error sending verification email:', expect.any(Error));
        });
        it('should validate email format', async () => {
            await expect((0, email_1.sendVerificationEmail)('invalid-email', 'test-token')).rejects.toThrow('Invalid email address');
        });
        it('should handle missing environment variables', async () => {
            const originalEnv = { ...process.env };
            delete process.env.SMTP_USER;
            delete process.env.CLIENT_URL;
            await expect((0, email_1.sendVerificationEmail)('user@example.com', 'test-token')).rejects.toThrow('Missing required environment variables');
            process.env = originalEnv;
        });
        it('should create correct nodemailer transport configuration', async () => {
            mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });
            await (0, email_1.sendVerificationEmail)('user@example.com', 'test-token');
            expect(mockCreateTransport).toHaveBeenCalledWith({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        });
        it('should handle token validation', async () => {
            await expect((0, email_1.sendVerificationEmail)('user@example.com', '')).rejects.toThrow('Token is required');
            await expect((0, email_1.sendVerificationEmail)('user@example.com', null)).rejects.toThrow('Token is required');
        });
        it('should include all required email content', async () => {
            mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' });
            await (0, email_1.sendVerificationEmail)('user@example.com', 'test-token');
            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain('Welcome to Matcha!');
            expect(callArgs.html).toContain('Please click the link below to verify your account');
            expect(callArgs.html).toContain('This link will expire in 24 hours');
            expect(callArgs.html).toContain('If you did not create an account, please ignore this email');
            expect(callArgs.html).toContain(`${process.env.CLIENT_URL}/verify-email?token=test-token`);
        });
    });
});
