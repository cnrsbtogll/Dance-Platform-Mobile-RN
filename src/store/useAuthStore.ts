import { create } from 'zustand';
import { User, Currency } from '../types';
import { MockDataService } from '../services/mockDataService';
import { authService } from '../services/backendService';
import { AVATARS } from '../utils/avatars';
import { FirestoreService } from '../services/firebase/firestore';
import { auth } from '../services/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => void;
  deleteAccount: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  updateCurrency: (currency: Currency) => void;
  refreshProfile: () => Promise<void>;
  initialize: (pushToken?: string | null) => void;
  updatePushToken: (token: string) => Promise<void>;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  
  initialize: (pushToken?: string | null) => {
    // Listen for auth state changes
    if (auth) {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in, fetch profile
          const userProfile = await FirestoreService.getUserById(firebaseUser.uid);
          if (userProfile) {
            // Check if we need to upgrade from "Misafir" to real name (fix for race condition)
            if ((userProfile.name === 'Misafir Dansçı' || userProfile.displayName === 'Misafir Dansçı') && 
                firebaseUser.displayName && 
                firebaseUser.displayName !== 'Misafir Dansçı') {
              
              const updatedUser = {
                ...userProfile,
                name: firebaseUser.displayName,
                displayName: firebaseUser.displayName,
                // Parse first/last name again if needed
                firstName: firebaseUser.displayName.split(' ').slice(0, -1).join(' ') || firebaseUser.displayName,
                lastName: firebaseUser.displayName.split(' ').slice(-1).join(' ') || ''
              };
              
              await FirestoreService.updateUser(userProfile.id, updatedUser);
              get().setUser(updatedUser);
            } else {
              // Ensure the push token is saved
              if (pushToken) {
                const updatedTokens = userProfile.pushTokens ? [...userProfile.pushTokens] : [];
                if (!updatedTokens.includes(pushToken)) {
                  updatedTokens.push(pushToken);
                  await FirestoreService.updateUser(userProfile.id, { pushTokens: updatedTokens });
                  userProfile.pushTokens = updatedTokens;
                }
              }
              get().setUser(userProfile);
            }
          } else {
            // New user or profile missing, set minimal info
            // Parse first and last name from display name
            const displayName = firebaseUser.displayName || '';
            const nameParts = displayName.split(' ');
            const lastName = nameParts.length > 1 ? nameParts.pop() : '';
            const firstName = nameParts.join(' ');

            const minimalUser: User = {
              id: firebaseUser.uid,
              name: displayName || 'Misafir Dansçı',
              displayName: displayName || 'Misafir Dansçı',
              firstName: firstName,
              lastName: lastName || null,
              email: firebaseUser.email || '',
              role: 'student',
              // Map Firebase fields to our User type. Use null instead of undefined for Firestore.
              // Eger profil resmi yoksa random bir avatar sec
              photoURL: firebaseUser.photoURL || AVATARS[Math.floor(Math.random() * AVATARS.length)],
              avatar: firebaseUser.photoURL || AVATARS[Math.floor(Math.random() * AVATARS.length)],
              phoneNumber: firebaseUser.phoneNumber || null,
              createdAt: new Date().toISOString(),
              pushTokens: pushToken ? [pushToken] : [],
            };
            
            try {
              await FirestoreService.createUser(minimalUser.id, minimalUser);
              get().setUser(minimalUser);
            } catch (error) {
              console.error('[AuthStore] Failed to create user in Firestore:', error);
              // Set local state anyway so user can proceed
              get().setUser(minimalUser);
            }
          }
        } else {
          // User is signed out
          set({ user: null, isAuthenticated: false });
        }
      });
    }
  },

  updatePushToken: async (token: string) => {
    const { user } = get();
    if (!user) return; // Wait until user is authenticated

    const updatedTokens = user.pushTokens ? [...user.pushTokens] : [];
    if (!updatedTokens.includes(token)) {
      updatedTokens.push(token);
      await FirestoreService.updateUser(user.id, { pushTokens: updatedTokens });
      get().setUser({ ...user, pushTokens: updatedTokens });
    }
  },

  login: async (email: string, password: string) => {
    // Use authService which handles Firebase/Mock switch
    const result = await authService.login(email, password);
    
    if (result.success && !auth) {
      // If mock login (auth is null), manually find user and set state
      const users = MockDataService.getUsers();
      const user = users.find(u => u.email === email);
      
      if (user) {
        get().setUser(user);
        return { success: true };
      }
    }
    
    return result;
  },
  
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('[AuthStore] Logout error:', error);
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },
  
  deleteAccount: async () => {
    const user = get().user;
    if (!user || !user.id) return false;

    try {
      // 1. Delete Firestore data first (while we still have auth tokens/permissions)
      await FirestoreService.deleteUser(user.id);
      
      // 2. Delete Firebase Auth account
      await authService.deleteAccount();
      
      set({ user: null, isAuthenticated: false });
      return true;
    } catch (error) {
      console.error('[AuthStore] deleteAccount error:', error);
      return false;
    }
  },
  
  setUser: (user: User | null) => {
    // Set default currency for instructors if not set
    if (user && (user.role === 'instructor' || user.role === 'draft-instructor') && !user.currency) {
      user.currency = 'TRY';
    }
    // Set default avatar if not set
    if (user && (!user.avatar || user.avatar.trim() === '')) {
      user.avatar = AVATARS[0] || '';
    }
    set({ user, isAuthenticated: !!user });
  },
  
  updateCurrency: (currency: Currency) => {
    set((state) => {
      if (state.user && (state.user.role === 'instructor' || state.user.role === 'draft-instructor')) {
        // TODO: Update in Firestore as well
        if (state.user.id) {
           FirestoreService.updateUser(state.user.id, { currency });
        }
        return {
          user: { ...state.user, currency },
        };
      }
      return state;
    });
  },

  refreshProfile: async () => {
    const user = get().user;
    if (!user || !user.id) return;
    
    try {
      const updatedProfile = await FirestoreService.getUserById(user.id);
      if (updatedProfile) {
        get().setUser(updatedProfile);
      }
    } catch (error) {
      console.error('[AuthStore] Error refreshing profile:', error);
    }
  },
}));

