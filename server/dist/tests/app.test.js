"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
jest.mock('../controllers/auth');
describe('App', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('Global Error Handling', () => {
        it('should return 404 for an unknown route', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/unknown-route');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Not Found' });
        });
        it('should apply security headers', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/unknown-route');
            expect(response.headers['x-dns-prefetch-control']).toBeDefined();
            expect(response.headers['x-frame-options']).toBeDefined();
            expect(response.headers['strict-transport-security']).toBeDefined();
        });
        it('should allow CORS for the specified origin', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/unknown-route')
                .set('Origin', process.env.CLIENT_URL || 'http://localhost:3000');
            expect(response.headers['access-control-allow-origin']).toBe(process.env.CLIENT_URL);
        });
        it('should compress responses', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/test-compression')
                .set('Accept-Encoding', 'gzip');
            expect(response.headers['content-encoding']).toBe('gzip');
            expect(response.text).toBe('Compression test');
        });
        // it('should respond correctly for an existing route', async () => {
        // 	jest.spyOn(AuthController, 'register').mockImplementation(async (req, res) => {
        // 		res.status(201).json({ message: 'Registration successful' });
        // 	});
        // 	const response = await request(app)
        // 		.post('/api/auth/register')
        // 		.send({
        // 			username: 'testuser',
        // 			email: 'test@example.com',
        // 			password: 'Password123!',
        // 		});
        // 	expect(response.status).toBe(201);
        // 	expect(response.body).toHaveProperty('message', 'Registration successful');
        // });
        it('should handle non-standard errors gracefully', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/test-error');
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Something broke!' });
        });
        // it('should handle errors thrown in routes', async () => {
        // 	const errorMessage = 'Test error';
        // 	jest.spyOn(AuthController, 'register').mockImplementation(() => {
        // 		throw new Error(errorMessage);
        // 	});
        // 	const response = await request(app)
        // 		.post('/api/auth/register')
        // 		.send({
        // 			username: 'testuser',
        // 			email: 'test@example.com',
        // 			password: 'Password123!',
        // 		});
        // 	expect(AuthController.register).toHaveBeenCalled();
        // 	expect(response.status).toBe(500);
        // 	expect(response.body).toEqual({
        // 		error: errorMessage,
        // 	});
        // });
    });
});
