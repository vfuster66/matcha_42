// src/config/upload.ts
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/profiles/');
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = uuidv4();
		cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
	}
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

	if (!allowedTypes.includes(file.mimetype)) {
		cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
		return;
	}

	cb(null, true);
};

export const uploadConfig = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024,
		files: 1
	}
});