/**
 * Backend Service Wrapper
 * Provides conditional backend integration based on appConfig
 * Falls back to MockDataService when integrations are disabled
 */

import { appConfig } from '../config/appConfig';
import { MockDataService } from './mockDataService';
import { FirestoreService } from './firebase/firestore';
import { auth, storage as firebaseStorage } from './firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Define stripeModule as null for now since it's not yet integrated
const stripeModule: any = null;
const firebaseEnabled = appConfig.integrations.firebase;

/**
 * Authentication Service
 */
export const authService = {
  login: async (email: string, password: string): Promise<boolean> => {
    if (firebaseEnabled) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('[AuthService] Firebase login success');
        return true;
      } catch (error) {
        console.error('[AuthService] Firebase login error:', error);
        return false;
      }
    } else {
      // Use mock authentication
      return MockDataService.authenticateUser(email, password);
    }
  },

  register: async (email: string, password: string, name: string): Promise<boolean> => {
    if (firebaseEnabled) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Also create user profile in Firestore
        if (cred.user) {
          await FirestoreService.updateUser(cred.user.uid, {
            id: cred.user.uid,
            name: name,
            displayName: name,
            email: email,
            role: 'student', // Default role
            createdAt: new Date().toISOString()
          });
        }
        return true;
      } catch (error) {
        console.error('[AuthService] Firebase register error:', error);
        return false;
      }
    } else {
      // Use mock registration
      return MockDataService.createUser(email, password, name);
    }
  },

  logout: async (): Promise<void> => {
    if (firebaseEnabled) {
      await signOut(auth);
      console.log('[AuthService] Firebase logout');
    } else {
      // Mock logout (no-op)
      console.log('[AuthService] Mock logout');
    }
  },
};

/**
 * Data Service
 */
export const dataService = {
  getLessons: async () => {
    if (firebaseEnabled) {
      return await FirestoreService.getLessons();
    } else {
      return MockDataService.getLessons();
    }
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
    if (appConfig.integrations.stripe && stripeModule) {
      try {
        // Use Stripe payment
        // const paymentIntent = await stripeModule.createPaymentIntent({
        //   amount: amount * 100, // Convert to cents
        //   currency: currency.toLowerCase(),
        // });
        console.log('[PaymentService] Using Stripe payment');
        return { success: false, error: 'Stripe not yet implemented' };
      } catch (error: any) {
        return { success: false, error: error.message || 'Payment failed' };
      }
    } else {
      // Mock payment
      console.log('[PaymentService] Using mock payment');
      return {
        success: true,
        transactionId: `mock_${Date.now()}`,
      };
    }
  },

  isStripeAvailable: (): boolean => {
    return appConfig.integrations.stripe && stripeModule !== null;
  },
};

/**
 * Storage Service
 */
export const storageService = {
  uploadImage: async (uri: string, path: string): Promise<string> => {
    if (appConfig.integrations.firebase && firebaseStorage) {
      // Use Firebase Storage
      // const ref = firebaseStorage.ref(path);
      // await ref.putFile(uri);
      // return await ref.getDownloadURL();
      console.log('[StorageService] Using Firebase Storage');
      return uri; // Placeholder
    } else {
      // Mock storage (return original URI)
      console.log('[StorageService] Using mock storage');
      return uri;
    }
  },
};

// Export service availability flags
export const isFirebaseEnabled = (): boolean => {
  return appConfig.integrations.firebase;
};

export const isStripeEnabled = (): boolean => {
  return appConfig.integrations.stripe;
};

