import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Ara...',
  onFilterPress,
}) => {
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);
  
  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: palette.card }]}>
        <MaterialIcons name="search" size={24} color={palette.text.secondary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.input, { color: palette.text.primary }]}
          placeholder={placeholder}
          placeholderTextColor={palette.text.secondary}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
      {onFilterPress && (
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: palette.primary }]}
          onPress={onFilterPress}
        >
          <MaterialIcons name="tune" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

