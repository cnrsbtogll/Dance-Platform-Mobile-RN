export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  lessonId?: string; // optional
  message: string;
  isRead: boolean;
  createdAt: string; // ISO string
}

export interface Conversation {
  id: string; // Typically generated as participant1Id_participant2Id
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  lastMessageSenderId: string;
  unreadCount: Record<string, number>; // Maps userId to their unread count
  deletedBy?: string[]; // Users who deleted/hid this conversation
  createdAt: string;
  updatedAt: string;
}
