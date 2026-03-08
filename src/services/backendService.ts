/**
 * Backend Service Wrapper
 * Provides conditional backend integration based on appConfig
 * Falls back to MockDataService when integrations are disabled
 */

import { appConfig } from '../config/appConfig';
import { MockDataService } from './mockDataService';
import { FirestoreService } from './firebase/firestore';
import { auth, storage as firebaseStorage } from './firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { signOut as customSignOut, deleteAccount as customDeleteAccount } from './firebase/auth';
import {
  uploadAvatar,
  uploadCourseCover,
  uploadInstructorDocument,
  getDocumentDownloadUrl,
} from './storageService';

const firebaseEnabled = appConfig.integrations.firebase;

/**
 * Authentication Service
 */
export const authService = {
  login: async (email: string, password: string): Promise<{ success: boolean; error?: any }> => {
    if (firebaseEnabled) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    }
    return { success: false, error: new Error('Firebase disabled') };
  },

  register: async (email: string, password: string, firstName: string, lastName: string): Promise<{ success: boolean; error?: any }> => {
    if (firebaseEnabled) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = `${firstName} ${lastName}`;
        // Also create user profile in Firestore
        if (cred.user) {
          await FirestoreService.createUser(cred.user.uid, {
            id: cred.user.uid,
            name: displayName,
            displayName: displayName,
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: 'student', // Default role
            createdAt: new Date().toISOString()
          });
        }
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    }
    return { success: false, error: new Error('Firebase disabled') };
  },

  logout: async (): Promise<void> => {
    if (firebaseEnabled) {
      await customSignOut();
    } else {
      // Mock logout (no-op)
    }
  },

  deleteAccount: async (): Promise<void> => {
    if (firebaseEnabled) {
      await customDeleteAccount();
    } else {
    }
  },
};

/**
 * Data Service
 */
export const dataService = {
  getLessons: async () => {
    if (firebaseEnabled) {
      try {
        const lessons = await FirestoreService.getLessons();
        return lessons;
      } catch (error) {
        console.error('[BackendService] Error fetching from Firestore, falling back to empty array:', error);
        return [];
      }
    }
    return [];
  },

  getUsers: async () => {
    if (firebaseEnabled) {
      // Not implemented in FirestoreService yet, adding TODO
      // return await FirestoreService.getUsers();
      return [];
    } else {
      return MockDataService.getUsers();
    }
  },
};


/**
 * Payment Service
 */
export const paymentService = {
  processPayment: async (amount: number, currency: string, paymentMethodId: string): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
    // Mock payment
    return {
      success: true,
      transactionId: `mock_${Date.now()}`,
    };
  },

};

/**
 * Storage Service — delegates to MinIO storageService
 */
export const storageService = {
  uploadAvatar,
  uploadCourseCover,
  uploadInstructorDocument,
  getDocumentDownloadUrl,
};


// Export service availability flags
export const isFirebaseEnabled = (): boolean => {
  return appConfig.integrations.firebase;
};


