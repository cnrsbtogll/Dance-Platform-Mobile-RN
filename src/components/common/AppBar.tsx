import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../utils/theme';

interface AppBarProps {
  title: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  style?: ViewStyle;
}

export const AppBar: React.FC<AppBarProps> = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  style,
}) => {
  const theme = colors.student;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background.light }, style]}>
      {leftIcon && (
        <TouchableOpacity onPress={onLeftPress} style={styles.iconButton}>
          {leftIcon}
        </TouchableOpacity>
      )}
      <Text style={[styles.title, { color: theme.text.primaryLight }]}>{title}</Text>
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

