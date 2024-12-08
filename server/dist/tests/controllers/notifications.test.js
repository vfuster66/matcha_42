"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notifications_1 = require("../../controllers/notifications");
const notifications_2 = require("../../services/notifications");
jest.mock('../../services/notifications');
describe('NotificationController', () => {
    let mockRequest;
    let mockResponse;
    let notificationServiceMock;
    let notificationController;
    let responseObject;
    beforeEach(() => {
        const mockServer = {};
        notificationServiceMock = new notifications_2.NotificationService(mockServer);
        notificationController = new notifications_1.NotificationController(notificationServiceMock);
        mockRequest = {
            params: {},
            body: {},
        };
        responseObject = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockImplementation((result) => {
                responseObject = result;
            }),
        };
        jest.clearAllMocks();
    });
    describe('getUnreadNotifications', () => {
        it('should return unread notifications', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    recipient_id: 101,
                    sender_id: 102,
                    type: notifications_2.NotificationType.MESSAGE, // Utilisation correcte d'un littéral valide
                    content: 'Notification content 1',
                    created_at: new Date(),
                    read: false,
                },
                {
                    id: 2,
                    recipient_id: 101,
                    sender_id: 103,
                    type: notifications_2.NotificationType.MATCH, // Utilisation correcte d'un littéral valide
                    content: 'Notification content 2',
                    created_at: new Date(),
                    read: true,
                },
            ];
            notificationServiceMock.getUnreadNotifications.mockResolvedValue(mockNotifications);
            mockRequest.params = { userId: '123' };
            await notificationController.getUnreadNotifications(mockRequest, mockResponse);
            expect(notificationServiceMock.getUnreadNotifications).toHaveBeenCalledWith(123);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(mockNotifications);
        });
        it('should handle errors', async () => {
            notificationServiceMock.getUnreadNotifications.mockRejectedValue(new Error('Error'));
            mockRequest.params = { userId: '123' };
            await notificationController.getUnreadNotifications(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to get notifications' });
        });
    });
    describe('markAsRead', () => {
        beforeEach(() => {
            mockRequest.params = {}; // Initialise params comme un objet vide
        });
        it('should mark a notification as read', async () => {
            mockRequest.params = mockRequest.params || {};
            mockRequest.params.notificationId = '1';
            await notificationController.markAsRead(mockRequest, mockResponse);
            expect(notificationServiceMock.markNotificationAsRead).toHaveBeenCalledWith(1);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });
        it('should handle errors', async () => {
            notificationServiceMock.markNotificationAsRead.mockRejectedValue(new Error('Error'));
            mockRequest.params = mockRequest.params || {};
            mockRequest.params.notificationId = '1';
            await notificationController.markAsRead(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to mark notification as read' });
        });
    });
    describe('createFlashNotification', () => {
        it('should create a flash notification', async () => {
            mockRequest.body = { flasherId: '1', flashedUserId: '2' };
            await notificationController.createFlashNotification(mockRequest, mockResponse);
            expect(notificationServiceMock.notifyFlash).toHaveBeenCalledWith(1, 2);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });
        it('should handle errors', async () => {
            notificationServiceMock.notifyFlash.mockRejectedValue(new Error('Error'));
            mockRequest.body = { flasherId: '1', flashedUserId: '2' };
            await notificationController.createFlashNotification(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to create notification' });
        });
    });
    describe('createProfileViewNotification', () => {
        it('should create a profile view notification', async () => {
            mockRequest.body = { viewerId: '1', viewedUserId: '2' };
            await notificationController.createProfileViewNotification(mockRequest, mockResponse);
            expect(notificationServiceMock.notifyProfileView).toHaveBeenCalledWith(1, 2);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });
        it('should handle errors', async () => {
            notificationServiceMock.notifyProfileView.mockRejectedValue(new Error('Error'));
            mockRequest.body = { viewerId: '1', viewedUserId: '2' };
            await notificationController.createProfileViewNotification(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to create notification' });
        });
    });
    describe('createMatchNotification', () => {
        it('should create a match notification', async () => {
            mockRequest.body = { user1Id: '1', user2Id: '2' };
            await notificationController.createMatchNotification(mockRequest, mockResponse);
            expect(notificationServiceMock.notifyMatch).toHaveBeenCalledWith(1, 2);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });
        it('should handle errors', async () => {
            notificationServiceMock.notifyMatch.mockRejectedValue(new Error('Error'));
            mockRequest.body = { user1Id: '1', user2Id: '2' };
            await notificationController.createMatchNotification(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to create notification' });
        });
    });
    describe('createUnflashNotification', () => {
        it('should create an unflash notification', async () => {
            mockRequest.body = { userId: '1', targetUserId: '2' };
            await notificationController.createUnflashNotification(mockRequest, mockResponse);
            expect(notificationServiceMock.notifyUnflash).toHaveBeenCalledWith(1, 2);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });
        it('should handle errors', async () => {
            notificationServiceMock.notifyUnflash.mockRejectedValue(new Error('Error'));
            mockRequest.body = { userId: '1', targetUserId: '2' };
            await notificationController.createUnflashNotification(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to create notification' });
        });
    });
});
