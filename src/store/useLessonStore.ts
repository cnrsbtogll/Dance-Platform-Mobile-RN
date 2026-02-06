import { create } from 'zustand';
import { Lesson, Review } from '../types';
import { MockDataService } from '../services/mockDataService';
import { dataService } from '../services/backendService';

interface LessonState {
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  favoriteLessons: string[];
  searchQuery: string;
  selectedCategory: string | null;
  setLessons: (lessons: Lesson[]) => void;
  setSelectedLesson: (lesson: Lesson | null) => void;
  toggleFavorite: (lessonId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  getFilteredLessons: () => Lesson[];
  getLessonReviews: (lessonId: string) => Review[];
  refreshLessons: () => Promise<void>;
}

export const useLessonStore = create<LessonState>((set, get) => {
  // Store'u başlatırken dersleri yükle
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
  
  getFilteredLessons: () => {
    const { lessons, searchQuery, selectedCategory } = get();
    let filtered = [...lessons];
    
    if (selectedCategory) {
      filtered = filtered.filter(lesson => lesson.category === selectedCategory);
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
  };
});

