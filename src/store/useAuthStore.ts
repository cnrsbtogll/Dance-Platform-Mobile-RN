import { create } from 'zustand';
import { User } from '../types';
import { MockDataService } from '../services/mockDataService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    // Mock login - in real app, this would call Firebase Auth
    const users = MockDataService.getUsers();
    const user = users.find(u => u.email === email);
    
    if (user) {
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  
  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },
}));

