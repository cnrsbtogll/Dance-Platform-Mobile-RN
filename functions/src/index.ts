import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Use dynamic import for ESM module support in CJS compile target
const getExpo = async (): Promise<any> => {
  const { Expo } = await import('expo-server-sdk');
  return new Expo();
};

const isExpoPushToken = async (token: string): Promise<boolean> => {
  const { Expo } = await import('expo-server-sdk');
  return Expo.isExpoPushToken(token);
}

/**
 * Helper to save notification to Firestore and send push notification via Expo
 */
const notifyUsers = async (userIds: string[], title: string, body: string, data: any) => {
    if (!userIds || userIds.length === 0) return 0;
    const uniqueUserIds = [...new Set(userIds)];
    const messages: any[] = [];

    for (const userId of uniqueUserIds) {
        // 1. Save to Firestore
        await db.collection('notifications').add({
            userId,
            title,
            message: body,
            data,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Fetch push tokens to send via Expo
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData && userData.pushTokens && Array.isArray(userData.pushTokens)) {
                for (const pushToken of userData.pushTokens) {
                    if (await isExpoPushToken(pushToken)) {
                        messages.push({
                            to: pushToken,
                            sound: 'default',
                            title,
                            body,
                            data
                        });
                    }
                }
            }
        }
    }

    // 3. Send Push Notifications
    if (messages.length > 0) {
        const expo = await getExpo();
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                await expo.sendPushNotificationsAsync(chunk);
            } catch (error) {
                console.error('Error sending push chunk:', error);
            }
        }
    }

    return uniqueUserIds.length;
};

/**
 * Triggered when a new course announcement is created.
 * Sends a push notification to all students enrolled in the course.
 */
export const onCourseAnnouncementCreated = onDocumentCreated('announcements/{announcementId}', async (event) => {
    const snap = event.data;
    if (!snap) return;
    
    const announcement = snap.data();
    const courseId = announcement.courseId;
    const senderName = announcement.senderName;
    const message = announcement.message;

    if (!courseId || !message) {
      console.error('Missing courseId or message in announcement');
      return null;
    }

    try {
      const courseDoc = await db.collection('courses').doc(courseId).get();
      if (!courseDoc.exists) return null;
      const courseTitle = courseDoc.data()?.title || 'Kurs';

      const bookingsSnapshot = await db.collection('bookings')
        .where('lessonId', '==', courseId)
        .where('status', '==', 'confirmed')
        .get();

      if (bookingsSnapshot.empty) return null;
      const studentIds = bookingsSnapshot.docs.map(doc => doc.data().studentId);

      const title = `📢 ${courseTitle} - Yeni Duyuru (${senderName})`;
      const payload = { 
        courseId: courseId, 
        type: 'announcement',
        url: `danceplatform://course/${courseId}`
      };

      await notifyUsers(studentIds, title, message, payload);

      return { success: true };
    } catch (error) {
      console.error('Error processing announcement notification:', error);
      return null;
    }
  });

/**
 * Triggered when a new booking (registration) is created.
 * Sends a notification to the instructor of the course and the school (if any).
 */
export const onBookingCreated = onDocumentCreated('bookings/{bookingId}', async (event) => {
    const snap = event.data;
    if (!snap) return;

    const booking = snap.data();
    const courseId = booking.lessonId;
    const studentName = booking.studentName;

    if (!courseId) return null;

    try {
      const courseDoc = await db.collection('courses').doc(courseId).get();
      if (!courseDoc.exists) return null;
      
      const courseData = courseDoc.data();
      const instructorId = courseData?.instructorId;
      const schoolId = courseData?.schoolId;
      const courseTitle = courseData?.title || 'Kurs';

      if (!instructorId) return null;

      const userIdsToNotify = [instructorId];
      if (schoolId && schoolId !== instructorId) {
        userIdsToNotify.push(schoolId);
      }

      await notifyUsers(
        userIdsToNotify, 
        'Yeni Kayıt 🎉', 
        `${studentName}, ${courseTitle} kursuna kayıt oldu.`, 
        { courseId: courseId, type: 'new_booking' }
      );

      return { success: true };
    } catch (error) {
      console.error('Error processing new booking notification:', error);
      return null;
    }
  });

/**
 * Triggered when a booking is updated (e.g. cancelled).
 * Sends a notification to the instructor of the course and the school (if any).
 */
