export type UserRole = 'student' | 'instructor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  rating?: number;
  totalLessons?: number;
  createdAt: string;
  updatedAt?: string;
}

