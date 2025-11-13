import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../utils/theme';

interface TabItem {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
}

interface BottomTabProps {
  items: TabItem[];
  activeIndex?: number;
}

export const BottomTab: React.FC<BottomTabProps> = ({ items, activeIndex = 0 }) => {
  const theme = colors.student;
  
  return (
    <SafeAreaView edges={['bottom']} style={[styles.safeArea, { backgroundColor: colors.student.background.light + 'CC', borderTopColor: theme.border.light }]}>
      <View style={styles.container}>
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity
              key={index}
              style={styles.tabItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              {item.icon && (
                <View style={styles.iconContainer}>
                  {item.icon}
                </View>
              )}
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? theme.primary : theme.text.secondaryLight,
                    fontWeight: isActive ? typography.fontWeight.bold : typography.fontWeight.medium,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    borderTopWidth: 1,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: typography.fontSize.xs,
  },
});

