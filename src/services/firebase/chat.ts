import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  setDoc, 
  serverTimestamp, 
  getDoc,
  writeBatch,
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './config';
import { Conversation, Message } from '../../types/message';
import { FirestoreService } from './firestore';
import { User } from '../../types/user';

// Helper to get consistent conversation ID for two users
export const getConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

export const chatService = {
  // Subscribe to user's conversations
  subscribeToConversations: (userId: string, callback: (conversations: (Conversation & { partner?: User })[]) => void) => {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      
      // Filter out conversations deleted by this user
      const visibleConvos = convos.filter(c => !(c.deletedBy || []).includes(userId));

      // Fetch partner details
      const populatedConvos = await Promise.all(
        visibleConvos.map(async (convo) => {
          const partnerId = convo.participants.find(p => p !== userId);
          if (partnerId) {
            try {
              const partner = await FirestoreService.getUserById(partnerId);
              return { ...convo, partner: partner as User };
            } catch (e) {
              console.warn('Could not fetch partner for chat', partnerId);
              return convo as Conversation & { partner?: User };
            }
          }
          return convo as Conversation & { partner?: User };
        })
      );
      
      callback(populatedConvos);
    });
  },

  // Subscribe to messages in a specific conversation
  subscribeToMessages: (conversationId: string, callback: (messages: Message[]) => void) => {
    const q = query(
      collection(db, `conversations/${conversationId}/messages`),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Message));
      callback(msgs);
    });
  },

  // Send a message
  sendMessage: async (senderId: string, receiverId: string, messageText: string) => {
    const conversationId = getConversationId(senderId, receiverId);
    const convoRef = doc(db, 'conversations', conversationId);
    
    // Check if conversation exists
    const convoSnap = await getDoc(convoRef);
    const now = new Date().toISOString();
    
    const batch = writeBatch(db);

    if (!convoSnap.exists()) {
      // Create new conversation
      const newConvo: Conversation = {
        id: conversationId,
        participants: [senderId, receiverId],
        lastMessage: messageText,
        lastMessageAt: now,
        lastMessageSenderId: senderId,
        unreadCount: {
          [receiverId]: 1,
          [senderId]: 0,
        },
        deletedBy: [],
        createdAt: now,
        updatedAt: now,
      };
      batch.set(convoRef, newConvo);
    } else {
      // Update existing conversation
      const data = convoSnap.data() as Conversation;
      const currentUnread = data.unreadCount?.[receiverId] || 0;
      
      // If receiver had deleted it, reinstate it
      const newDeletedBy = (data.deletedBy || []).filter(id => id !== receiverId);

      batch.update(convoRef, {
        lastMessage: messageText,
        lastMessageAt: now,
        lastMessageSenderId: senderId,
        [`unreadCount.${receiverId}`]: currentUnread + 1,
        deletedBy: newDeletedBy,
        updatedAt: now,
      });
    }

    // Add message doc
    const msgRef = doc(collection(db, `conversations/${conversationId}/messages`));
    const newMessage: Message = {
      id: msgRef.id,
      senderId,
      receiverId,
      message: messageText,
      isRead: false,
      createdAt: now,
    };
    batch.set(msgRef, newMessage);

    await batch.commit();
    return newMessage;
  },

  // Mark all messages as read for a specific conversation
  markAsRead: async (conversationId: string, userId: string) => {
    const convoRef = doc(db, 'conversations', conversationId);
    await updateDoc(convoRef, {
      [`unreadCount.${userId}`]: 0
    });
    
    // Optional: Mark individual messages as read (might be heavy for many msgs)
    const messagesQuery = query(
      collection(db, `conversations/${conversationId}/messages`),
      where('receiverId', '==', userId),
      where('isRead', '==', false)
    );
    
    const unreadSnap = await getDocs(messagesQuery);
    if (!unreadSnap.empty) {
      const batch = writeBatch(db);
      unreadSnap.forEach((docSnap) => {
        batch.update(docSnap.ref, { isRead: true });
      });
      await batch.commit();
    }
  },

  // Delete/hide string
  deleteConversation: async (conversationId: string, userId: string) => {
    const convoRef = doc(db, 'conversations', conversationId);
    await updateDoc(convoRef, {
      deletedBy: arrayUnion(userId)
    });
  }
};
