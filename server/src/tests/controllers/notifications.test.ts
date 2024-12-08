import { Request, Response } from 'express';
import { NotificationController } from '../../controllers/notifications';
import { NotificationService, NotificationType } from '../../services/notifications';
import { Notification } from '../../types/index';

jest.mock('../../services/notifications');

describe('NotificationController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let notificationServiceMock: jest.Mocked<NotificationService>;
    let notificationController: NotificationController;
    let responseObject: any;

    beforeEach(() => {
        const mockServer = {} as any;
        notificationServiceMock = new NotificationService(mockServer) as jest.Mocked<NotificationService>;
        notificationController = new NotificationController(notificationServiceMock);

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
            const mockNotifications: Notification[] = [
                {
                    id: 1,
                    recipient_id: 101,
                    sender_id: 102,
                    type: NotificationType.MESSAGE, // Utilisation correcte d'un littéral valide
                    content: 'Notification content 1',
                    created_at: new Date(),
                    read: false,
                },
                {
                    id: 2,
                    recipient_id: 101,
                    sender_id: 103,
                    type: NotificationType.MATCH, // Utilisation correcte d'un littéral valide
                    content: 'Notification content 2',
                    created_at: new Date(),
                    read: true,
                },
            ];
                     
            notificationServiceMock.getUnreadNotifications.mockResolvedValue(mockNotifications);

            mockRequest.params = { userId: '123' };

            await notificationController.getUnreadNotifications(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(notificationServiceMock.getUnreadNotifications).toHaveBeenCalledWith(123);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(mockNotifications);
        });

        it('should handle errors', async () => {
            notificationServiceMock.getUnreadNotifications.mockRejectedValue(new Error('Error'));

            mockRequest.params = { userId: '123' };

            await notificationController.getUnreadNotifications(
                mockRequest as Request,
                mockResponse as Response
            );

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
    
            await notificationController.markAsRead(mockRequest as Request, mockResponse as Response);
    
            expect(notificationServiceMock.markNotificationAsRead).toHaveBeenCalledWith(1);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });
    
        it('should handle errors', async () => {
            notificationServiceMock.markNotificationAsRead.mockRejectedValue(new Error('Error'));
    
            mockRequest.params = mockRequest.params || {};
            mockRequest.params.notificationId = '1';
    
            await notificationController.markAsRead(mockRequest as Request, mockResponse as Response);
    
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to mark notification as read' });
        });
    });
    

    describe('createFlashNotification', () => {
        it('should create a flash notification', async () => {
            mockRequest.body = { flasherId: '1', flashedUserId: '2' };

            await notificationController.createFlashNotification(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(notificationServiceMock.notifyFlash).toHaveBeenCalledWith(1, 2);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });

        it('should handle errors', async () => {
            notificationServiceMock.notifyFlash.mockRejectedValue(new Error('Error'));

            mockRequest.body = { flasherId: '1', flashedUserId: '2' };

            await notificationController.createFlashNotification(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to create notification' });
        });
    });

    describe('createProfileViewNotification', () => {
        it('should create a profile view notification', async () => {
            mockRequest.body = { viewerId: '1', viewedUserId: '2' };

            await notificationController.createProfileViewNotification(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(notificationServiceMock.notifyProfileView).toHaveBeenCalledWith(1, 2);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });

        it('should handle errors', async () => {
            notificationServiceMock.notifyProfileView.mockRejectedValue(new Error('Error'));

            mockRequest.body = { viewerId: '1', viewedUserId: '2' };

            await notificationController.createProfileViewNotification(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to create notification' });
        });
    });

    describe('createMatchNotification', () => {
        it('should create a match notification', async () => {
            mockRequest.body = { user1Id: '1', user2Id: '2' };

            await notificationController.createMatchNotification(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(notificationServiceMock.notifyMatch).toHaveBeenCalledWith(1, 2);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });

        it('should handle errors', async () => {
            notificationServiceMock.notifyMatch.mockRejectedValue(new Error('Error'));

            mockRequest.body = { user1Id: '1', user2Id: '2' };

            await notificationController.createMatchNotification(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to create notification' });
        });
    });

    describe('createUnflashNotification', () => {
        it('should create an unflash notification', async () => {
            mockRequest.body = { userId: '1', targetUserId: '2' };

            await notificationController.createUnflashNotification(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(notificationServiceMock.notifyUnflash).toHaveBeenCalledWith(1, 2);
            expect(mockResponse.status).not.toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });

        it('should handle errors', async () => {
            notificationServiceMock.notifyUnflash.mockRejectedValue(new Error('Error'));

            mockRequest.body = { userId: '1', targetUserId: '2' };

            await notificationController.createUnflashNotification(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toMatchObject({ error: 'Failed to create notification' });
        });
    });
});
