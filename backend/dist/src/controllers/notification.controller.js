import { notificationService } from '../services/notification.service.js';
export class NotificationController {
    async getMyNotifications(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ message: 'No autorizado' });
            const notifications = await notificationService.getUserNotifications(userId);
            const unreadCount = await notificationService.getUnreadCount(userId);
            res.json({ notifications, unreadCount });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            if (!id)
                return res.status(400).json({ message: 'ID requerido' });
            await notificationService.markAsRead(id);
            res.json({ message: 'Notificación leída' });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async markAllAsRead(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ message: 'No autorizado' });
            await notificationService.markAllAsRead(userId);
            res.json({ message: 'Todas las notificaciones marcadas como leídas' });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
export const notificationController = new NotificationController();
