export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  lessonId?: string; // optional
  message: string;
  isRead: boolean;
  createdAt: string;
}

