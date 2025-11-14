import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,
  setDarkMode: (value) => set({ isDarkMode: value }),
  toggleTheme: () => set({ isDarkMode: !get().isDarkMode }),
}));