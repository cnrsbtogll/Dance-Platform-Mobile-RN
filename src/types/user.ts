export type UserRole = 'student' | 'instructor';
export type Currency = 'USD' | 'EUR' | 'TRY';

export interface User {
  id: string;
  name: string; // Mapped from displayName
  displayName: string; // Firebase field
  email: string;
  role: UserRole;
  avatar?: string; // Mapped from photoURL
  photoURL?: string; // Firebase field
  bio?: string;
  rating?: number;
  totalLessons?: number;
  currency?: Currency; // For instructors only
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other';
  createdAt: string;
  updatedAt?: string;
}

