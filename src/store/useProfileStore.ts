import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

interface ProfileState {
  tempName: string;
  tempAvatar: string;
  setTempName: (name: string) => void;
  setTempAvatar: (avatar: string) => void;
  loadFromUser: () => void;
  applyChanges: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  tempName: '',
  tempAvatar: '',

  setTempName: (name) => set({ tempName: name }),
  setTempAvatar: (avatar) => set({ tempAvatar: avatar }),

  loadFromUser: () => {
    const user = useAuthStore.getState().user;
    set({ tempName: user?.name || '', tempAvatar: user?.avatar || '' });
  },

  applyChanges: () => {
    const { tempName, tempAvatar } = get();
    const { user, setUser } = useAuthStore.getState();
    if (!user) return;
    const updated = { ...user, name: tempName || user.name, avatar: tempAvatar || user.avatar };
    setUser(updated);
  },
}));