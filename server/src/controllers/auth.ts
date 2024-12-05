// server/src/controllers/auth.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { sendVerificationEmail } from '@/services/email';
import { registerSchema, loginSchema } from '../utils/validators';

export class AuthController {
	static async register(req: Request, res: Response): Promise<void> {
		try {
		  const validatedData = registerSchema.parse(req.body);
	  
		  const user = await UserModel.create(
			validatedData.username,
			validatedData.email,
			validatedData.password
		  );
	  
		  const verificationToken = jwt.sign(
			{ id: user.id },
			process.env.JWT_SECRET!,
			{ expiresIn: '24h' }
		  );
	  
		  await sendVerificationEmail(user.email, verificationToken);
	  
		  res.status(201).json({
			message: 'Registration successful. Please check your email to verify your account.',
			user: {
			  id: user.id,
			  username: user.username,
			  email: user.email,
			},
		  });
		} catch (error) {
		  if (error instanceof Error) {
			if (error.message.includes('Email sending failed')) {
			  res.status(400).json({ error: error.message });
			} else if (error.message.includes('JWT signing failed')) {
			  res.status(500).json({ error: 'Internal server error' });
			} else {
			  res.status(400).json({ error: error.message });
			}
		  } else {
			res.status(500).json({ error: 'Internal server error' });
		  }
		}
	  }
	  

	  static async login(req: Request, res: Response): Promise<void> {
		try {
		  const validatedData = loginSchema.parse(req.body);
	  
		  const user = await UserModel.findByEmail(validatedData.email);
		  if (!user) {
			res.status(401).json({ error: 'Invalid credentials' });
			return;
		  }
	  
		  const validPassword = await UserModel.verifyPassword(
			validatedData.email,
			validatedData.password
		  );
		  if (!validPassword) {
			res.status(401).json({ error: 'Invalid credentials' });
			return;
		  }
	  
		  if (!user.is_verified) {
			res.status(403).json({ error: 'Please verify your email first' });
			return;
		  }
	  
		  const token = jwt.sign(
			{ id: user.id },
			process.env.JWT_SECRET!,
			{ expiresIn: '24h' }
		  );
	  
		  res.json({
			message: 'Login successful',
			token,
			user: {
			  id: user.id,
			  username: user.username,
			  email: user.email,
			},
		  });
		} catch (error) {
		  if (error instanceof Error) {
			if (error.message.includes('Verification failed')) {
			  res.status(500).json({ error: 'Internal server error' });
			} else if (error.message.includes('Database error')) {
			  res.status(500).json({ error: 'Internal server error' });
			} else {
			  res.status(400).json({ error: error.message });
			}
		  } else {
			res.status(500).json({ error: 'Internal server error' });
		  }
		}
	}		
}