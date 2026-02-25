import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// Use dynamic import for ESM module support in CJS compile target
const getExpo = async (): Promise<any> => {
  const { Expo } = await import('expo-server-sdk');
  return new Expo();
};

const isExpoPushToken = async (token: string): Promise<boolean> => {
  const { Expo } = await import('expo-server-sdk');
  return Expo.isExpoPushToken(token);
}

admin.initializeApp();
const db = admin.firestore();

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
      // 1. Get the course details to get the course title
      const courseDoc = await db.collection('lessons').doc(courseId).get();
      if (!courseDoc.exists) {
         console.error(`Course ${courseId} not found`);
         return null;
      }
      const courseTitle = courseDoc.data()?.title || 'Kurs';

      // 2. Find all confirmed bookings for this course to get the student IDs
      const bookingsSnapshot = await db.collection('bookings')
        .where('lessonId', '==', courseId)
        .where('status', '==', 'confirmed')
        .get();

      if (bookingsSnapshot.empty) {
        console.log(`No confirmed students found for course ${courseId}`);
        return null;
      }

      const studentIds = bookingsSnapshot.docs.map(doc => doc.data().studentId);

      // 3. Fetch the push tokens for these students
      const fetchTokens = async (userIds: string[]) => {
          const userRefs = userIds.map(id => db.collection('users').doc(id));
          if (userRefs.length === 0) return [];
          
          const userDocs = await db.getAll(...userRefs);
          const userTokens: string[] = [];
          userDocs.forEach(doc => {
              if (doc.exists) {
                  const data = doc.data();
                  if (data && data.pushTokens && Array.isArray(data.pushTokens)) {
                      userTokens.push(...data.pushTokens);
                  }
              }
          });
          return userTokens;
      };

      const pushTokens = await fetchTokens(studentIds);

      if (pushTokens.length === 0) {
        console.log('No valid push tokens found for the students.');
        return null;
      }

      // 4. Construct the messages
      const messages: any[] = [];
      for (const pushToken of pushTokens) {
        if (!(await isExpoPushToken(pushToken))) {
          console.error(`Push token ${pushToken} is not a valid Expo push token`);
          continue;
        }

        messages.push({
          to: pushToken,
          sound: 'default',
          title: `📢 ${courseTitle} - Yeni Duyuru (${senderName})`,
          body: message,
          data: { 
            courseId: courseId, 
            type: 'announcement',
            url: `danceplatform://course/${courseId}` // Deep link URL
          },
        });
      }

      // 5. Send the notifications in chunks
      const expo = await getExpo();
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];
      
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log('Sent chunk:', ticketChunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      return { success: true, messagesSent: messages.length };

    } catch (error) {
      console.error('Error processing announcement notification:', error);
      return null;
    }
  });

/**
 * Triggered when a new booking (registration) is created.
 * Sends a notification to the instructor of the course.
 */
export const onBookingCreated = onDocumentCreated('bookings/{bookingId}', async (event) => {
    const snap = event.data;
    if (!snap) return;

    const booking = snap.data();
    const courseId = booking.lessonId;
    const studentName = booking.studentName;

    if (!courseId) return null;

    try {
      // 1. Get Course to find the instructorId
      const courseDoc = await db.collection('lessons').doc(courseId).get();
      if (!courseDoc.exists) return null;
      
      const courseData = courseDoc.data();
      const instructorId = courseData?.instructorId;
      const courseTitle = courseData?.title || 'Kurs';

      if (!instructorId) return null;

      // 2. Get Instructor's push tokens
      const instructorDoc = await db.collection('users').doc(instructorId).get();
      if (!instructorDoc.exists) return null;

      const instructorData = instructorDoc.data();
      const pushTokens = instructorData?.pushTokens || [];

      if (!pushTokens || pushTokens.length === 0) return null;

      // 3. Construct and send message
      const messages: any[] = [];
      for (const pushToken of pushTokens) {
        if (!(await isExpoPushToken(pushToken))) continue;

        messages.push({
          to: pushToken,
          sound: 'default',
          title: 'Yeni Kayıt 🎉',
          body: `${studentName}, ${courseTitle} kursunuza kayıt oldu.`,
          data: { courseId: courseId, type: 'new_booking' },
        });
      }

      const expo = await getExpo();
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
         await expo.sendPushNotificationsAsync(chunk);
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing new booking notification:', error);
      return null;
    }
  });

/**
 * Triggered when a course is updated (e.g. time change, cancellation).
 * Sends a notification to all confirmed students.
 */
export const onCourseUpdated = onDocumentUpdated('lessons/{courseId}', async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeData = change.before.data();
    const afterData = change.after.data();
    const courseId = event.params.courseId;

    // Determine what changed to avoid spamming.
    // E.g., only notify if date, time, status, or location changed.
    const titleChanged = beforeData.title !== afterData.title;
    const dateChanged = beforeData.date !== afterData.date;
    const timeChanged = beforeData.startTime !== afterData.startTime;
    const statusChanged = beforeData.status !== afterData.status;
    const locationChanged = beforeData.location?.customAddress !== afterData.location?.customAddress;

    if (!titleChanged && !dateChanged && !timeChanged && !statusChanged && !locationChanged) {
        // No significant change to notify students about
        return null;
    }

    let updateMessage = `${afterData.title || 'Kurs'} hakkında bir güncelleme var.`;
    if (statusChanged && afterData.status === 'cancelled') {
        updateMessage = `❌ ${afterData.title} iptal edilmiştir.`;
    } else if (dateChanged || timeChanged) {
        updateMessage = `⏰ ${afterData.title} saati/tarihi güncellendi.`;
    }

    try {
       // Find all confirmed bookings
       const bookingsSnapshot = await db.collection('bookings')
        .where('lessonId', '==', courseId)
        .where('status', '==', 'confirmed')
        .get();

      if (bookingsSnapshot.empty) return null;

      const studentIds = bookingsSnapshot.docs.map(doc => doc.data().studentId);
      
      const fetchTokens = async (userIds: string[]) => {
          const userRefs = userIds.map(id => db.collection('users').doc(id));
          if (userRefs.length === 0) return [];
          const userDocs = await db.getAll(...userRefs);
          const userTokens: string[] = [];
          userDocs.forEach(doc => {
              if (doc.exists) {
                  const data = doc.data();
                  if (data && data.pushTokens && Array.isArray(data.pushTokens)) {
                      userTokens.push(...data.pushTokens);
                  }
              }
          });
          return userTokens;
      };

      const pushTokens = await fetchTokens(studentIds);

      if (pushTokens.length === 0) return null;

      const messages: any[] = [];
      for (const pushToken of pushTokens) {
        if (!(await isExpoPushToken(pushToken))) continue;

        messages.push({
          to: pushToken,
          sound: 'default',
          title: 'Kurs Güncellemesi 🔄',
          body: updateMessage,
          data: { courseId: courseId, type: 'course_update' },
        });
      }

      const expo = await getExpo();
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
         await expo.sendPushNotificationsAsync(chunk);
      }

      return { success: true };

    } catch (error) {
        console.error('Error processing course update notification:', error);
        return null;
    }
  });
