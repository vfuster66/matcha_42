import { Request, Response } from 'express';
import { Server } from 'http';
import { ChatController } from '../../controllers/chat';
import { ChatService } from '../../services/chat';

jest.mock('../../services/chat');

describe('ChatController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseObject: any;
    let chatServiceMock: jest.Mocked<ChatService>;
    let chatController: ChatController;
    let mockServer: Server;

    beforeEach(() => {
        mockServer = {} as Server; // Mock minimal du serveur
        chatServiceMock = new ChatService(mockServer) as jest.Mocked<ChatService>;
        chatController = new ChatController(chatServiceMock);

        mockRequest = {
            params: {},
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

    describe('getConversation', () => {
        it('should return a conversation between two users', async () => {
            const mockMessages = [
                { id: 1, sender_id: 1, receiver_id: 2, content: 'Hello!', sent_at: new Date(), read_at: null },
                { id: 2, sender_id: 2, receiver_id: 1, content: 'Hi!', sent_at: new Date(), read_at: null },
            ];

            mockRequest.params = { userId1: '1', userId2: '2' };
            chatServiceMock.getConversation.mockResolvedValue(mockMessages);

            await chatController.getConversation(mockRequest as Request, mockResponse as Response);

            expect(chatServiceMock.getConversation).toHaveBeenCalledWith(1, 2);
            expect(mockResponse.json).toHaveBeenCalledWith(mockMessages);
        });

        it('should handle errors when getting a conversation', async () => {
            mockRequest.params = { userId1: '1', userId2: '2' };
            chatServiceMock.getConversation.mockRejectedValue(new Error('Database error'));

            await chatController.getConversation(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Failed to get conversation',
            });
        });
    });

    describe('markAsRead', () => {
        it('should mark a message as read', async () => {
            mockRequest.params = { messageId: '123' };

            await chatController.markAsRead(mockRequest as Request, mockResponse as Response);

            expect(chatServiceMock.markMessageAsRead).toHaveBeenCalledWith(123);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });

        it('should handle errors when marking a message as read', async () => {
            mockRequest.params = { messageId: '123' };
            chatServiceMock.markMessageAsRead.mockRejectedValue(new Error('Database error'));

            await chatController.markAsRead(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Failed to mark message as read',
            });
        });
    });

    describe('getUnreadCount', () => {
        it('should return the count of unread messages for a user', async () => {
            mockRequest.params = { userId: '1' };
            chatServiceMock.getUnreadMessagesCount.mockResolvedValue(5);

            await chatController.getUnreadCount(mockRequest as Request, mockResponse as Response);

            expect(chatServiceMock.getUnreadMessagesCount).toHaveBeenCalledWith(1);
            expect(mockResponse.json).toHaveBeenCalledWith({ unreadCount: 5 });
        });

        it('should handle errors when getting the unread message count', async () => {
            mockRequest.params = { userId: '1' };
            chatServiceMock.getUnreadMessagesCount.mockRejectedValue(new Error('Database error'));

            await chatController.getUnreadCount(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Failed to get unread count',
            });
        });
    });
});
