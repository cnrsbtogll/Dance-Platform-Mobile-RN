import { User, Lesson, Review, Booking, Message, Notification } from '../types';
import usersData from '../data/users.json';
import lessonsData from '../data/lessons.json';
import reviewsData from '../data/reviews.json';
import bookingsData from '../data/bookings.json';
import messagesData from '../data/messages.json';
import notificationsData from '../data/notifications.json';

// Type assertions
const users = usersData as User[];
const lessons = lessonsData as Lesson[];
const reviews = reviewsData as Review[];
const bookings = bookingsData as Booking[];
const messages = messagesData as Message[];
const notifications = notificationsData as Notification[];

export class MockDataService {
  // Users
  static getUsers(): User[] {
    return users;
  }

  static getUserById(id: string): User | undefined {
    return users.find(user => user.id === id);
  }

  static getUsersByRole(role: 'student' | 'instructor'): User[] {
    return users.filter(user => user.role === role);
  }

  // Lessons
  static getLessons(): Lesson[] {
    return lessons;
  }

  static getLessonById(id: string): Lesson | undefined {
    return lessons.find(lesson => lesson.id === id);
  }

  static getLessonsByInstructor(instructorId: string): Lesson[] {
    return lessons.filter(lesson => lesson.instructorId === instructorId);
  }

  static getLessonsByCategory(category: string): Lesson[] {
    return lessons.filter(lesson => lesson.category === category);
  }

  static getActiveLessons(): Lesson[] {
    return lessons.filter(lesson => lesson.isActive);
  }

  static searchLessons(query: string): Lesson[] {
    const lowerQuery = query.toLowerCase();
    return lessons.filter(lesson => 
      lesson.title.toLowerCase().includes(lowerQuery) ||
      lesson.description.toLowerCase().includes(lowerQuery) ||
      lesson.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Reviews
  static getReviews(): Review[] {
    return reviews;
  }

  static getReviewsByLesson(lessonId: string): Review[] {
    return reviews.filter(review => review.lessonId === lessonId);
  }

  static getReviewsByStudent(studentId: string): Review[] {
    return reviews.filter(review => review.studentId === studentId);
  }

  // Bookings
  static getBookings(): Booking[] {
    return bookings;
  }

  static getBookingById(id: string): Booking | undefined {
    return bookings.find(booking => booking.id === id);
  }

  static getBookingsByStudent(studentId: string): Booking[] {
    return bookings.filter(booking => booking.studentId === studentId);
  }

  static getBookingsByInstructor(instructorId: string): Booking[] {
    return bookings.filter(booking => booking.instructorId === instructorId);
  }

  static getBookingsByLesson(lessonId: string): Booking[] {
    return bookings.filter(booking => booking.lessonId === lessonId);
  }

  static getBookingsByStatus(status: string): Booking[] {
    return bookings.filter(booking => booking.status === status);
  }

  // Messages
  static getMessages(): Message[] {
    return messages;
  }

  static getMessagesByUser(userId: string): Message[] {
    return messages.filter(
      message => message.senderId === userId || message.receiverId === userId
    );
  }

  static getConversation(userId1: string, userId2: string): Message[] {
    return messages.filter(
      message =>
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
    ).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  static getUnreadMessages(userId: string): Message[] {
    return messages.filter(
      message => message.receiverId === userId && !message.isRead
    );
  }

  // Notifications
  static getNotifications(userId: string): Notification[] {
    return notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getUnreadNotificationCount(userId: string): number {
    return notifications.filter(
      notification => notification.userId === userId && !notification.isRead
    ).length;
  }

  static markNotificationAsRead(notificationId: string): void {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  static markAllNotificationsAsRead(userId: string): void {
    notifications
      .filter(notification => notification.userId === userId && !notification.isRead)
      .forEach(notification => {
        notification.isRead = true;
      });
  }

  // Helper methods
  static getInstructorForLesson(lessonId: string): User | undefined {
    const lesson = this.getLessonById(lessonId);
    if (!lesson) return undefined;
    return this.getUserById(lesson.instructorId);
  }

  static getStudentsForLesson(lessonId: string): User[] {
    const lessonBookings = bookings.filter(b => b.lessonId === lessonId);
    const studentIds = lessonBookings.map(b => b.studentId);
    return users.filter(user => studentIds.includes(user.id));
  }

  static getAverageRating(lessonId: string): number {
    const lessonReviews = this.getReviewsByLesson(lessonId);
    if (lessonReviews.length === 0) return 0;
    const sum = lessonReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / lessonReviews.length;
  }
}

