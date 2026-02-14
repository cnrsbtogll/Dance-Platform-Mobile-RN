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
import { User, Lesson, Instructor, Booking, Review, Message, Notification, DanceSchool } from '../../types';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  COURSES: 'courses', // Mapped to lessons
  INSTRUCTORS: 'instructors',
  ATTENDANCE: 'attendance',
  TICKETS: 'tickets',
  MESSAGES: 'messages',
  REVIEWS: 'reviews', // Not verified if exists yet
  NOTIFICATIONS: 'notifications', // Not verified if exists yet
  DANCE_SCHOOLS: 'schools',
  BOOKINGS: 'bookings',
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
          ...data,
          id: docSnap.id,
          name: data.displayName || '',
          displayName: data.displayName || '',
          email: data.email || '',
          role: data.role || 'student',
          avatar: data.photoURL,
          photoURL: data.photoURL,
          phoneNumber: data.phoneNumber,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt?.toString() || new Date().toISOString(),
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
          time: data.time,
          daysOfWeek: data.daysOfWeek || [],
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
          time: data.time,
          daysOfWeek: data.daysOfWeek || [],
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
          time: data.time,
          daysOfWeek: data.daysOfWeek || [],
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

  static async createLesson(lessonData: Partial<Lesson>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.COURSES), {
        ...lessonData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  }

  static async updateLesson(id: string, data: Partial<Lesson>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.COURSES, id);
      
      // Prepare update data
      const updateData: any = { ...data };
      
      // Map isActive back to status for Firestore storage
      if (data.isActive !== undefined) {
        updateData.status = data.isActive ? 'active' : 'inactive';
        // Remove derived field so it's not saved to Firestore
        delete updateData.isActive;
      }
      
      updateData.updatedAt = new Date().toISOString();
      
      await updateDoc(docRef, updateData as DocumentData);
    } catch (error) {
      console.error('[FirestoreService] Error updating lesson:', error);
      throw error;
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

  // Dance Schools
  static async getDanceSchools(): Promise<DanceSchool[]> {
    try {
      // Order by displayName since 'name' field might not exist
      const q = query(
        collection(db, COLLECTIONS.DANCE_SCHOOLS),
        orderBy('displayName', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.displayName || data.name || data.ad || '',
          address: data.address || data.adres || '',
          city: data.city || data.konum || data.sehir || '',
          country: data.country || data.ulke || '',
          phone: data.phoneNumber || data.phone || data.telefon || '',
          email: data.email || data.iletisim || '',
          website: data.website || '',
          description: data.description || data.aciklama || '',
          imageUrl: data.photoURL || data.imageUrl || data.gorsel || '',
          isActive: data.status === 'active' || data.isActive === true,
          createdAt: data.createdAt?.toString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toString(),
        } as DanceSchool;
      });
    } catch (error) {
      console.error('Error getting dance schools:', error);
      return [];
    }
  }

  static async getDanceSchoolById(id: string): Promise<DanceSchool | null> {
    try {
      const docRef = doc(db, COLLECTIONS.DANCE_SCHOOLS, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.displayName || data.name || data.ad || '',
          address: data.address || data.adres || '',
          city: data.city || data.konum || data.sehir || '',
          country: data.country || data.ulke || '',
          phone: data.phoneNumber || data.phone || data.telefon || '',
          email: data.email || data.iletisim || '',
          website: data.website || '',
          description: data.description || data.aciklama || '',
          imageUrl: data.photoURL || data.imageUrl || data.gorsel || '',
          isActive: data.status === 'active' || data.isActive === true,
          createdAt: data.createdAt?.toString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toString(),
        } as DanceSchool;
      }
      return null;
    } catch (error) {
      console.error('Error getting dance school:', error);
      return null;
    }

  }

  // Bookings
  static async createBooking(bookingData: Partial<Booking>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.BOOKINGS), {
        ...bookingData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: bookingData.status || 'pending'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  static async getBookingById(bookingId: string): Promise<Booking | null> {
    try {
      const docRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return convertDoc<Booking>(docSnap);
      }
      return null;
    } catch (error) {
       console.error('Error getting booking by id:', error);
       return null;
    }
  }

  static async getUserBookingForLesson(userId: string, lessonId: string): Promise<Booking | null> {
      try {
          const q = query(
              collection(db, COLLECTIONS.BOOKINGS),
              where('studentId', '==', userId),
              where('lessonId', '==', lessonId),
              limit(1)
          );
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) return null;
          return convertDoc<Booking>(querySnapshot.docs[0]);
      } catch (error) {
          console.error('Error checking user booking:', error);
          return null;
      }
  }

  static async getBookingsByStudent(studentId: string): Promise<Booking[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertDoc<Booking>(doc));
    } catch (error) {
      console.error('Error getting student bookings:', error);
      return [];
    }
  }

  static async getBookingsByInstructor(instructorId: string): Promise<Booking[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('instructorId', '==', instructorId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertDoc<Booking>(doc));
    } catch (error) {
      console.error('Error getting instructor bookings:', error);
      return [];
    }
  }

  static async getBookingsByLesson(lessonId: string): Promise<Booking[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('lessonId', '==', lessonId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertDoc<Booking>(doc));
    } catch (error) {
      console.error('Error getting lesson bookings:', error);
      return [];
    }
  }

  static async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      await updateDoc(docRef, { 
        status, 
        updatedAt: new Date().toISOString() 
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }
}
