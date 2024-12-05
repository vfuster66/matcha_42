"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/app.test.ts
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const auth_1 = require("../controllers/auth");
jest.mock('../controllers/auth');
describe('App', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('Global Error Handling', () => {
        it('should return 404 for an unknown route', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/unknown-route');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: 'Not Found'
            });
        });
        it('should handle errors thrown in routes', async () => {
            const errorMessage = 'Test error';
            auth_1.AuthController.register.mockImplementation(() => {
                throw new Error(errorMessage);
            });
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123!'
            });
            expect(auth_1.AuthController.register).toHaveBeenCalled();
            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: errorMessage
            });
        });
    });
});
