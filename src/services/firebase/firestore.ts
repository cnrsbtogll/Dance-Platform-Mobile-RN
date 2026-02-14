import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from './config';
import { User, Lesson, Instructor, Booking, Review, Message, Notification } from '../../types';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  COURSES: 'courses', // Mapped to lessons
  INSTRUCTORS: 'instructors',
  ATTENDANCE: 'attendance',
  TICKETS: 'tickets',
  MESSAGES: 'messages',
  REVIEWS: 'reviews', // Not verified if exists yet
  NOTIFICATIONS: 'notifications' // Not verified if exists yet
};

// Helper to convert Firestore doc to typed object
const convertDoc = <T>(doc: any): T => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    // Convert timestamps to ISO strings if needed
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    date: data.date?.toDate?.()?.toISOString() || data.date,
  } as T;
};

export class FirestoreService {
  // Users
  static async getUserById(id: string): Promise<User | null> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.displayName || '',
          displayName: data.displayName || '',
          email: data.email || '',
          role: data.role || 'student',
          avatar: data.photoURL,
          photoURL: data.photoURL,
          phoneNumber: data.phoneNumber,
          createdAt: data.createdAt?.toString() || new Date().toISOString(),
          ...data
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  static async createUser(id: string, data: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, id);
      await setDoc(docRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(id: string, data: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, id);
      await updateDoc(docRef, data as DocumentData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Lessons (Courses)
  static async getLessons(): Promise<Lesson[]> {
    try {
      const q = query(collection(db, COLLECTIONS.COURSES), where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      
      const lessons = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          // Spread data first
          ...data,
          // Then override with required fields to ensure consistency
          id: doc.id, // IMPORTANT: Document ID must be the source of truth
          title: data.name || data.title || '',
          name: data.name || '',
          description: data.description || '',
          category: data.danceStyle || 'Other',
          danceStyle: data.danceStyle || 'Other',
          instructorId: data.instructorId || '',
          price: data.price || 0,
          currency: data.currency,
          duration: data.duration || 60,
          imageUrl: data.imageUrl,
          // Map other fields
          isActive: data.status === 'active',
          status: data.status,
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          favoriteCount: data.favoriteCount || 0,
          createdAt: data.createdAt?.toString(),
        } as Lesson;
      });
      
      return lessons;
    } catch (error) {
      console.error('[FirestoreService] Error getting lessons:', error);
      return [];
    }
  }

  static async getLessonsByInstructor(instructorId: string): Promise<Lesson[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.COURSES), 
        where('instructorId', '==', instructorId)
      );
      const querySnapshot = await getDocs(q);
      
      const lessons = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          title: data.name || data.title || '',
          name: data.name || '',
          description: data.description || '',
          category: data.danceStyle || 'Other',
          danceStyle: data.danceStyle || 'Other',
          instructorId: data.instructorId || '',
          price: data.price || 0,
          currency: data.currency,
          duration: data.duration || 60,
          imageUrl: data.imageUrl,
          level: data.level || 'Beginner',
          maxStudents: data.maxStudents || 10,
          schedule: data.schedule || [],
          location: data.location || '',
          isActive: data.status === 'active',
          rating: data.rating || 0,
          totalReviews: data.totalReviews || 0,
          reviewCount: data.reviewCount || 0,
          favoriteCount: data.favoriteCount || 0,
          createdAt: data.createdAt?.toString() || new Date().toISOString(),
        } as Lesson;
      });
      
      return lessons;
    } catch (error) {
      console.error('Error fetching instructor lessons:', error);
      return [];
    }
  }

  static async getLessonById(id: string): Promise<Lesson | null> {
    try {
      const docRef = doc(db, COLLECTIONS.COURSES, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.name || '',
          name: data.name || '',
          description: data.description || '',
          category: data.danceStyle || 'Other',
          danceStyle: data.danceStyle || 'Other',
          instructorId: data.instructorId || '',
          price: data.price || 0,
          currency: data.currency,
          duration: data.duration || 60,
          imageUrl: data.imageUrl,
          isActive: data.status === 'active',
          status: data.status,
          rating: 0,
          reviewCount: 0,
          favoriteCount: 0,
          createdAt: data.createdAt?.toString(),
          ...data
        } as Lesson;
      }
      return null;
    } catch (error) {
      console.error('Error getting lesson:', error);
      return null;
    }
  }

  // Instructors
  static async getInstructors(): Promise<Instructor[]> {
    try {
      const q = query(collection(db, COLLECTIONS.INSTRUCTORS));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertDoc<Instructor>(doc));
    } catch (error) {
      console.error('Error getting instructors:', error);
      return [];
    }
  }

  static async getInstructorById(id: string): Promise<Instructor | null> {
    try {
      const docRef = doc(db, COLLECTIONS.INSTRUCTORS, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return convertDoc<Instructor>(docSnap);
      }
      return null;
    } catch (error) {
      console.error('Error getting instructor:', error);
      return null;
    }
  }
}
