import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, typography, spacing } from '../../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled = false,
}) => {
  const theme = colors.student;
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    };
    
    if (size === 'sm') {
      baseStyle.paddingHorizontal = spacing.sm;
      baseStyle.paddingVertical = spacing.xs;
    } else if (size === 'lg') {
      baseStyle.paddingHorizontal = spacing.lg;
      baseStyle.paddingVertical = spacing.md;
    }
    
    if (variant === 'primary') {
      baseStyle.backgroundColor = theme.primary;
    } else if (variant === 'secondary') {
      baseStyle.backgroundColor = theme.secondary;
    } else if (variant === 'outline') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = theme.primary;
    }
    
    if (disabled) {
      baseStyle.opacity = 0.5;
    }
    
    return baseStyle;
  };
  
  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      color: variant === 'outline' ? theme.primary : '#ffffff',
      fontWeight: typography.fontWeight.bold,
    };
    
    if (size === 'sm') {
      baseStyle.fontSize = typography.fontSize.sm;
    } else if (size === 'lg') {
      baseStyle.fontSize = typography.fontSize.lg;
    } else {
      baseStyle.fontSize = typography.fontSize.base;
    }
    
    return baseStyle;
  };
  
  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

