import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { AVATARS } from '../utils/avatars';
import { FirestoreService } from '../services/firebase/firestore';

interface ProfileState {
  tempName: string;
  tempAvatar: string;
  // Common
  tempBio: string;
  tempPhoneNumber: string;
  // School specific
  tempSchoolName: string;
  tempSchoolAddress: string;
  tempContactNumber: string;
  tempContactPerson: string;
  tempInstagramHandle: string;

  setTempName: (name: string) => void;
  setTempAvatar: (avatar: string) => void;
  setTempBio: (bio: string) => void;
  setTempPhoneNumber: (phone: string) => void;
  setTempSchoolName: (name: string) => void;
  setTempSchoolAddress: (address: string) => void;
  setTempContactNumber: (number: string) => void;
  setTempContactPerson: (person: string) => void;
  setTempInstagramHandle: (handle: string) => void;

  loadFromUser: () => void;
  applyChanges: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  tempName: '',
  tempAvatar: '',
  tempBio: '',
  tempPhoneNumber: '',
  tempSchoolName: '',
  tempSchoolAddress: '',
  tempContactNumber: '',
  tempContactPerson: '',
  tempInstagramHandle: '',

  setTempName: (name) => set({ tempName: name }),
  setTempAvatar: (avatar) => set({ tempAvatar: avatar }),
  setTempBio: (bio) => set({ tempBio: bio }),
  setTempPhoneNumber: (phone) => set({ tempPhoneNumber: phone }),
  setTempSchoolName: (name) => set({ tempSchoolName: name }),
  setTempSchoolAddress: (address) => set({ tempSchoolAddress: address }),
  setTempContactNumber: (number) => set({ tempContactNumber: number }),
  setTempContactPerson: (person) => set({ tempContactPerson: person }),
  setTempInstagramHandle: (handle) => set({ tempInstagramHandle: handle }),

  loadFromUser: () => {
    const user = useAuthStore.getState().user;
    const hasValidAvatar = user?.avatar && user.avatar.trim() !== '';
    const defaultAvatar = hasValidAvatar ? user!.avatar! : AVATARS[0] || '';

    set({
      tempName: user?.name || '',
      tempAvatar: defaultAvatar,
      tempBio: user?.bio || '',
      tempPhoneNumber: user?.phoneNumber || '',
      tempSchoolName: user?.schoolName || '',
      tempSchoolAddress: user?.schoolAddress || '',
      tempContactNumber: user?.contactNumber || '',
      tempContactPerson: user?.contactPerson || '',
      tempInstagramHandle: user?.instagramHandle || '',
    });
  },

  applyChanges: async () => {
    const {
      tempName, tempAvatar, tempBio, tempPhoneNumber,
      tempSchoolName, tempSchoolAddress, tempContactNumber,
      tempContactPerson, tempInstagramHandle,
    } = get();
    const { user, setUser } = useAuthStore.getState();
    if (!user) return;

    const finalAvatar = tempAvatar && tempAvatar.trim() !== ''
      ? tempAvatar
      : AVATARS[0] || user.avatar || '';

    const updatedFields: Record<string, any> = {
      name: tempName || user.name,
      displayName: tempName || user.displayName,
      avatar: finalAvatar,
      photoURL: finalAvatar,
    };

    // Only set optional fields if they have a value (Firestore rejects undefined)
    if (tempBio) updatedFields.bio = tempBio;
    if (tempPhoneNumber) updatedFields.phoneNumber = tempPhoneNumber;

    // School-specific fields
    if (user.role === 'school' || user.role === 'draft-school') {
      if (tempSchoolName) updatedFields.schoolName = tempSchoolName;
      if (tempSchoolAddress) updatedFields.schoolAddress = tempSchoolAddress;
      if (tempContactNumber) updatedFields.contactNumber = tempContactNumber;
      if (tempContactPerson) updatedFields.contactPerson = tempContactPerson;
      if (tempInstagramHandle) updatedFields.instagramHandle = tempInstagramHandle;
    }

    const updated = { ...user, ...updatedFields };
    setUser(updated);

    // Persist to Firestore
    try {
      await FirestoreService.updateUser(user.id, updatedFields);
    } catch (error) {
      console.error('[ProfileStore] Failed to save to Firestore:', error);
    }
  },
}));