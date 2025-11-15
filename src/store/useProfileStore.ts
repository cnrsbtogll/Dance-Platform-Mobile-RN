import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { AVATARS } from '../utils/avatars';

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
    // Check if user has a valid avatar (not empty and not just whitespace)
    const hasValidAvatar = user?.avatar && user.avatar.trim() !== '';
    
    // If user has no avatar, use the first avatar from AVATARS as default
    const defaultAvatar = hasValidAvatar 
      ? user.avatar 
      : AVATARS[0] || '';
    
    console.log('[ProfileStore] loadFromUser:', {
      userAvatar: user?.avatar,
      hasValidAvatar,
      defaultAvatar,
      AVATARS_0: AVATARS[0],
      tempAvatar: defaultAvatar,
    });
    
    set({ tempName: user?.name || '', tempAvatar: defaultAvatar });
  },

  applyChanges: () => {
    const { tempName, tempAvatar } = get();
    const { user, setUser } = useAuthStore.getState();
    if (!user) return;
    // If tempAvatar is empty, use the first avatar from AVATARS as default
    const finalAvatar = tempAvatar && tempAvatar.trim() !== '' 
      ? tempAvatar 
      : AVATARS[0] || user.avatar || '';
    
    console.log('[ProfileStore] applyChanges:', {
      tempAvatar,
      finalAvatar,
      userAvatar: user.avatar,
    });
    
    const updated = { ...user, name: tempName || user.name, avatar: finalAvatar };
    setUser(updated);
  },
}));