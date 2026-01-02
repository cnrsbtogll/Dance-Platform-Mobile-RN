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
  imageUrl?: string;
  date?: string; // ISO date (YYYY-MM-DD)
  time?: string; // HH:mm format
  daysOfWeek?: string; // JSON string or array
  recurring?: boolean;
  maxParticipants?: number;
  currentParticipants?: number;
  rating: number;
  reviewCount: number;
  favoriteCount: number;
  isActive: boolean; // Mapped from status === 'active'
  status?: string; // Firebase field
  tags?: string; // JSON string
  highlights?: string; // JSON string
  location?: any;
  schoolId?: string;
  schoolName?: string;
  instructorName?: string;
  createdAt: string;
  updatedAt?: string;
}

