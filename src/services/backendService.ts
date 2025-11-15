/**
 * Backend Service Wrapper
 * Provides conditional backend integration based on appConfig
 * Falls back to MockDataService when integrations are disabled
 */

import { appConfig } from '../config/appConfig';
import { MockDataService } from './mockDataService';

// Conditional Firebase import
let firebaseAuth: any = null;
let firestore: any = null;
let firebaseStorage: any = null;

if (appConfig.integrations.firebase) {
  try {
    // Firebase will be imported here when implemented
    // import { auth } from './firebase/auth';
    // import { db } from './firebase/firestore';
    // import { storage } from './firebase/storage';
    console.log('[BackendService] Firebase integration enabled');
  } catch (error) {
    console.warn('[BackendService] Firebase not available:', error);
  }
}

// Conditional Stripe import
let stripeModule: any = null;

if (appConfig.integrations.stripe) {
  try {
    // Stripe will be imported here when implemented
    // stripeModule = require('@stripe/stripe-react-native');
    console.log('[BackendService] Stripe integration enabled');
  } catch (error) {
    console.warn('[BackendService] Stripe not available:', error);
  }
}

/**
 * Authentication Service
 */
export const authService = {
  login: async (email: string, password: string): Promise<boolean> => {
    if (appConfig.integrations.firebase && firebaseAuth) {
      // Use Firebase authentication
      // return await firebaseAuth.signInWithEmailAndPassword(email, password);
      console.log('[AuthService] Using Firebase auth');
      return false; // Placeholder
    } else {
      // Use mock authentication
      return MockDataService.authenticateUser(email, password);
    }
  },

  register: async (email: string, password: string, name: string): Promise<boolean> => {
    if (appConfig.integrations.firebase && firebaseAuth) {
      // Use Firebase registration
      // return await firebaseAuth.createUserWithEmailAndPassword(email, password);
      console.log('[AuthService] Using Firebase registration');
      return false; // Placeholder
    } else {
      // Use mock registration
      return MockDataService.createUser(email, password, name);
    }
  },

  logout: async (): Promise<void> => {
    if (appConfig.integrations.firebase && firebaseAuth) {
      // Use Firebase logout
      // await firebaseAuth.signOut();
      console.log('[AuthService] Using Firebase logout');
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
  getLessons: () => {
    if (appConfig.integrations.firebase && firestore) {
      // Use Firestore
      // return firestore.collection('lessons').get();
      console.log('[DataService] Using Firestore');
      return [];
    } else {
      // Use mock data
      return MockDataService.getLessons();
    }
  },

  getUsers: () => {
    if (appConfig.integrations.firebase && firestore) {
      // Use Firestore
      // return firestore.collection('users').get();
      console.log('[DataService] Using Firestore');
      return [];
    } else {
      // Use mock data
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

