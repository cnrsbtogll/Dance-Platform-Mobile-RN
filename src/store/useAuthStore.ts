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
            get().setUser(userProfile);
          } else {
            // New user or profile missing, set minimal info
            const minimalUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              displayName: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              role: 'student',
              createdAt: new Date().toISOString()
            };
            get().setUser(minimalUser);
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

