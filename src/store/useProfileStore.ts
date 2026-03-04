import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { AVATARS } from '../utils/avatars';
import { FirestoreService } from '../services/firebase/firestore';
import { DanceLevel } from '../utils/constants';

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
  // Physical & dance info (all roles)
  tempHeight: string;
  tempWeight: string;
  tempDanceStyles: string[];
  tempLevel: DanceLevel | '';
  // Personal info
  tempGender: 'male' | 'female' | 'other' | '';
  tempAge: string;
  tempCountry: string;
  tempCity: string;
  // Partner search visibility
  tempIsVisibleInPartnerSearch: boolean;
  // Instructor specific
  tempYearsOfTeaching: string;
  tempCertificates: string;

  setTempName: (name: string) => void;
  setTempAvatar: (avatar: string) => void;
  setTempBio: (bio: string) => void;
  setTempPhoneNumber: (phone: string) => void;
  setTempSchoolName: (name: string) => void;
  setTempSchoolAddress: (address: string) => void;
  setTempContactNumber: (number: string) => void;
  setTempContactPerson: (person: string) => void;
  setTempInstagramHandle: (handle: string) => void;
  setTempHeight: (h: string) => void;
  setTempWeight: (w: string) => void;
  setTempDanceStyles: (styles: string[]) => void;
  setTempLevel: (level: DanceLevel | '') => void;
  setTempGender: (g: 'male' | 'female' | 'other' | '') => void;
  setTempAge: (a: string) => void;
  setTempCountry: (c: string) => void;
  setTempCity: (c: string) => void;
  setTempIsVisibleInPartnerSearch: (v: boolean) => void;
  setTempYearsOfTeaching: (y: string) => void;
  setTempCertificates: (c: string) => void;

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
  tempHeight: '',
  tempWeight: '',
  tempDanceStyles: [],
  tempLevel: '',
  tempGender: '',
  tempAge: '',
  tempCountry: 'Türkiye',
  tempCity: '',
  tempIsVisibleInPartnerSearch: true,
  tempYearsOfTeaching: '',
  tempCertificates: '',

  setTempName: (name) => set({ tempName: name }),
  setTempAvatar: (avatar) => set({ tempAvatar: avatar }),
  setTempBio: (bio) => set({ tempBio: bio }),
  setTempPhoneNumber: (phone) => set({ tempPhoneNumber: phone }),
  setTempSchoolName: (name) => set({ tempSchoolName: name }),
  setTempSchoolAddress: (address) => set({ tempSchoolAddress: address }),
  setTempContactNumber: (number) => set({ tempContactNumber: number }),
  setTempContactPerson: (person) => set({ tempContactPerson: person }),
  setTempInstagramHandle: (handle) => set({ tempInstagramHandle: handle }),
  setTempHeight: (h) => set({ tempHeight: h }),
  setTempWeight: (w) => set({ tempWeight: w }),
  setTempDanceStyles: (styles) => set({ tempDanceStyles: styles }),
  setTempLevel: (level) => set({ tempLevel: level }),
  setTempGender: (g) => set({ tempGender: g }),
  setTempAge: (a) => set({ tempAge: a }),
  setTempCountry: (c) => set({ tempCountry: c }),
  setTempCity: (c) => set({ tempCity: c }),
  setTempIsVisibleInPartnerSearch: (v) => set({ tempIsVisibleInPartnerSearch: v }),
  setTempYearsOfTeaching: (y) => set({ tempYearsOfTeaching: y }),
  setTempCertificates: (c) => set({ tempCertificates: c }),

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
      tempHeight: user?.height != null ? String(user.height) : '',
      tempWeight: user?.weight != null ? String(user.weight) : '',
      tempDanceStyles: user?.danceStyles || [],
      tempLevel: (user?.level as DanceLevel) || '',
      tempGender: (user?.gender as 'male' | 'female' | 'other') || '',
      tempAge: user?.age != null ? String(user.age) : '',
      tempCountry: user?.country || 'Türkiye',
      tempCity: user?.city || '',
      tempIsVisibleInPartnerSearch: user?.isVisibleInPartnerSearch !== false, // default true
      tempYearsOfTeaching: user?.yearsOfTeaching != null ? String(user.yearsOfTeaching) : '',
      tempCertificates: user?.certificates || '',
    });
  },

  applyChanges: async () => {
    const {
      tempName, tempAvatar, tempBio, tempPhoneNumber,
      tempSchoolName, tempSchoolAddress, tempContactNumber,
      tempContactPerson, tempInstagramHandle,
      tempHeight, tempWeight, tempDanceStyles, tempLevel,
      tempGender, tempAge, tempCountry, tempCity,
      tempIsVisibleInPartnerSearch,
      tempYearsOfTeaching, tempCertificates,
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
      isVisibleInPartnerSearch: tempIsVisibleInPartnerSearch,
      danceStyles: tempDanceStyles,
    };

    if (tempBio) updatedFields.bio = tempBio;
    if (tempPhoneNumber) updatedFields.phoneNumber = tempPhoneNumber;
    if (tempHeight) updatedFields.height = Number(tempHeight) || tempHeight;
    if (tempWeight) updatedFields.weight = Number(tempWeight) || tempWeight;
    if (tempLevel) updatedFields.level = tempLevel;
    if (tempGender) updatedFields.gender = tempGender;
    if (tempAge) updatedFields.age = Number(tempAge) || undefined;
    if (tempCountry) updatedFields.country = tempCountry;
    if (tempCity) updatedFields.city = tempCity;

    // School-specific fields
    if (user.role === 'school' || user.role === 'draft-school') {
      if (tempSchoolName) updatedFields.schoolName = tempSchoolName;
      if (tempSchoolAddress) updatedFields.schoolAddress = tempSchoolAddress;
      if (tempContactNumber) updatedFields.contactNumber = tempContactNumber;
      if (tempContactPerson) updatedFields.contactPerson = tempContactPerson;
      if (tempInstagramHandle) updatedFields.instagramHandle = tempInstagramHandle;
    }

    // Instructor-specific fields
    if (user.role === 'instructor' || user.role === 'draft-instructor') {
      if (tempYearsOfTeaching) updatedFields.yearsOfTeaching = Number(tempYearsOfTeaching) || 0;
      if (tempCertificates) updatedFields.certificates = tempCertificates;
    }

    const updated = { ...user, ...updatedFields };
    setUser(updated);

    try {
      await FirestoreService.updateUser(user.id, updatedFields);
    } catch (error) {
      console.error('[ProfileStore] Failed to save to Firestore:', error);
    }
  },
}));