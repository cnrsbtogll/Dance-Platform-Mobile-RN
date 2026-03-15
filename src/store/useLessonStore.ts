import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lesson, Review } from '../types';
import { MockDataService } from '../services/mockDataService';
import { dataService } from '../services/backendService';

interface LessonState {
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  favoriteLessons: string[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedCity: string | null;
  setLessons: (lessons: Lesson[]) => void;
  setSelectedLesson: (lesson: Lesson | null) => void;
  toggleFavorite: (lessonId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedCity: (city: string | null) => void;
  getFilteredLessons: () => Lesson[];
  getLessonReviews: (lessonId: string) => Review[];
  refreshLessons: () => Promise<void>;
  updateLesson: (lessonId: string, updates: Partial<Lesson>) => void;
}

export const useLessonStore = create<LessonState>()(
  persist(
    (set, get) => {
      // Store'u başlatırken kursları yükle
      // Async initialization
      dataService.getLessons()
        .then((lessons) => {
          set({ lessons });
        })
        .catch((error) => {
          console.error('[useLessonStore] Error fetching lessons during init:', error);
          set({ lessons: [] });
        });
      
      return {
    lessons: [], // Initial state empty until loaded
    selectedLesson: null,
    favoriteLessons: [],
    searchQuery: '',
    selectedCategory: null,
    selectedCity: null,
  
  setLessons: (lessons) => set({ lessons }),
  
  setSelectedLesson: (lesson) => set({ selectedLesson: lesson }),
  
  toggleFavorite: (lessonId) => {
    const { favoriteLessons } = get();
    const newFavorites = favoriteLessons.includes(lessonId)
      ? favoriteLessons.filter(id => id !== lessonId)
      : [...favoriteLessons, lessonId];
    set({ favoriteLessons: newFavorites });
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  setSelectedCity: (city) => set({ selectedCity: city }),
  
  getFilteredLessons: () => {
    const { lessons, searchQuery, selectedCategory, selectedCity } = get();
    let filtered = [...lessons];
    
    if (selectedCategory) {
      filtered = filtered.filter(lesson => lesson.category === selectedCategory);
    }
    
    if (selectedCity) {
      const cityLower = selectedCity.toLowerCase();
      filtered = filtered.filter(lesson => 
        (lesson.location?.customCity || '').toLowerCase().includes(cityLower) ||
        (lesson.schoolName || '').toLowerCase().includes(cityLower) ||
        (lesson.schoolAddress || '').toLowerCase().includes(cityLower) ||
        (lesson as any).city?.toLowerCase().includes(cityLower)
      );
    }
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(lesson => 
        lesson.title.toLowerCase().includes(lowerQuery) ||
        lesson.description.toLowerCase().includes(lowerQuery) ||
        lesson.category.toLowerCase().includes(lowerQuery)
      );
    }
    
    return filtered;
  },
  
  getLessonReviews: (lessonId) => {
    return MockDataService.getReviewsByLesson(lessonId);
  },
  
  refreshLessons: async () => {
    try {
      const lessons = await dataService.getLessons();
      set({ lessons });
    } catch (error) {
      console.error('[useLessonStore] Error refreshing lessons:', error);
    }
  },

  updateLesson: (lessonId: string, updates: Partial<Lesson>) =>
    set((state) => ({
      lessons: state.lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, ...updates } : lesson
      ),
      selectedLesson:
        state.selectedLesson?.id === lessonId
          ? { ...state.selectedLesson, ...updates }
          : state.selectedLesson,
    })),
  };
},
{
  name: 'lesson-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ selectedCity: state.selectedCity }),
}
)
);
