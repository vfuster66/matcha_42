"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/routes/notifications.test.ts
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const notifications_1 = __importDefault(require("../../routes/notifications"));
const notifications_2 = require("../../controllers/notifications");
jest.mock('../../controllers/notifications');
describe('Notification Routes', () => {
    let app;
    const mockNotificationController = notifications_2.NotificationController;
    beforeEach(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api/notifications', notifications_1.default);
        jest.clearAllMocks();
    });
    it('should get unread notifications', async () => {
        const mockUnreadNotifications = [
            { id: 1, message: 'Unread notification 1' },
            { id: 2, message: 'Unread notification 2' },
        ];
        mockNotificationController.prototype.getUnreadNotifications.mockImplementation(async (req, res) => {
            res.json(mockUnreadNotifications);
        });
        const response = await (0, supertest_1.default)(app).get('/api/notifications/123/unread');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUnreadNotifications);
        expect(mockNotificationController.prototype.getUnreadNotifications).toHaveBeenCalled();
    });
    it('should mark a notification as read', async () => {
        mockNotificationController.prototype.markAsRead.mockImplementation(async (req, res) => {
            res.json({ success: true });
        });
        const response = await (0, supertest_1.default)(app).put('/api/notifications/1/read');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
        expect(mockNotificationController.prototype.markAsRead).toHaveBeenCalled();
    });
    it('should create a flash notification', async () => {
        mockNotificationController.prototype.createFlashNotification.mockImplementation(async (req, res) => {
            res.json({ success: true });
        });
        const response = await (0, supertest_1.default)(app)
            .post('/api/notifications/flash')
            .send({ flasherId: '123', flashedUserId: '456' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
        expect(mockNotificationController.prototype.createFlashNotification).toHaveBeenCalled();
    });
    it('should create a profile view notification', async () => {
        mockNotificationController.prototype.createProfileViewNotification.mockImplementation(async (req, res) => {
            res.json({ success: true });
        });
        const response = await (0, supertest_1.default)(app)
            .post('/api/notifications/view')
            .send({ viewerId: '123', viewedUserId: '456' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
        expect(mockNotificationController.prototype.createProfileViewNotification).toHaveBeenCalled();
    });
    it('should create a match notification', async () => {
        mockNotificationController.prototype.createMatchNotification.mockImplementation(async (req, res) => {
            res.json({ success: true });
        });
        const response = await (0, supertest_1.default)(app)
            .post('/api/notifications/match')
            .send({ user1Id: '123', user2Id: '456' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
        expect(mockNotificationController.prototype.createMatchNotification).toHaveBeenCalled();
    });
    it('should create an unflash notification', async () => {
        mockNotificationController.prototype.createUnflashNotification.mockImplementation(async (req, res) => {
            res.json({ success: true });
        });
        const response = await (0, supertest_1.default)(app)
            .post('/api/notifications/unflash')
            .send({ userId: '123', targetUserId: '456' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
        expect(mockNotificationController.prototype.createUnflashNotification).toHaveBeenCalled();
    });
});
