"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async getConversation(req, res) {
        try {
            const { userId1, userId2 } = req.params;
            const messages = await this.chatService.getConversation(parseInt(userId1), parseInt(userId2));
            res.json(messages);
        }
        catch (error) {
            console.error('Error getting conversation:', error);
            res.status(500).json({ error: 'Failed to get conversation' });
        }
    }
    async markAsRead(req, res) {
        try {
            const { messageId } = req.params;
            await this.chatService.markMessageAsRead(parseInt(messageId));
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error marking message as read:', error);
            res.status(500).json({ error: 'Failed to mark message as read' });
        }
    }
    async getUnreadCount(req, res) {
        try {
            const { userId } = req.params;
            const count = await this.chatService.getUnreadMessagesCount(parseInt(userId));
            res.json({ unreadCount: count });
        }
        catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({ error: 'Failed to get unread count' });
        }
    }
}
exports.ChatController = ChatController;
