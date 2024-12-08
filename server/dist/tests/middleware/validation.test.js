"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/middleware/validation.test.ts
const validation_1 = require("../../middleware/validation");
const zod_1 = require("zod");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
describe('Validation Middleware', () => {
    const schema = zod_1.z.object({
        username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    });
    let app;
    beforeEach(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
    });
    it('should call next if validation succeeds', async () => {
        const mockHandler = jest.fn((req, res) => {
            res.status(200).json({ message: 'Success' });
        });
        app.post('/test', (0, validation_1.validateRequest)(schema), mockHandler);
        const response = await (0, supertest_1.default)(app)
            .post('/test')
            .send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'Password123!',
        });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Success' });
        expect(mockHandler).toHaveBeenCalled();
    });
    it('should return 400 if validation fails', async () => {
        app.post('/test', (0, validation_1.validateRequest)(schema));
        const response = await (0, supertest_1.default)(app)
            .post('/test')
            .send({
            username: 'tu', // Too short
            email: 'invalidemail',
            password: 'short',
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.errors).toEqual(expect.arrayContaining([
            expect.objectContaining({ message: 'Username must be at least 3 characters' }),
            expect.objectContaining({ message: 'Invalid email format' }),
            expect.objectContaining({ message: 'Password must be at least 8 characters' }),
        ]));
    });
});
describe('Error Handler Middleware', () => {
    let app;
    beforeEach(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        // Route de test pour générer des erreurs
        app.get('/test-validation-error', (req, res, next) => {
            const validationError = new Error('Validation error');
            validationError.name = 'ValidationError';
            validationError.errors = [{ message: 'Invalid data' }];
            next(validationError);
        });
        app.get('/test-other-error', (req, res, next) => {
            next(new Error('Unexpected error'));
        });
        app.use(validation_1.errorHandler);
    });
    it('should return 400 for validation errors', async () => {
        const response = await (0, supertest_1.default)(app).get('/test-validation-error');
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.errors).toEqual([{ message: 'Invalid data' }]);
    });
    it('should return 500 for other errors', async () => {
        const response = await (0, supertest_1.default)(app).get('/test-other-error');
        expect(response.status).toBe(500);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Internal server error');
    });
});
