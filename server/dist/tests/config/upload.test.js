"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const upload_1 = require("../../config/upload");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mocked-uuid'),
}));
const app = (0, express_1.default)();
// Mock route pour tester le middleware
app.post('/upload', (req, res, next) => {
    upload_1.uploadConfig.single('profile')(req, res, (err) => {
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
    const uploadsDir = path_1.default.join(__dirname, '../../../uploads/profiles');
    beforeAll(() => {
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
    });
    afterAll(() => {
        fs_1.default.rmSync(uploadsDir, { recursive: true, force: true });
    });
    it('should save the file to the correct directory with a unique name', async () => {
        const filePath = path_1.default.join(__dirname, '../fixtures/test-image.png');
        const response = await (0, supertest_1.default)(app)
            .post('/upload')
            .attach('profile', filePath);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('File uploaded successfully');
        expect(response.body.file).toBeDefined();
        expect(response.body.file.filename).toBe('mocked-uuid.png');
        expect(fs_1.default.existsSync(path_1.default.join(uploadsDir, 'mocked-uuid.png'))).toBe(true);
    });
    it('should reject files with invalid mime types', async () => {
        const filePath = path_1.default.join(__dirname, '../fixtures/test-file.txt');
        const response = await (0, supertest_1.default)(app)
            .post('/upload')
            .attach('profile', filePath);
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Invalid file type. Only JPEG and PNG are allowed.');
    });
    it('should reject files exceeding size limit', async () => {
        const filePath = path_1.default.join(__dirname, '../fixtures/large-image.png'); // Fichier > 5 Mo
        const response = await (0, supertest_1.default)(app)
            .post('/upload')
            .attach('profile', filePath);
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('File too large');
    });
    it('should reject if multiple files are uploaded', async () => {
        const filePath = path_1.default.join(__dirname, '../fixtures/test-image.png');
        const response = await (0, supertest_1.default)(app)
            .post('/upload')
            .attach('profile', filePath)
            .attach('profile', filePath);
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Too many files');
    });
});
