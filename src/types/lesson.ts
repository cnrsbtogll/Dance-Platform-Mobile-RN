export type LessonCategory = 'Salsa' | 'Bachata' | 'Tango' | 'Kizomba' | 'Vals' | string;
export type LessonLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional' | string;

export interface Lesson {
  id: string;
  title: string; // Mapped from name
  name: string; // Firebase field
  description: string;
  category: LessonCategory; // Mapped from danceStyle
  danceStyle: string; // Firebase field
  level?: LessonLevel;
  instructorId: string;
  price: number;
  currency?: string;
  duration: number; // minutes
  imageUrl?: string | number;
  date?: string; // ISO date (YYYY-MM-DD)
  time?: string; // HH:mm format
  daysOfWeek?: string[]; // Array of strings
  recurring?: boolean;
  maxParticipants?: number;
  currentParticipants?: number;
  rating: number;
  reviewCount: number;
  favoriteCount: number;
  isActive: boolean; // Mapped from status === 'active'
  status?: string; // Firebase field
  tags?: string[]; // Array of strings
  highlights?: string[]; // Array of strings
  location?: {
    type: 'school' | 'custom';
    schoolId?: string;
    schoolName?: string;
    customAddress?: string;
  };
  schoolId?: string;
  schoolName?: string;
  instructorName?: string;
  createdAt: string;
  updatedAt?: string;
}

