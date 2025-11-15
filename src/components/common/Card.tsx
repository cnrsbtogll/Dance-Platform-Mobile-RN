import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'light' | 'dark';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'light' }) => {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette(user?.role === 'instructor' ? 'instructor' : 'student', isDarkMode);
  const cardStyle = palette.card;
  
  return (
    <View style={[styles.card, { backgroundColor: cardStyle }, shadows.md, { elevation: 4 }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: 16,
  },
});

