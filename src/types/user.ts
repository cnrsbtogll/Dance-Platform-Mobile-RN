export type UserRole = 'student' | 'instructor';
export type Currency = 'USD' | 'EUR' | 'TRY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  rating?: number;
  totalLessons?: number;
  currency?: Currency; // For instructors only
  createdAt: string;
  updatedAt?: string;
}

