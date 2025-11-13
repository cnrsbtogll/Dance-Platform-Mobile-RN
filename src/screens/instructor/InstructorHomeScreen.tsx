import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/theme';

export const InstructorHomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eğitmen Ana Sayfa</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.instructor.background.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.instructor.primary,
  },
});

