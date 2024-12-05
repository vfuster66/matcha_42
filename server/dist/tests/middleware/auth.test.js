"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../../middleware/auth");
jest.mock('jsonwebtoken');
describe('Auth Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;
    beforeEach(() => {
        mockRequest = {
            headers: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });
    describe('authMiddleware', () => {
        it('should call next if a valid token is provided', () => {
            const mockDecodedToken = { id: '123' };
            jsonwebtoken_1.default.verify.mockReturnValue(mockDecodedToken);
            mockRequest.headers = { authorization: 'Bearer validToken' };
            (0, auth_1.authMiddleware)(mockRequest, mockResponse, nextFunction);
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith('validToken', process.env.JWT_SECRET);
            expect(mockRequest.user).toEqual(mockDecodedToken);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should return 401 if no token is provided', () => {
            (0, auth_1.authMiddleware)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 401 if the token is invalid', () => {
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            mockRequest.headers = { authorization: 'Bearer invalidToken' };
            (0, auth_1.authMiddleware)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid token' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
    describe('optionalAuth', () => {
        it('should set req.user if a valid token is provided', () => {
            const mockDecodedToken = { id: '123' };
            jsonwebtoken_1.default.verify.mockReturnValue(mockDecodedToken);
            mockRequest.headers = { authorization: 'Bearer validToken' };
            (0, auth_1.optionalAuth)(mockRequest, mockResponse, nextFunction);
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith('validToken', process.env.JWT_SECRET);
            expect(mockRequest.user).toEqual(mockDecodedToken);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should continue without setting req.user if no token is provided', () => {
            (0, auth_1.optionalAuth)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should continue without setting req.user if the token is invalid', () => {
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            mockRequest.headers = { authorization: 'Bearer invalidToken' };
            (0, auth_1.optionalAuth)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(nextFunction).toHaveBeenCalled();
        });
    });
});
