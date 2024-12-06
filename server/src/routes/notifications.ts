// server/src/routes/notifications.ts
import { Router } from 'express';
import { NotificationController } from '../controllers/notifications';
import { NotificationService } from '../services/notifications';

const router = Router();

import { Server } from 'http';
import { createServer } from 'http';

const server: Server = createServer();
const notificationService = new NotificationService(server);
const notificationController = new NotificationController(notificationService);

router.get('/:userId/unread', notificationController.getUnreadNotifications.bind(notificationController));
router.put('/:notificationId/read', notificationController.markAsRead.bind(notificationController));
router.post('/flash', notificationController.createFlashNotification.bind(notificationController));
router.post('/view', notificationController.createProfileViewNotification.bind(notificationController));
router.post('/match', notificationController.createMatchNotification.bind(notificationController));
router.post('/unflash', notificationController.createUnflashNotification.bind(notificationController));

export default router;