export const onBookingUpdated = onDocumentUpdated('bookings/{bookingId}', async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeData = change.before.data();
    const afterData = change.after.data();
    const courseId = afterData.lessonId;
    const studentName = afterData.studentName;

    // Sadece iptal olduğunda bildirim gönder (status went from confirmed/pending to cancelled)
    if (beforeData.status !== 'cancelled' && afterData.status === 'cancelled') {
        if (!courseId) return null;

        try {
          const courseDoc = await db.collection('courses').doc(courseId).get();
          if (!courseDoc.exists) return null;
          
          const courseData = courseDoc.data();
          const instructorId = courseData?.instructorId;
          const schoolId = courseData?.schoolId;
          const courseTitle = courseData?.title || 'Kurs';
    
          if (!instructorId) return null;
    
          const userIdsToNotify = [instructorId];
          if (schoolId && schoolId !== instructorId) {
            userIdsToNotify.push(schoolId);
          }
    
          await notifyUsers(
            userIdsToNotify, 
            'Kayıt İptali ❌', 
            `${studentName}, ${courseTitle} kursundan kaydını iptal etti.`, 
            { courseId: courseId, type: 'booking_cancelled' }
          );
    
          return { success: true };
        } catch (error) {
          console.error('Error processing booking updated notification:', error);
          return null;
        }
    }
    
    return null;
});

/**
 * Triggered when a course is updated (e.g. time change, cancellation).
 * Sends a notification to all confirmed students.
 */
export const onCourseUpdated = onDocumentUpdated('courses/{courseId}', async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeData = change.before.data();
    const afterData = change.after.data();
    const courseId = event.params.courseId;

    const titleChanged = beforeData.title !== afterData.title;
    const dateChanged = beforeData.date !== afterData.date;
    const timeChanged = beforeData.time !== afterData.time;
    const durationChanged = beforeData.duration !== afterData.duration;
    const statusChanged = beforeData.status !== afterData.status;
    const priceChanged = beforeData.price !== afterData.price;
    const scheduleChanged = JSON.stringify(beforeData.schedule) !== JSON.stringify(afterData.schedule);
    const locationChanged = (beforeData.location?.customAddress !== afterData.location?.customAddress) || (beforeData.customAddress !== afterData.customAddress);

    if (!titleChanged && !dateChanged && !timeChanged && !statusChanged && !locationChanged && !priceChanged && !durationChanged && !scheduleChanged) {
        return null;
    }

    let updateMessage = `${afterData.title || 'Kurs'} detaylarında bir güncelleme var.`;
    if (statusChanged && afterData.status === 'cancelled') {
        updateMessage = `❌ ${afterData.title} iptal edilmiştir.`;
    } else if (dateChanged || timeChanged || durationChanged || scheduleChanged) {
        updateMessage = `⏰ ${afterData.title} günü veya saati güncellendi.`;
    } else if (priceChanged) {
        updateMessage = `💰 ${afterData.title} fiyatı güncellendi.`;
    } else if (locationChanged) {
        updateMessage = `📍 ${afterData.title} konumu güncellendi.`;
    }

    try {
       const bookingsSnapshot = await db.collection('bookings')
        .where('lessonId', '==', courseId)
        .where('status', '==', 'confirmed')
        .get();

      if (bookingsSnapshot.empty) return null;
      const studentIds = bookingsSnapshot.docs.map(doc => doc.data().studentId);
      
      await notifyUsers(
          studentIds,
          'Kurs Güncellemesi 🔄',
          updateMessage,
          { courseId: courseId, type: 'course_update' }
      );

      return { success: true };

    } catch (error) {
        console.error('Error processing course update notification:', error);
        return null;
    }
  });

/**
 * Triggered when a new course is created.
 * Sends a notification to all past students of this instructor/school.
 */
export const onCourseCreated = onDocumentCreated('courses/{courseId}', async (event) => {
    const snap = event.data;
    if (!snap) return;

    const courseData = snap.data();
    const courseId = event.params.courseId;
    const instructorId = courseData.instructorId;
    const courseTitle = courseData.title || 'Yeni Kurs';
    const instructorName = courseData.instructorName || courseData.schoolName || 'Eğitmeniniz';

    if (!instructorId) return null;

    try {
      const bookingsSnapshot = await db.collection('bookings')
        .where('instructorId', '==', instructorId)
        .where('status', '==', 'confirmed')
        .get();

      if (bookingsSnapshot.empty) return null;
      const studentIds = bookingsSnapshot.docs.map(doc => doc.data().studentId);
      
      await notifyUsers(
          studentIds,
          'Yeni Kurs Açıldı! 🌟',
          `${instructorName}, "${courseTitle}" adında yepyeni bir kurs açtı. Kontenjan dolmadan hemen incele!`,
          { courseId: courseId, type: 'new_course' }
      );

      return { success: true };

    } catch (error) {
        console.error('Error processing new course notification:', error);
        return null;
    }
  });
