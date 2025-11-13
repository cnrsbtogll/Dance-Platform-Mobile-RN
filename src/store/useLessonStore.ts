import { create } from 'zustand';
import { Lesson, Review } from '../types';
import { MockDataService } from '../services/mockDataService';

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
  refreshLessons: () => void;
}

export const useLessonStore = create<LessonState>((set, get) => {
  // Store'u başlatırken dersleri yükle
  const initialLessons = MockDataService.getActiveLessons();
  
  return {
    lessons: initialLessons,
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
      filtered = MockDataService.searchLessons(searchQuery).filter(lesson =>
        filtered.some(l => l.id === lesson.id)
      );
    }
    
    return filtered;
  },
  
  getLessonReviews: (lessonId) => {
    return MockDataService.getReviewsByLesson(lessonId);
  },
  
  refreshLessons: () => {
    set({ lessons: MockDataService.getActiveLessons() });
  },
  };
});

