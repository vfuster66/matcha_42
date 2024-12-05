// src/services/email.ts
import nodemailer from 'nodemailer';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sendVerificationEmail = async (email: string, token: string) => {
  if (!email || !validateEmail(email)) {
    throw new Error('Invalid email address');
  }
  
  if (!token) {
    throw new Error('Token is required');
  }

  if (!process.env.SMTP_USER || !process.env.CLIENT_URL) {
    throw new Error('Missing required environment variables');
  }

  const transporter = nodemailer.createTransport({
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
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};