import React from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../utils/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const theme = colors.student;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.card.light,
            borderColor: error ? colors.general.danger : theme.border.light,
            color: theme.text.primaryLight,
          },
          style,
        ]}
        placeholderTextColor={theme.text.secondaryLight}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
    color: colors.student.text.primaryLight,
  },
  input: {
    height: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
  },
  error: {
    fontSize: typography.fontSize.xs,
    color: colors.general.danger,
    marginTop: spacing.xs,
  },
});

