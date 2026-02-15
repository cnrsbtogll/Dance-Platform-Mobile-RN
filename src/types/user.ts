export type UserRole = 'student' | 'instructor';
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
}

