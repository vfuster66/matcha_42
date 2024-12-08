"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/notifications.ts
const express_1 = require("express");
const notifications_1 = require("../controllers/notifications");
const notifications_2 = require("../services/notifications");
const router = (0, express_1.Router)();
const http_1 = require("http");
const server = (0, http_1.createServer)();
const notificationService = new notifications_2.NotificationService(server);
const notificationController = new notifications_1.NotificationController(notificationService);
router.get('/:userId/unread', notificationController.getUnreadNotifications.bind(notificationController));
router.put('/:notificationId/read', notificationController.markAsRead.bind(notificationController));
router.post('/flash', notificationController.createFlashNotification.bind(notificationController));
router.post('/view', notificationController.createProfileViewNotification.bind(notificationController));
router.post('/match', notificationController.createMatchNotification.bind(notificationController));
router.post('/unflash', notificationController.createUnflashNotification.bind(notificationController));
exports.default = router;
