# Firebase Integration Plan

## Overview
This directory contains the planned structure for Firebase services integration. Currently, the app uses mock data via `MockDataService`. This plan outlines how to migrate to Firebase.

## Services

### Authentication (`auth.ts`)
- Email/Password authentication
- Google Sign-In
- Phone Authentication
- Password reset
- Email verification

### Firestore (`firestore.ts`)
Collections:
- `users/{userId}` - User profiles
- `lessons/{lessonId}` - Lessons
- `bookings/{bookingId}` - Bookings
- `reviews/{reviewId}` - Reviews
- `messages/{messageId}` - Messages
- `notifications/{notificationId}` - Notifications
- `favorites/{userId}/lessons/{lessonId}` - Favorite lessons

### Storage (`storage.ts`)
Paths:
- `lesson-images/{lessonId}/` - Lesson images
- `user-avatars/{userId}/` - User profile pictures

## Migration Steps

1. Install Firebase packages:
   ```bash
   npm install firebase
   ```

2. Create Firebase project and get configuration

3. Initialize Firebase in the app

4. Replace MockDataService calls with Firebase service calls

5. Update stores to use Firebase real-time listeners

6. Implement offline persistence

7. Add error handling and retry logic

## Security Rules

Firestore security rules should be configured to:
- Allow users to read their own data
- Allow instructors to manage their lessons
- Allow students to book lessons
- Prevent unauthorized access

## Performance Considerations

- Use Firestore indexes for complex queries
- Implement pagination for large lists
- Cache frequently accessed data
- Use batch operations for multiple writes

