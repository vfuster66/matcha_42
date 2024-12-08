"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.NotificationType = void 0;
// server/src/services/notifications.ts
const socket_io_1 = require("socket.io");
const database_1 = require("../config/database");
var NotificationType;
(function (NotificationType) {
    NotificationType["LIKE"] = "flash";
    NotificationType["PROFILE_VIEW"] = "profile_view";
    NotificationType["MESSAGE"] = "message";
    NotificationType["MATCH"] = "match";
    NotificationType["UNLIKE"] = "unflash";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
class NotificationService {
    constructor(server) {
        this.io = new socket_io_1.Server(server);
        this.setupSocketListeners();
    }
    setupSocketListeners() {
        this.io.on('connection', (socket) => {
            socket.on('join', (userId) => {
                socket.join(`user_${userId}`);
            });
            socket.on('markAsRead', async (notificationId) => {
                await this.markNotificationAsRead(notificationId);
            });
        });
    }
    async createNotification(data) {
        try {
            const notification = await database_1.db.query(`
                INSERT INTO notifications (recipient_id, type, sender_id, content, read)
                VALUES ($1, $2, $3, $4, false)
                RETURNING *
            `, [data.recipientId, data.type, data.senderId, data.content]);
            await this.emitWithDelay('newNotification', {
                userId: data.recipientId,
                notification: notification.rows[0]
            });
        }
        catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }
    async getUnreadNotifications(userId) {
        const result = await database_1.db.query(`
            SELECT * FROM notifications
            WHERE recipient_id = $1 AND read = false
            ORDER BY created_at DESC
        `, [userId]);
        return result.rows;
    }
    async markNotificationAsRead(notificationId) {
        await database_1.db.query('UPDATE notifications SET read = true WHERE id = $1', [notificationId]);
    }
    async emitWithDelay(event, data) {
        const startTime = Date.now();
        try {
            await this.io.to(`user_${data.userId}`).emit(event, data.notification);
            const delay = Date.now() - startTime;
            if (delay > NotificationService.MAX_DELAY) {
                console.warn(`Notification delay exceeded ${NotificationService.MAX_DELAY}ms: ${delay}ms`);
            }
        }
        catch (error) {
            console.error('Notification sending failed:', error);
        }
    }
    // Méthodes spécifiques pour chaque type de notification
    async notifyFlash(flasherId, flashedUserId) {
        await this.createNotification({
            recipientId: flashedUserId,
            type: NotificationType.LIKE,
            senderId: flasherId,
            content: 'flashed your profile'
        });
    }
    async notifyProfileView(viewerId, viewedUserId) {
        await this.createNotification({
            recipientId: viewedUserId,
            type: NotificationType.PROFILE_VIEW,
            senderId: viewerId,
            content: 'viewed your profile'
        });
    }
    async notifyMatch(user1Id, user2Id) {
        await Promise.all([
            this.createNotification({
                recipientId: user1Id,
                type: NotificationType.MATCH,
                senderId: user2Id,
                content: 'you have a new match'
            }),
            this.createNotification({
                recipientId: user2Id,
                type: NotificationType.MATCH,
                senderId: user1Id,
                content: 'you have a new match'
            })
        ]);
    }
    async notifyUnflash(unflasherId, unflashedUserId) {
        await this.createNotification({
            recipientId: unflashedUserId,
            type: NotificationType.UNLIKE,
            senderId: unflasherId,
            content: 'removed their flash'
        });
    }
    async getAllNotifications(userId) {
        const result = await database_1.db.query(`
            SELECT * FROM notifications
            WHERE recipient_id = $1
            ORDER BY created_at DESC
        `, [userId]);
        return result.rows;
    }
    async notificationExists(data) {
        const result = await database_1.db.query(`
            SELECT EXISTS (
                SELECT 1 FROM notifications
                WHERE recipient_id = $1
                AND type = $2
                AND sender_id = $3
                AND created_at > NOW() - INTERVAL '1 day'
            )
        `, [data.recipientId, data.type, data.senderId]);
        return result.rows[0].exists;
    }
}
exports.NotificationService = NotificationService;
NotificationService.MAX_DELAY = 10000;
