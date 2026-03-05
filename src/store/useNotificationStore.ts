import { create } from 'zustand';
import { Notification } from '../types';
import { FirestoreService } from '../services/firebase/firestore';

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
    if (userId) {
      // Async fetch inside synchronous zustand action
      FirestoreService.getUserNotifications(userId).then(notifications => {
        FirestoreService.getUnreadNotificationCount(userId).then(unreadCount => {
          set({ notifications, unreadCount });
        });
      }).catch(err => {
        console.error('Error loading notifications:', err);
      });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await FirestoreService.markNotificationAsRead(notificationId);
      const { notifications } = get();
      const updatedNotifications = notifications.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      );
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
      set({ notifications: updatedNotifications, unreadCount });
    } catch (error) {
       console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      await FirestoreService.markAllNotificationsAsRead(userId);
      const { notifications } = get();
      const updatedNotifications = notifications.map(notif => ({ ...notif, isRead: true }));
      set({ notifications: updatedNotifications, unreadCount: 0 });
    } catch (error) {
       console.error('Error marking all notifications as read:', error);
    }
  },

  refreshNotifications: (userId: string) => {
    get().loadNotifications(userId);
  },
}));

