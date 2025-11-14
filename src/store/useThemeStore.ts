import { create } from 'zustand';
import i18n from '../utils/i18n';

interface ThemeState {
  isDarkMode: boolean;
  language: 'tr' | 'en';
  setDarkMode: (value: boolean) => void;
  toggleTheme: () => void;
  setLanguage: (lang: 'tr' | 'en') => void;
}

// Get initial language from i18n
const getInitialLanguage = (): 'tr' | 'en' => {
  const currentLang = i18n.language || 'tr';
  return currentLang === 'en' ? 'en' : 'tr';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,
  language: getInitialLanguage(),
  setDarkMode: (value) => set({ isDarkMode: value }),
  toggleTheme: () => set({ isDarkMode: !get().isDarkMode }),
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));