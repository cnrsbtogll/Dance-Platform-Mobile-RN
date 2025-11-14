import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { openWhatsApp } from '../../utils/whatsapp';
import { Card } from '../../components/common/Card';

export const BecomeInstructorScreen: React.FC = () => {
  const phone = '+90 555 005 9876';
  const message = 'Merhaba dance platform uygulamanıza eğitmen olarak kayıt yaptırmak istiyorum';

  return (
    <View style={[styles.container, { backgroundColor: colors.student.background.light }] }>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <MaterialIcons name="school" size={24} color={colors.student.primary} />
          <Text style={styles.title}>Eğitmen Ol</Text>
        </View>
        <Text style={styles.description}>
          Eğitmen olarak ders açmak ve öğrencilerle buluşmak için bizimle iletişime geç.
        </Text>
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={() => openWhatsApp(phone, message)}
        >
          <FontAwesome name="whatsapp" size={20} color="#ffffff" />
          <Text style={styles.whatsappText}>WhatsApp ile İletişime Geç</Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.student.text.secondaryLight,
    marginBottom: spacing.lg,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#25D366',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  whatsappText: {
    color: '#ffffff',
    fontWeight: typography.fontWeight.bold,
  },
});