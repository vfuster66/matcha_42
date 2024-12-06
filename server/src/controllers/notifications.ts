// server/src/controllers/notificationController.ts
import { Request, Response } from 'express';
import { NotificationService } from '../services/notifications';

export class NotificationController {
   constructor(private notificationService: NotificationService) {}

   async getUnreadNotifications(req: Request, res: Response) {
       try {
           const userId = parseInt(req.params.userId);
           const notifications = await this.notificationService.getUnreadNotifications(userId);
           res.json(notifications);
       } catch (error) {
           console.error('Error getting unread notifications:', error);
           res.status(500).json({ error: 'Failed to get notifications' });
       }
   }

   async markAsRead(req: Request, res: Response) {
       try {
           const { notificationId } = req.params;
           await this.notificationService.markNotificationAsRead(parseInt(notificationId));
           res.json({ success: true });
       } catch (error) {
           console.error('Error marking notification as read:', error);
           res.status(500).json({ error: 'Failed to mark notification as read' });
       }
   }

   async createFlashNotification(req: Request, res: Response) {
       try {
           const { flasherId, flashedUserId } = req.body;
           await this.notificationService.notifyFlash(
               parseInt(flasherId),
               parseInt(flashedUserId)
           );
           res.json({ success: true });
       } catch (error) {
           console.error('Error creating flash notification:', error);
           res.status(500).json({ error: 'Failed to create notification' });
       }
   }

   async createProfileViewNotification(req: Request, res: Response) {
       try {
           const { viewerId, viewedUserId } = req.body;
           await this.notificationService.notifyProfileView(
               parseInt(viewerId),
               parseInt(viewedUserId)
           );
           res.json({ success: true });
       } catch (error) {
           console.error('Error creating profile view notification:', error);
           res.status(500).json({ error: 'Failed to create notification' });
       }
   }

   async createMatchNotification(req: Request, res: Response) {
       try {
           const { user1Id, user2Id } = req.body;
           await this.notificationService.notifyMatch(
               parseInt(user1Id),
               parseInt(user2Id)
           );
           res.json({ success: true });
       } catch (error) {
           console.error('Error creating match notification:', error);
           res.status(500).json({ error: 'Failed to create notification' });
       }
   }

   async createUnflashNotification(req: Request, res: Response) {
       try {
           const { userId, targetUserId } = req.body;
           await this.notificationService.notifyUnflash(
               parseInt(userId),
               parseInt(targetUserId)
           );
           res.json({ success: true });
       } catch (error) {
           console.error('Error creating unflash notification:', error);
           res.status(500).json({ error: 'Failed to create notification' });
       }
   }
}