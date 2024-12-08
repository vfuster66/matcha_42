"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const socket_io_1 = require("socket.io");
const database_1 = require("../config/database");
class ChatService {
    constructor(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.CLIENT_URL,
                methods: ['GET', 'POST']
            }
        });
        this.setupSocketHandlers();
    }
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            socket.on('join', (userId) => {
                socket.join(`user_${userId}`);
            });
            socket.on('sendMessage', async (data) => {
                try {
                    await this.handleNewMessage(socket, data);
                }
                catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('messageError', 'Failed to send message');
                }
            });
            socket.on('typing', (data) => {
                this.io.to(`user_${data.receiverId}`).emit('userTyping', data.senderId);
            });
            socket.on('markAsRead', async (data) => {
                try {
                    await this.handleMarkAsRead(socket, data);
                }
                catch (error) {
                    console.error('Error marking message as read:', error);
                    socket.emit('messageError', 'Failed to mark message as read');
                }
            });
        });
    }
    async handleNewMessage(socket, data) {
        const canChat = await this.canChat(data.senderId, data.receiverId);
        if (!canChat) {
            socket.emit('messageError', 'Users are not matched');
            return;
        }
        const message = await this.saveMessage(data);
        await this.emitWithDelay('newMessage', {
            room: `user_${data.receiverId}`,
            message
        });
        socket.emit('messageSent', message);
        const unreadCount = await this.getUnreadMessagesCount(data.receiverId);
        await this.io.to(`user_${data.receiverId}`).emit('unreadMessages', unreadCount);
    }
    async handleMarkAsRead(socket, data) {
        await this.markMessageAsRead(data.messageId);
        const unreadCount = await this.getUnreadMessagesCount(data.userId);
        socket.emit('unreadMessages', unreadCount);
    }
    async saveMessage(data) {
        const result = await database_1.db.query(`
            INSERT INTO messages (sender_id, receiver_id, content, sent_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *
        `, [data.senderId, data.receiverId, data.content]);
        if (!result.rows[0]) {
            throw new Error('Failed to save message');
        }
        return result.rows[0];
    }
    async getConversation(userId1, userId2) {
        const result = await database_1.db.query(`
            SELECT * FROM messages
            WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY sent_at ASC
        `, [userId1, userId2]);
        return result.rows;
    }
    async canChat(userId1, userId2) {
        const result = await database_1.db.query(`
            SELECT EXISTS (
                SELECT 1 FROM user_likes
                WHERE (user_id = $1 AND liked_user_id = $2)
                AND EXISTS (
                    SELECT 1 FROM user_likes
                    WHERE user_id = $2 AND liked_user_id = $1
                )
            )
        `, [userId1, userId2]);
        return result.rows[0]?.exists ?? false;
    }
    async markMessageAsRead(messageId) {
        await database_1.db.query('UPDATE messages SET read_at = NOW() WHERE id = $1', [messageId]);
    }
    async getUnreadMessagesCount(userId) {
        const result = await database_1.db.query('SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND read_at IS NULL', [userId]);
        return parseInt(result.rows[0].count);
    }
    async emitWithDelay(event, data) {
        const startTime = Date.now();
        try {
            await this.io.to(data.room).emit(event, data.message);
            const delay = Date.now() - startTime;
            if (delay > ChatService.MAX_DELAY) {
                console.warn(`Message delay exceeded ${ChatService.MAX_DELAY}ms: ${delay}ms`);
            }
        }
        catch (error) {
            const typedError = error;
            throw typedError;
        }
    }
}
exports.ChatService = ChatService;
ChatService.MAX_DELAY = 10000;
