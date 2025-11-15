import { create } from 'zustand';
import { User, Currency } from '../types';
import { MockDataService } from '../services/mockDataService';
import { AVATARS } from '../utils/avatars';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateCurrency: (currency: Currency) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    // Mock login - in real app, this would call Firebase Auth
    const users = MockDataService.getUsers();
    const user = users.find(u => u.email === email);
    
    if (user) {
      // Set default currency for instructors if not set
      if (user.role === 'instructor' && !user.currency) {
        user.currency = 'USD';
      }
      // Set default avatar if not set
      if (!user.avatar || user.avatar.trim() === '') {
        user.avatar = AVATARS[0] || '';
        console.log('[AuthStore] login: Set default avatar', user.avatar);
      }
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  
  setUser: (user: User | null) => {
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
        return {
          user: { ...state.user, currency },
        };
      }
      return state;
    });
  },
}));

