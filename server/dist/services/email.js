"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = exports.validateEmail = void 0;
// src/services/email.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const sendVerificationEmail = async (email, token) => {
    if (!email || !(0, exports.validateEmail)(email)) {
        throw new Error('Invalid email address');
    }
    if (!token) {
        throw new Error('Token is required');
    }
    if (!process.env.SMTP_USER || !process.env.CLIENT_URL) {
        throw new Error('Missing required environment variables');
    }
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Verify your Matcha account',
        html: `
      <h1>Welcome to Matcha!</h1>
      <p>Please click the link below to verify your account:</p>
      <a href="${verificationUrl}">Verify my account</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `,
    };
    try {
        const result = await transporter.sendMail(mailOptions);
        return result;
    }
    catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
