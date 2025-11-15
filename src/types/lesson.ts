export type LessonCategory = 'Salsa' | 'Bachata' | 'Tango' | 'Kizomba';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  instructorId: string;
  price: number;
  duration: number; // minutes
  imageUrl?: string;
  date?: string; // ISO date (YYYY-MM-DD)
  time?: string; // HH:mm format
  rating: number;
  reviewCount: number;
  favoriteCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

