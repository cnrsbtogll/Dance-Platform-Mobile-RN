import { User } from './user';

export interface Instructor {
  id: string; // Document ID (usually same as userId or separate)
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  role: 'instructor';
  specialties?: string; // JSON string in Firebase example: "[kizomba]"
  experience?: number;
  bio?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}
