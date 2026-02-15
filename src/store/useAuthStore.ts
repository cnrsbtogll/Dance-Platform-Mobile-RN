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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateCurrency: (currency: Currency) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  
  initialize: () => {
    // Listen for auth state changes
    console.log('[AuthStore] Initialize called');
    if (auth) {
      onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('[AuthStore] AuthStateChanged:', firebaseUser ? `User ${firebaseUser.uid}` : 'No User');
        if (firebaseUser) {
          // User is signed in, fetch profile
          const userProfile = await FirestoreService.getUserById(firebaseUser.uid);
          if (userProfile) {
            // Check if we need to upgrade from "Misafir" to real name (fix for race condition)
            if ((userProfile.name === 'Misafir Dansçı' || userProfile.displayName === 'Misafir Dansçı') && 
                firebaseUser.displayName && 
                firebaseUser.displayName !== 'Misafir Dansçı') {
              
              console.log('[AuthStore] Upgrading user from Misafir to:', firebaseUser.displayName);
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
              createdAt: new Date().toISOString()
            };
            
            console.log('[AuthStore] Creating new user in Firestore:', minimalUser.id);
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

  login: async (email: string, password: string) => {
    // Use authService which handles Firebase/Mock switch
    const success = await authService.login(email, password);
    
    if (success && !auth) {
      // If mock login (auth is null), manually find user and set state
      const users = MockDataService.getUsers();
      const user = users.find(u => u.email === email);
      
      if (user) {
        get().setUser(user);
        return true;
      }
    }
    
    return success;
  },
  
  logout: async () => {
    console.log('[AuthStore] Logout called');
    try {
      await authService.logout();
      console.log('[AuthStore] Logout successful');
    } catch (error) {
      console.error('[AuthStore] Logout error:', error);
    } finally {
      console.log('[AuthStore] Clearing auth state');
      set({ user: null, isAuthenticated: false });
    }
  },
  
  setUser: (user: User | null) => {
    console.log('[AuthStore] setUser called with:', user ? `${user.name} (${user.role})` : 'null');
    // Set default currency for instructors if not set
    if (user && user.role === 'instructor' && !user.currency) {
      user.currency = 'USD';
    }
    // Set default avatar if not set
    if (user && (!user.avatar || user.avatar.trim() === '')) {
      user.avatar = AVATARS[0] || '';
      console.log('[AuthStore] setUser: Set default avatar', user.avatar);
    }
    set({ user, isAuthenticated: !!user });
  },
  
  updateCurrency: (currency: Currency) => {
    set((state) => {
      if (state.user && state.user.role === 'instructor') {
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
}));

