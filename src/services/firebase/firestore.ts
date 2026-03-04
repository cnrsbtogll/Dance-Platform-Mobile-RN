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
  INSTRUCTOR_REQUESTS: 'instructorRequests',
  SCHOOL_REQUESTS: 'schoolRequests',
  ANNOUNCEMENTS: 'announcements',
  DANCE_STYLES: 'danceStyles',
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
  // Dance Styles (from Firestore collection)
  static async getDanceStyles(): Promise<string[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.DANCE_STYLES));
      if (querySnapshot.empty) return [];
      return querySnapshot.docs
        .map(doc => doc.data().name || doc.data().label || doc.id)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'tr'));
    } catch (error) {
      console.error('[FirestoreService] Error fetching danceStyles:', error);
      return [];
    }
  }

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
          name: data.displayName || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : ''),
          displayName: data.displayName || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : ''),
          email: data.email || '',
          role: data.role || 'student',
          avatar: data.photoURL || data.avatar || null,
          photoURL: data.photoURL || null,
          phoneNumber: data.phoneNumber || null,
          bio: data.bio || '',
          gender: data.gender || undefined,
          age: data.age || undefined,
          height: data.height || undefined,
          weight: data.weight || undefined,
          experience: data.experience || undefined,
          city: data.city || undefined,
          danceStyles: data.danceStyles || [],
          rating: data.rating || undefined,
          schoolName: data.schoolName || undefined,
          instagramHandle: data.instagramHandle || undefined,
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

  static async deleteUser(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Instructor Verifications
  static async createVerificationRequest(data: {
    userId: string;
    firstName: string;
    lastName: string;
    userEmail: string;
    danceStyles: string[];
    experience: string;
    bio: string;
    contactNumber: string;
    phoneNumber?: string;     // Added for redundancy
    idDocumentUrl: string;    // Kimlik / Ehliyet / Pasaport
    certDocumentUrl: string;  // Eğitmen sertifikası
    status: 'pending' | 'approved' | 'rejected';
    schoolId?: string | null; // Okul bağlantısı (okul onay akışı için)
    verificationMethod?: 'school' | 'document'; // Seçilen doğrulama yöntemi
    photoURL?: string | null; // Eğitmenin profil görseli
    createdAt: string;
    updatedAt: string;
  }): Promise<void> {
    try {
      const colRef = collection(db, COLLECTIONS.INSTRUCTOR_REQUESTS);
      await addDoc(colRef, data);
    } catch (error) {
      console.error('Error creating instructor request:', error);
      throw error;
    }
  }

  static async createSchoolRequest(data: {
    userId: string;
    firstName: string;
    lastName: string;
    userEmail: string;
    schoolName: string;
    schoolAddress: string;
    contactNumber: string;
    contactPerson: string;
    instagramHandle?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
  }): Promise<void> {
    try {
      const colRef = collection(db, COLLECTIONS.SCHOOL_REQUESTS);
      await addDoc(colRef, data);
    } catch (error) {
      console.error('Error creating school request:', error);
      throw error;
    }
  }

  static async getInstructorRequestStatus(userId: string): Promise<string | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.INSTRUCTOR_REQUESTS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data().status;
      }
      return null;
    } catch (error) {
      console.error('Error getting instructor request status:', error);
      return null;
    }
  }

  static async getSchoolRequestStatus(userId: string): Promise<string | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SCHOOL_REQUESTS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data().status;
      }
      return null;
    } catch (error) {
      console.error('Error getting school request status:', error);
      return null;
    }
  }

  // Lessons (Courses)
  static async getLessons(): Promise<Lesson[]> {
    try {
      const q = query(collection(db, COLLECTIONS.COURSES), where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
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
          instructorName: data.instructorName || '',
          instructorIds: data.instructorIds || [],
          instructorNames: data.instructorNames || [],
          price: data.price || 0,
          currency: data.currency,
          duration: data.duration || 60,
          time: data.time,
          daysOfWeek: data.daysOfWeek || [],
          imageUrl: data.imageUrl,
          isActive: data.status === 'active',
          status: data.status,
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          favoriteCount: data.favoriteCount || 0,
          createdAt: data.createdAt?.toString(),
        } as Lesson;
      });
    } catch (error) {
      console.error('[FirestoreService] Error getting lessons:', error);
      return [];
    }
  }

  static async getLessonsByInstructor(instructorId: string): Promise<Lesson[]> {
    try {
      // Dual query: legacy single-instructor field + new multi-instructor array
      const [snap1, snap2] = await Promise.all([
        getDocs(query(
          collection(db, COLLECTIONS.COURSES),
          where('instructorId', '==', instructorId)
        )),
        getDocs(query(
          collection(db, COLLECTIONS.COURSES),
          where('instructorIds', 'array-contains', instructorId)
        )),
      ]);

      // Merge, deduplicate by doc ID
      const seen = new Set<string>();
      const allDocs = [...snap1.docs, ...snap2.docs].filter(doc => {
        if (seen.has(doc.id)) return false;
        seen.add(doc.id);
        return true;
      });

      return allDocs.map(doc => {
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
          instructorName: data.instructorName || '',
          instructorIds: data.instructorIds || [],
          instructorNames: data.instructorNames || [],
          price: data.price || 0,
          currency: data.currency,
          duration: data.duration || 60,
          time: data.time,
          daysOfWeek: data.daysOfWeek || [],
          imageUrl: data.imageUrl,
          level: data.level || 'Beginner',
          maxStudents: data.maxStudents || 10,
          isActive: data.status === 'active',
          status: data.status || (data.isActive ? 'active' : 'inactive'),
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          favoriteCount: data.favoriteCount || 0,
          createdAt: data.createdAt?.toString() || new Date().toISOString(),
        } as Lesson;
      });
    } catch (error) {
      console.error('Error fetching instructor lessons:', error);
      return [];
    }
  }

  static async getLessonsBySchool(schoolId: string): Promise<Lesson[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.COURSES), 
        where('schoolId', '==', schoolId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
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
          instructorName: data.instructorName || '',
          instructorIds: data.instructorIds || [],
          instructorNames: data.instructorNames || [],
          price: data.price || 0,
          currency: data.currency,
          duration: data.duration || 60,
          time: data.time,
          daysOfWeek: data.daysOfWeek || [],
          imageUrl: data.imageUrl,
          level: data.level || 'Beginner',
          maxStudents: data.maxStudents || 10,
          isActive: data.status === 'active',
          status: data.status || (data.isActive ? 'active' : 'inactive'),
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          favoriteCount: data.favoriteCount || 0,
          createdAt: data.createdAt?.toString() || new Date().toISOString(),
        } as Lesson;
      });
    } catch (error) {
      console.error('Error fetching school lessons:', error);
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
          ...data,
          id: docSnap.id,
          title: data.name || data.title || '',
          name: data.name || '',
          description: data.description || '',
          category: data.danceStyle || 'Other',
          danceStyle: data.danceStyle || 'Other',
          instructorId: data.instructorId || '',
          instructorName: data.instructorName || '',
          instructorIds: data.instructorIds || [],
          instructorNames: data.instructorNames || [],
          price: data.price || 0,
          currency: data.currency,
          duration: data.duration || 60,
          time: data.time,
          daysOfWeek: data.daysOfWeek || [],
          imageUrl: data.imageUrl,
          isActive: data.status === 'active',
          status: data.status,
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          favoriteCount: data.favoriteCount || 0,
          createdAt: data.createdAt?.toString(),
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
      const dataToWrite = {
        ...lessonData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: lessonData.status ?? 'active',
      };
      const docRef = await addDoc(collection(db, COLLECTIONS.COURSES), dataToWrite);
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

  // Announcements
  static async createCourseAnnouncement(data: {
    courseId: string;
    senderId: string;
    senderName: string;
    message: string;
  }): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.ANNOUNCEMENTS), {
        ...data,
        reactions: { like: 0, heart: 0 },
        userReactions: {},
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  static async getCourseAnnouncements(courseId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ANNOUNCEMENTS),
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertDoc(doc));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }

  static async reactToAnnouncement(announcementId: string, userId: string, reactionType: 'like' | 'heart'): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ANNOUNCEMENTS, announcementId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      const userReactions = data.userReactions || {};
      const currentReaction = userReactions[userId];
      
      const newReactions = { ...data.reactions };
      const newUserReactions = { ...userReactions };

      if (currentReaction === reactionType) {
        // Remove reaction
        newReactions[reactionType] = Math.max(0, (newReactions[reactionType] || 0) - 1);
        delete newUserReactions[userId];
      } else {
        // Change or add reaction
        if (currentReaction) {
          newReactions[currentReaction] = Math.max(0, (newReactions[currentReaction] || 0) - 1);
        }
        newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
        newUserReactions[userId] = reactionType;
      }

      await updateDoc(docRef, {
        reactions: newReactions,
        userReactions: newUserReactions
      });
      
    } catch (error) {
      console.error('Error reacting to announcement:', error);
      throw error;
    }
  }

  // ==========================================
  // NOTIFICATIONS (BİLDİRİMLER)
  // ==========================================

  static async createNotification(data: Omit<Notification, 'id'>): Promise<void> {
    try {
      const colRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      await addDoc(colRef, data);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertDoc(doc));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(docRef, {
        isRead: true,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const querySnapshot = await getDocs(q);
      
      // Batch write to update all notifications at once
      const batch = import('firebase/firestore').then(({ writeBatch }) => {
        const wb = writeBatch(db);
        querySnapshot.docs.forEach((document) => {
          wb.update(document.ref, { 
            isRead: true,
            updatedAt: Timestamp.now(),
          });
        });
        return wb.commit();
      });

      await batch;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // ==========================================
  // INSTRUCTOR VERIFICATION (OKUL/ADMİN ONAYI)
  // ==========================================

  /**
   * Belirli bir okul ID'sine bağlı eğitmen başvurularını getirir.
   * Eğitmen başvuru formunda `schoolId` alanı varsa o okula göre filtreler;
   * yoksa tüm pending başvuruları döner (admin görünümü).
   */
  static async getInstructorRequestsBySchool(schoolId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.INSTRUCTOR_REQUESTS),
        where('schoolId', '==', schoolId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      // Fallback: eğer `schoolId` alanı yoksa pending olanları getir
      console.warn('[FirestoreService] getInstructorRequestsBySchool fallback:', error);
      return [];
    }
  }

  /** Tüm pending eğitmen başvurularını getirir (admin veya onay sayfası için). */
  static async getPendingInstructorRequests(): Promise<any[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.INSTRUCTOR_REQUESTS),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('[FirestoreService] Error fetching pending requests:', error);
      return [];
    }
  }

  /** Eğitmen başvurusunun durumunu günceller ve kullanıcı rolünü senkronize eder. */
  static async updateInstructorRequestStatus(
    requestId: string,
    status: 'approved' | 'rejected',
    userId: string,
    reviewNote?: string,
  ): Promise<void> {
    try {
      const requestRef = doc(db, COLLECTIONS.INSTRUCTOR_REQUESTS, requestId);
      await updateDoc(requestRef, {
        status,
        reviewNote: reviewNote ?? '',
        updatedAt: new Date().toISOString(),
      });

      // Eğer onaylandıysa kullanıcının rolünü 'instructor' yap
      if (status === 'approved') {
        await FirestoreService.updateUser(userId, {
          role: 'instructor',
          verificationStatus: 'verified',
          updatedAt: new Date().toISOString(),
        } as any);
      } else {
        await FirestoreService.updateUser(userId, {
          role: 'student', // Reddedildiğinde veya iptal edildiğinde öğrenciye geri döner
          verificationStatus: 'rejected',
          updatedAt: new Date().toISOString(),
        } as any);
      }
    } catch (error) {
      console.error('[FirestoreService] Error updating instructor request:', error);
      throw error;
    }
  }

  /** Eğitmen kendi başvurusunu iptal eder: isteği siler ve rolü student'a çevirir. */
  static async cancelInstructorRequest(userId: string): Promise<void> {
    try {
      // En son pending isteği bul
      const q = query(
        collection(db, COLLECTIONS.INSTRUCTOR_REQUESTS),
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await deleteDoc(doc(db, COLLECTIONS.INSTRUCTOR_REQUESTS, snap.docs[0].id));
      }

      // Kullanıcıyı student'a döndür
      await FirestoreService.updateUser(userId, {
        role: 'student',
        verificationStatus: 'idle',
        schoolId: null,
        verificationMethod: null,
        updatedAt: new Date().toISOString(),
      } as any);
    } catch (error) {
      console.error('[FirestoreService] Error cancelling instructor request:', error);
      throw error;
    }
  }

  /**
   * Bir kursa kayıtlı öğrencilerin user dokümanlarını getirir.
   * Lesson'daki booking kayıtlarından studentId'leri toplayarak kullanır.
   */
  static async getStudentsByInstructor(instructorId: string): Promise<User[]> {
    try {
      const bookingsSnap = await getDocs(
        query(
          collection(db, COLLECTIONS.BOOKINGS),
          where('instructorId', '==', instructorId),
          where('status', '!=', 'cancelled'),
        )
      );

      const studentIds = [...new Set(
        bookingsSnap.docs.map(d => d.data().studentId as string).filter(Boolean)
      )];

      if (studentIds.length === 0) return [];

      const users = await Promise.all(
        studentIds.map(id => FirestoreService.getUserById(id))
      );
      return users.filter(Boolean) as User[];
    } catch (error) {
      console.error('[FirestoreService] Error fetching students by instructor:', error);
      return [];
    }
  }

  static async getStudentsBySchool(schoolId: string): Promise<User[]> {
    try {
      const bookingsSnap = await getDocs(
        query(
          collection(db, COLLECTIONS.BOOKINGS),
          where('schoolId', '==', schoolId),
          where('status', '!=', 'cancelled'),
        )
      );

      const studentIds = [...new Set(
        bookingsSnap.docs.map(d => d.data().studentId as string).filter(Boolean)
      )];

      if (studentIds.length === 0) return [];

      const users = await Promise.all(
        studentIds.map(id => FirestoreService.getUserById(id))
      );
      return users.filter(Boolean) as User[];
    } catch (error) {
      console.error('[FirestoreService] Error fetching students by school:', error);
      return [];
    }
  }

  static async getApprovedSchools(): Promise<DanceSchool[]> {
    try {
      // Okullar doğrudan "schools" (DANCE_SCHOOLS) koleksiyonundan çekiliyor
      const snap = await getDocs(collection(db, COLLECTIONS.DANCE_SCHOOLS));

      const schools = snap.docs
        .map(d => {
          const data = d.data();
          const isActive = data.status === 'active' || data.isActive === true;
          
          const schoolData = {
            id: d.id, // School collection ID is the definitive schoolId
            userId: data.userId || data.ownerId || d.id, // Bildirim atabilmek için owner ID'si gerekiyor (eğer okul belgesinde tutuluyorsa)
            name: data.displayName || data.name || data.ad || '',
            address: data.address || data.adres || '',
            city: data.city || data.konum || data.sehir || '',
            country: data.country || data.ulke || '',
            phone: data.phoneNumber || data.phone || data.telefon || '',
            email: data.email || data.iletisim || '',
            website: data.website || '',
            description: data.description || data.aciklama || '',
            imageUrl: data.photoURL || data.imageUrl || data.gorsel || '',
            isActive,
            createdAt: data.createdAt?.toString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toString(),
            danceStyles: data.danceStyles || [],
          } as any;
          
          console.log(`[getApprovedSchools Debug] Gelen Data (${COLLECTIONS.DANCE_SCHOOLS}):`, {
            id: schoolData.id,
            name: schoolData.name,
            imageUrl: schoolData.imageUrl,
            isActive: schoolData.isActive
          });

          return schoolData;
        })
        .filter(school => school.isActive); // Sadece aktif (onaylı) okulları göster
        
      console.log(`[getApprovedSchools] Toplam çekilen okul sayısı: ${schools.length}`);
      return schools;
    } catch (error) {
      console.error('[FirestoreService] Error fetching approved schools:', error);
      return [];
    }
  }
}
