export type NotificationType = 
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'new_message'
  | 'payment_received'
  | 'new_review'
  | 'lesson_reminder'
  | 'lesson_updated'
  | 'new_booking'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  lessonId?: string;
  bookingId?: string;
  actionUrl?: string;
}

