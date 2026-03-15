import { DanceLevel } from '../utils/constants';

export type UserRole = 'student' | 'instructor' | 'admin' | 'draft-instructor' | 'school' | 'draft-school';
export type Currency = 'USD' | 'EUR' | 'TRY';

export interface User {
  id: string;
  name: string; // Mapped from displayName
  displayName: string; // Firebase field
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: UserRole;
  avatar?: string | null; // Mapped from photoURL
  photoURL?: string | null; // Firebase field
  bio?: string;
  rating?: number;
  totalLessons?: number;
  currency?: Currency; // For instructors only
  phoneNumber?: string | null;
  gender?: 'male' | 'female' | 'other';
  createdAt: string;
  updatedAt?: string;
  isVerified?: boolean;
  onboardingCompleted?: boolean;
  // School specific fields
  schoolName?: string;
  schoolAddress?: string;
  contactNumber?: string;
  contactPerson?: string;
  instagramHandle?: string;
  height?: number | string;
  weight?: number | string;
  age?: number;
  danceStyles?: string[];
  experience?: string;
  city?: string;
  country?: string;
  verificationStatus?: 'idle' | 'pending' | 'verified' | 'rejected';
  schoolId?: string | null;              // Başvurulan okul (pending approval)
  verificationMethod?: 'school' | 'document';
  pushTokens?: string[];
  location?: {
    city: string;
    country: string;
    isAutoDetected: boolean;
  };
  // Partner search & profile enrichment
  level?: DanceLevel;
  isVisibleInPartnerSearch?: boolean;
  // Instructor-specific
  yearsOfTeaching?: number;
  certificates?: string;
  showPhoneNumberToStudents?: boolean;
}

