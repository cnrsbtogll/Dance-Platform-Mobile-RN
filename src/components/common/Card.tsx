import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows } from '../../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'light' | 'dark';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'light' }) => {
  const theme = colors.student;
  const cardStyle = variant === 'dark' ? theme.card.dark : theme.card.light;
  
  return (
    <View style={[styles.card, { backgroundColor: cardStyle }, shadows.md, style]}>
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

