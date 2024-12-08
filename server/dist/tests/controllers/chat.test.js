"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chat_1 = require("../../controllers/chat");
const chat_2 = require("../../services/chat");
jest.mock('../../services/chat');
describe('ChatController', () => {
    let mockRequest;
    let mockResponse;
    let responseObject;
    let chatServiceMock;
    let chatController;
    let mockServer;
    beforeEach(() => {
        mockServer = {}; // Mock minimal du serveur
        chatServiceMock = new chat_2.ChatService(mockServer);
        chatController = new chat_1.ChatController(chatServiceMock);
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
            await chatController.getConversation(mockRequest, mockResponse);
            expect(chatServiceMock.getConversation).toHaveBeenCalledWith(1, 2);
            expect(mockResponse.json).toHaveBeenCalledWith(mockMessages);
        });
        it('should handle errors when getting a conversation', async () => {
            mockRequest.params = { userId1: '1', userId2: '2' };
            chatServiceMock.getConversation.mockRejectedValue(new Error('Database error'));
            await chatController.getConversation(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Failed to get conversation',
            });
        });
    });
    describe('markAsRead', () => {
        it('should mark a message as read', async () => {
            mockRequest.params = { messageId: '123' };
            await chatController.markAsRead(mockRequest, mockResponse);
            expect(chatServiceMock.markMessageAsRead).toHaveBeenCalledWith(123);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });
        it('should handle errors when marking a message as read', async () => {
            mockRequest.params = { messageId: '123' };
            chatServiceMock.markMessageAsRead.mockRejectedValue(new Error('Database error'));
            await chatController.markAsRead(mockRequest, mockResponse);
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
            await chatController.getUnreadCount(mockRequest, mockResponse);
            expect(chatServiceMock.getUnreadMessagesCount).toHaveBeenCalledWith(1);
            expect(mockResponse.json).toHaveBeenCalledWith({ unreadCount: 5 });
        });
        it('should handle errors when getting the unread message count', async () => {
            mockRequest.params = { userId: '1' };
            chatServiceMock.getUnreadMessagesCount.mockRejectedValue(new Error('Database error'));
            await chatController.getUnreadCount(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Failed to get unread count',
            });
        });
    });
});
