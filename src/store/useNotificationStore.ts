import { create } from 'zustand';
import { Notification } from '../types';
import { MockDataService } from '../services/mockDataService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: (userId: string) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  refreshNotifications: (userId: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  loadNotifications: (userId: string) => {
    const notifications = MockDataService.getNotifications(userId);
    const unreadCount = MockDataService.getUnreadNotificationCount(userId);
    set({ notifications, unreadCount });
  },

  markAsRead: (notificationId: string) => {
    MockDataService.markNotificationAsRead(notificationId);
    const { notifications } = get();
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    );
    const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
    set({ notifications: updatedNotifications, unreadCount });
  },

  markAllAsRead: (userId: string) => {
    MockDataService.markAllNotificationsAsRead(userId);
    const { notifications } = get();
    const updatedNotifications = notifications.map(notif => ({ ...notif, isRead: true }));
    set({ notifications: updatedNotifications, unreadCount: 0 });
  },

  refreshNotifications: (userId: string) => {
    get().loadNotifications(userId);
  },
}));

