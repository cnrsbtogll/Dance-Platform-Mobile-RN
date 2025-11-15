import { create } from 'zustand';
import { User, Currency } from '../types';
import { MockDataService } from '../services/mockDataService';

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

