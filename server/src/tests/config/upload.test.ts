import multer from 'multer';
import request from 'supertest';
import express, { Application } from 'express';
import { uploadConfig } from '../../config/upload';
import path from 'path';
import fs from 'fs';

jest.mock('uuid', () => ({
	v4: jest.fn(() => 'mocked-uuid'),
}));

const app: Application = express();

// Mock route pour tester le middleware
app.post('/upload', (req, res, next) => {
	uploadConfig.single('profile')(req, res, (err) => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') {
				return res.status(500).json({ error: 'File too large' });
			}
			if (err.code === 'LIMIT_UNEXPECTED_FILE') {
				return res.status(500).json({ error: 'Unexpected field' });
			}
			if (err.message) {
				return res.status(500).json({ error: err.message });
			}
			return res.status(500).json({ error: 'An unknown error occurred.' });
		}
		res.status(200).json({ message: 'File uploaded successfully', file: req.file });
	});
});

// Test du stockage
describe('Upload Configuration', () => {
	const uploadsDir = path.join(__dirname, '../../../uploads/profiles');

	beforeAll(() => {
		if (!fs.existsSync(uploadsDir)) {
			fs.mkdirSync(uploadsDir, { recursive: true });
		}
	});

	afterAll(() => {
		fs.rmSync(uploadsDir, { recursive: true, force: true });
	});

	it('should save the file to the correct directory with a unique name', async () => {
		const filePath = path.join(__dirname, '../fixtures/test-image.png');
		const response = await request(app)
			.post('/upload')
			.attach('profile', filePath);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('File uploaded successfully');
		expect(response.body.file).toBeDefined();
		expect(response.body.file.filename).toBe('mocked-uuid.png');
		expect(fs.existsSync(path.join(uploadsDir, 'mocked-uuid.png'))).toBe(true);
	});

	it('should reject files with invalid mime types', async () => {
		const filePath = path.join(__dirname, '../fixtures/test-file.txt');
		const response = await request(app)
			.post('/upload')
			.attach('profile', filePath);

		expect(response.status).toBe(500);
		expect(response.body.error).toBe('Invalid file type. Only JPEG and PNG are allowed.');
	});

	it('should reject files exceeding size limit', async () => {
		const filePath = path.join(__dirname, '../fixtures/large-image.png'); // Fichier > 5 Mo
		const response = await request(app)
			.post('/upload')
			.attach('profile', filePath);

		expect(response.status).toBe(500);
		expect(response.body.error).toContain('File too large');
	});

	it('should reject if multiple files are uploaded', async () => {
		const filePath = path.join(__dirname, '../fixtures/test-image.png');
		const response = await request(app)
			.post('/upload')
			.attach('profile', filePath)
			.attach('profile', filePath);
	
		expect(response.status).toBe(500);
		expect(response.body.error).toContain('Too many files');
	});	
});
