import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

admin.initializeApp();
const db = admin.firestore();

// ─── MinIO config (values resolved at runtime from Secret Manager) ────────
// S3Client is created lazily inside each function to ensure secrets are loaded
const getS3Client = () => new S3Client({
  endpoint: `https://${process.env.MINIO_ENDPOINT || 'minio-sdk.cnrsbtogll.store'}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.MINIO_SECRET_KEY || '',
  },
  forcePathStyle: true,
  // Disable AWS SDK v3 automatic checksum (not supported by MinIO)
  requestChecksumCalculation: 'WHEN_REQUIRED' as any,
  responseChecksumValidation: 'WHEN_REQUIRED' as any,
});

const getBucket = () => process.env.MINIO_BUCKET || 'feriha-danceapp';
const getMinioPublicBase = () =>
  `https://${process.env.MINIO_ENDPOINT || 'minio-sdk.cnrsbtogll.store'}/${getBucket()}`;


// ─── CORS helper ─────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

/**
 * Generates a presigned PUT URL for direct client→MinIO upload.
 * Body: { path: 'public/avatars/userId/avatar.jpg', contentType: 'image/jpeg' }
 * Returns: { uploadUrl, publicUrl } for public paths, or { uploadUrl } for private paths.
 */
export const generateUploadUrl = onRequest(
  {
    cors: true,
    secrets: ['MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_ENDPOINT', 'MINIO_BUCKET'],
  },
  async (req, res) => {
    // Handle preflight
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
      // Verify Firebase Auth token
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      const uid = decoded.uid;

      const { path, contentType } = req.body as { path?: string; contentType?: string };

      if (!path || !contentType) {
        res.status(400).json({ error: 'path and contentType are required' });
        return;
      }

      // Security: ensure user can only upload to their own paths
      const isPublic = path.startsWith('public/');
      const isPrivate = path.startsWith('private/');

      if (!isPublic && !isPrivate) {
        res.status(400).json({ error: 'Path must start with public/ or private/' });
        return;
      }

      // Validate the path contains the user's UID (prevent overwriting others' files)
      if (!path.includes(uid)) {
        res.status(403).json({ error: 'Cannot upload to another user\'s path' });
        return;
      }

      // Validate content type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(contentType)) {
        res.status(400).json({ error: `Content type ${contentType} not allowed` });
        return;
      }

      const command = new PutObjectCommand({
        Bucket: getBucket(),
        Key: path,
      });

      const uploadUrl = await getSignedUrl(getS3Client(), command, {
        expiresIn: 900,
        unsignableHeaders: new Set(['content-type', 'x-amz-checksum-algorithm']),
        unhoistableHeaders: new Set(['content-type', 'x-amz-checksum-algorithm']),
      });

      const result: Record<string, string> = { uploadUrl };
      if (isPublic) {
        result.publicUrl = `${getMinioPublicBase()}/${path}`;
      }

      res.status(200).json(result);
    } catch (err: any) {
      console.error('[generateUploadUrl] Error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);

/**
 * Generates a presigned GET URL for private file access.
 * Body: { path: 'private/instructor-docs/userId/verification.pdf' }
 * Returns: { downloadUrl } with 1h expiry.
 */
export const generateDownloadUrl = onRequest(
  {
    cors: true,
    secrets: ['MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_ENDPOINT', 'MINIO_BUCKET'],
  },
  async (req, res) => {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);

      // Only admins or the file owner can get download URLs
      const uid = decoded.uid;
      const userDoc = await db.collection('users').doc(uid).get();
      const userRole = userDoc.data()?.role || '';

      const { path } = req.body as { path?: string };

      if (!path) {
        res.status(400).json({ error: 'path is required' });
        return;
      }

      if (!path.startsWith('private/')) {
        res.status(400).json({ error: 'Path must start with private/' });
        return;
      }

      // Only the file owner or admin can access
      const isOwner = path.includes(uid);
      const isAdmin = userRole === 'admin';
      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const command = new GetObjectCommand({ Bucket: getBucket(), Key: path });
      const downloadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });

      res.status(200).json({ downloadUrl });
    } catch (err: any) {
      console.error('[generateDownloadUrl] Error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);


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

    const courseTitle = afterData.title || afterData.name || 'Kurs';
    let updateMessage = `${courseTitle} kurs detaylarında bir güncelleme var.`;
    if (statusChanged && afterData.status === 'cancelled') {
        updateMessage = `❌ ${courseTitle} kursu iptal edilmiştir.`;
    } else if (dateChanged || timeChanged || durationChanged || scheduleChanged) {
        updateMessage = `⏰ ${courseTitle} kursunun günü veya saati güncellendi.`;
    } else if (priceChanged) {
        updateMessage = `💰 ${courseTitle} kursunun fiyatı güncellendi.`;
    } else if (locationChanged) {
        updateMessage = `📍 ${courseTitle} kursunun konumu güncellendi.`;
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
      
      const isIndependentInstructor = !courseData.schoolId;
      const notificationBody = isIndependentInstructor 
          ? `${instructorName} tarafından yeni kurs yayınlandı.`
          : `${instructorName}, "${courseTitle}" adında yepyeni bir kurs açtı. Kontenjan dolmadan hemen incele!`;

      await notifyUsers(
          studentIds,
          'Yeni Kurs Açıldı! 🌟',
          notificationBody,
          { courseId: courseId, type: 'new_course' }
      );

      return { success: true };

    } catch (error) {
        console.error('Error processing new course notification:', error);
        return null;
    }
  });
