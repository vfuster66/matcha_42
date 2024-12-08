import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { db } from '../config/database';

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    sent_at: Date;
    read_at: Date | null;
}

interface MessageInput {
    senderId: number;
    receiverId: number;
    content: string;
}

interface TypingData {
    senderId: number;
    receiverId: number;
}

interface ReadData {
    messageId: number;
    userId: number;
}

export class ChatService {
    private readonly io: SocketServer;
    private static readonly MAX_DELAY = 10000;

    constructor(server: Server) {
        this.io = new SocketServer(server, {
            cors: {
                origin: process.env.CLIENT_URL,
                methods: ['GET', 'POST']
            }
        });

        this.setupSocketHandlers();
    }

    private setupSocketHandlers(): void {
        this.io.on('connection', (socket) => {
            socket.on('join', (userId: string) => {
                socket.join(`user_${userId}`);
            });

            socket.on('sendMessage', async (data: MessageInput) => {
                try {
                    await this.handleNewMessage(socket, data);
                } catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('messageError', 'Failed to send message');
                }
            });

            socket.on('typing', (data: TypingData) => {
                this.io.to(`user_${data.receiverId}`).emit('userTyping', data.senderId);
            });

            socket.on('markAsRead', async (data: ReadData) => {
                try {
                    await this.handleMarkAsRead(socket, data);
                } catch (error) {
                    console.error('Error marking message as read:', error);
                    socket.emit('messageError', 'Failed to mark message as read');
                }
            });
        });
    }

    private async handleNewMessage(socket: any, data: MessageInput): Promise<void> {
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

    private async handleMarkAsRead(socket: any, data: ReadData): Promise<void> {
        await this.markMessageAsRead(data.messageId);
        const unreadCount = await this.getUnreadMessagesCount(data.userId);
        socket.emit('unreadMessages', unreadCount);
    }

    private async saveMessage(data: MessageInput): Promise<Message> {
        const result = await db.query<Message>(`
            INSERT INTO messages (sender_id, receiver_id, content, sent_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *
        `, [data.senderId, data.receiverId, data.content]);

        if (!result.rows[0]) {
            throw new Error('Failed to save message');
        }

        return result.rows[0];
    }

    public async getConversation(userId1: number, userId2: number): Promise<Message[]> {
        const result = await db.query<Message>(`
            SELECT * FROM messages
            WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY sent_at ASC
        `, [userId1, userId2]);

        return result.rows;
    }

    private async canChat(userId1: number, userId2: number): Promise<boolean> {
        const result = await db.query<{ exists: boolean }>(`
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

    public async markMessageAsRead(messageId: number): Promise<void> {
        await db.query(
            'UPDATE messages SET read_at = NOW() WHERE id = $1',
            [messageId]
        );
    }

    public async getUnreadMessagesCount(userId: number): Promise<number> {
        const result = await db.query(
            'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND read_at IS NULL',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    private async emitWithDelay(event: string, data: { room: string; message: any }): Promise<void> {
        const startTime = Date.now();
        
        try {
            await this.io.to(data.room).emit(event, data.message);
            
            const delay = Date.now() - startTime;
            if (delay > ChatService.MAX_DELAY) {
                console.warn(`Message delay exceeded ${ChatService.MAX_DELAY}ms: ${delay}ms`);
            }
        } catch (error) {
            const typedError = error as Error;
            throw typedError;
        }
    }
}