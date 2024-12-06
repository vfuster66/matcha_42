// server/src/services/chatService.ts
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

export class ChatService {
   private io: SocketServer;
   private static readonly MAX_DELAY = 10000;

   constructor(server: Server) {
       this.io = new SocketServer(server, {
           cors: {
               origin: process.env.CLIENT_URL,
               methods: ["GET", "POST"]
           }
       });

       this.io.on('connection', (socket) => {
           socket.on('join', (userId: string) => {
               socket.join(`user_${userId}`);
           });

           socket.on('sendMessage', async (data: {
               senderId: number,
               receiverId: number,
               content: string
           }) => {
               try {
                   // Vérifier si les utilisateurs peuvent chatter
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

                   // Mettre à jour le compteur de messages non lus
                   const unreadCount = await this.getUnreadMessagesCount(data.receiverId);
                   this.io.to(`user_${data.receiverId}`).emit('unreadMessages', unreadCount);
               } catch (error) {
                   console.error('Error sending message:', error);
                   socket.emit('messageError', 'Failed to send message');
               }
           });

           socket.on('typing', (data: { senderId: number, receiverId: number }) => {
               this.io.to(`user_${data.receiverId}`).emit('userTyping', data.senderId);
           });

           socket.on('markAsRead', async (data: { messageId: number, userId: number }) => {
               await this.markMessageAsRead(data.messageId);
               const unreadCount = await this.getUnreadMessagesCount(data.userId);
               socket.emit('unreadMessages', unreadCount);
           });
       });
   }

   private async saveMessage(data: {
       senderId: number,
       receiverId: number,
       content: string
   }): Promise<Message> {
       const result = await db.query(`
           INSERT INTO messages (sender_id, receiver_id, content, sent_at)
           VALUES ($1, $2, $3, NOW())
           RETURNING *
       `, [data.senderId, data.receiverId, data.content]);
       return result.rows[0];
   }

   public async getConversation(userId1: number, userId2: number): Promise<Message[]> {
       const messages = await db.query(`
           SELECT * FROM messages
           WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
           ORDER BY sent_at ASC
       `, [userId1, userId2]);
       return messages.rows;
   }

   private async canChat(userId1: number, userId2: number): Promise<boolean> {
       const result = await db.query(`
           SELECT EXISTS (
               SELECT 1 FROM user_likes
               WHERE (user_id = $1 AND liked_user_id = $2)
               AND EXISTS (
                   SELECT 1 FROM user_likes
                   WHERE user_id = $2 AND liked_user_id = $1
               )
           )
       `, [userId1, userId2]);
       return result.rows[0].exists;
   }

   public async markMessageAsRead(messageId: number): Promise<void> {
       await db.query(`
           UPDATE messages 
           SET read_at = NOW() 
           WHERE id = $1
       `, [messageId]);
   }

   public async getUnreadMessagesCount(userId: number): Promise<number> {
       const result = await db.query(`
           SELECT COUNT(*) 
           FROM messages 
           WHERE receiver_id = $1 
           AND read_at IS NULL
       `, [userId]);
       return parseInt(result.rows[0].count);
   }

   private async emitWithDelay(event: string, data: any): Promise<void> {
       const startTime = Date.now();
       try {
           await this.io.to(data.room).emit(event, data.message);
           const delay = Date.now() - startTime;
           if (delay > ChatService.MAX_DELAY) {
               console.warn(`Message delay exceeded ${ChatService.MAX_DELAY}ms: ${delay}ms`);
           }
       } catch (error) {
           console.error('Message sending failed:', error);
       }
   }
}