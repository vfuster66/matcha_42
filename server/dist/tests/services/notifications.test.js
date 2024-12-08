"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notifications_1 = require("../../services/notifications");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = require("../../config/database");
// Mock du module database
jest.mock('../../config/database', () => ({
    db: {
        query: jest.fn(),
    },
}));
// Mock de Socket.io
const mockEmit = jest.fn();
jest.mock('socket.io', () => ({
    Server: jest.fn().mockImplementation(() => ({
        to: jest.fn(() => ({ emit: mockEmit })),
        on: jest.fn(),
    })),
}));
describe('NotificationService', () => {
    let notificationService;
    let mockServer;
    let mockSocketServer;
    beforeEach(() => {
        mockServer = new http_1.Server();
        notificationService = new notifications_1.NotificationService(mockServer);
        mockSocketServer = new socket_io_1.Server(mockServer);
        jest.clearAllMocks();
    });
    describe('createNotification', () => {
        it('should create a notification and emit it', async () => {
            const mockNotification = {
                id: 1,
                recipient_id: 2,
                type: notifications_1.NotificationType.LIKE,
                sender_id: 1,
                content: 'flashed your profile',
                read: false,
                created_at: new Date(),
            };
            database_1.db.query
                .mockResolvedValueOnce({ rows: [mockNotification] });
            await notificationService.createNotification({
                recipientId: 2,
                type: notifications_1.NotificationType.LIKE,
                senderId: 1,
                content: 'flashed your profile',
            });
            expect(database_1.db.query).toHaveBeenCalledWith(expect.any(String), [2, notifications_1.NotificationType.LIKE, 1, 'flashed your profile']);
            expect(mockEmit).toHaveBeenCalledWith('newNotification', mockNotification);
        });
        it('should handle database errors', async () => {
            database_1.db.query.mockRejectedValueOnce(new Error('Database error'));
            await expect(notificationService.createNotification({
                recipientId: 2,
                type: notifications_1.NotificationType.LIKE,
                senderId: 1,
                content: 'flashed your profile',
            })).rejects.toThrow('Database error');
        });
    });
    describe('getUnreadNotifications', () => {
        it('should return unread notifications for a user', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    recipient_id: 2,
                    type: notifications_1.NotificationType.MESSAGE,
                    sender_id: 1,
                    content: 'sent you a message',
                    read: false,
                    created_at: new Date(),
                },
            ];
            database_1.db.query.mockResolvedValueOnce({ rows: mockNotifications });
            const result = await notificationService.getUnreadNotifications(2);
            expect(database_1.db.query).toHaveBeenCalledWith(expect.any(String), [2]);
            expect(result).toEqual(mockNotifications);
        });
    });
    it('should mark a notification as read', async () => {
        await notificationService.markNotificationAsRead(1);
        expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE notifications SET read = true'), [1]);
    });
    describe('notifyFlash', () => {
        it('should create a flash notification', async () => {
            jest.spyOn(notificationService, 'createNotification').mockResolvedValueOnce();
            await notificationService.notifyFlash(1, 2);
            expect(notificationService.createNotification).toHaveBeenCalledWith({
                recipientId: 2,
                type: notifications_1.NotificationType.LIKE,
                senderId: 1,
                content: 'flashed your profile',
            });
        });
    });
    describe('notifyProfileView', () => {
        it('should create a profile view notification', async () => {
            jest.spyOn(notificationService, 'createNotification').mockResolvedValueOnce();
            await notificationService.notifyProfileView(1, 2);
            expect(notificationService.createNotification).toHaveBeenCalledWith({
                recipientId: 2,
                type: notifications_1.NotificationType.PROFILE_VIEW,
                senderId: 1,
                content: 'viewed your profile',
            });
        });
    });
    describe('notifyMatch', () => {
        it('should create match notifications for both users', async () => {
            database_1.db.query.mockResolvedValue({
                rows: [
                    { id: 1, recipient_id: 1, type: notifications_1.NotificationType.MATCH, sender_id: 2, content: 'you have a new match', read: false, created_at: new Date() },
                    { id: 2, recipient_id: 2, type: notifications_1.NotificationType.MATCH, sender_id: 1, content: 'you have a new match', read: false, created_at: new Date() }
                ]
            });
            await notificationService.notifyMatch(1, 2);
            expect(database_1.db.query).toHaveBeenCalledTimes(2);
            expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO notifications'), [1, notifications_1.NotificationType.MATCH, 2, 'you have a new match']);
            expect(database_1.db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO notifications'), [2, notifications_1.NotificationType.MATCH, 1, 'you have a new match']);
        });
    });
    describe('notifyUnflash', () => {
        it('should create an unflash notification', async () => {
            jest.spyOn(notificationService, 'createNotification').mockResolvedValueOnce();
            await notificationService.notifyUnflash(1, 2);
            expect(notificationService.createNotification).toHaveBeenCalledWith({
                recipientId: 2,
                type: notifications_1.NotificationType.UNLIKE,
                senderId: 1,
                content: 'removed their flash',
            });
        });
    });
    describe('getAllNotifications', () => {
        it('should return all notifications for a user', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    recipient_id: 2,
                    type: notifications_1.NotificationType.MATCH,
                    sender_id: 1,
                    content: 'you have a new match',
                    read: false,
                    created_at: new Date(),
                },
            ];
            database_1.db.query.mockResolvedValueOnce({ rows: mockNotifications });
            const result = await notificationService.getAllNotifications(2);
            expect(database_1.db.query).toHaveBeenCalledWith(expect.any(String), [2]);
            expect(result).toEqual(mockNotifications);
        });
    });
    describe('notificationExists', () => {
        it('should check if a similar notification exists', async () => {
            database_1.db.query.mockResolvedValueOnce({ rows: [{ exists: true }] });
            const result = await notificationService.notificationExists({
                recipientId: 2,
                type: notifications_1.NotificationType.LIKE,
                senderId: 1,
            });
            expect(database_1.db.query).toHaveBeenCalledWith(expect.any(String), [2, notifications_1.NotificationType.LIKE, 1]);
            expect(result).toBe(true);
        });
    });
});
