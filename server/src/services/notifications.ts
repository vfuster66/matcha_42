// server/src/services/notifications.ts
import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { db } from '../config/database';

export enum NotificationType {
    LIKE = 'flash',
    PROFILE_VIEW = 'profile_view',
    MESSAGE = 'message',
    MATCH = 'match',
    UNLIKE = 'unflash'
}

interface Notification {
    id: number;
    recipient_id: number;
    type: NotificationType;
    sender_id: number;
    content: string;
    read: boolean;
    created_at: Date;
}

export class NotificationService {
    private io: SocketServer;
    private static readonly MAX_DELAY = 10000;

    constructor(server: Server) {
        this.io = new SocketServer(server);
        this.setupSocketListeners();
    }

    private setupSocketListeners() {
        this.io.on('connection', (socket) => {
            socket.on('join', (userId: string) => {
                socket.join(`user_${userId}`);
            });

            socket.on('markAsRead', async (notificationId: number) => {
                await this.markNotificationAsRead(notificationId);
            });
        });
    }

    async createNotification(data: {
        recipientId: number;
        type: NotificationType;
        senderId: number;
        content: string;
    }): Promise<void> {
        try {
            const notification = await db.query(`
                INSERT INTO notifications (recipient_id, type, sender_id, content, read)
                VALUES ($1, $2, $3, $4, false)
                RETURNING *
            `, [data.recipientId, data.type, data.senderId, data.content]);

            await this.emitWithDelay('newNotification', {
                userId: data.recipientId,
                notification: notification.rows[0]
            });
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    async getUnreadNotifications(userId: number): Promise<Notification[]> {
        const result = await db.query(`
            SELECT * FROM notifications
            WHERE recipient_id = $1 AND read = false
            ORDER BY created_at DESC
        `, [userId]);
        return result.rows;
    }

    async markNotificationAsRead(notificationId: number): Promise<void> {
        await db.query(
            'UPDATE notifications SET read = true WHERE id = $1',
            [notificationId]
        );
    }    

    private async emitWithDelay(event: string, data: any): Promise<void> {
        const startTime = Date.now();
        try {
            await this.io.to(`user_${data.userId}`).emit(event, data.notification);
            const delay = Date.now() - startTime;
            if (delay > NotificationService.MAX_DELAY) {
                console.warn(`Notification delay exceeded ${NotificationService.MAX_DELAY}ms: ${delay}ms`);
            }
        } catch (error) {
            console.error('Notification sending failed:', error);
        }
    }

    // Méthodes spécifiques pour chaque type de notification
    async notifyFlash(flasherId: number, flashedUserId: number): Promise<void> {
        await this.createNotification({
            recipientId: flashedUserId,
            type: NotificationType.LIKE,
            senderId: flasherId,
            content: 'flashed your profile'
        });
    }

    async notifyProfileView(viewerId: number, viewedUserId: number): Promise<void> {
        await this.createNotification({
            recipientId: viewedUserId,
            type: NotificationType.PROFILE_VIEW,
            senderId: viewerId,
            content: 'viewed your profile'
        });
    }

    async notifyMatch(user1Id: number, user2Id: number): Promise<void> {
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

    async notifyUnflash(unflasherId: number, unflashedUserId: number): Promise<void> {
        await this.createNotification({
            recipientId: unflashedUserId,
            type: NotificationType.UNLIKE,
            senderId: unflasherId,
            content: 'removed their flash'
        });
    }

    async getAllNotifications(userId: number): Promise<Notification[]> {
        const result = await db.query(`
            SELECT * FROM notifications
            WHERE recipient_id = $1
            ORDER BY created_at DESC
        `, [userId]);
        return result.rows;
    }

    private async notificationExists(data: {
        recipientId: number;
        type: NotificationType;
        senderId: number;
    }): Promise<boolean> {
        const result = await db.query(`
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