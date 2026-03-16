import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, borderRadius, typography, spacing, shadows } from '../../utils/theme';
import * as Location from 'expo-location';
import { useAuthStore } from '../../store/useAuthStore';
import { useLessonStore } from '../../store/useLessonStore';
import { safeReverseGeocode } from '../../utils/locationHelper';

interface LocationSoftPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onManualSelect: () => void;
}

export const LocationSoftPromptModal: React.FC<LocationSoftPromptModalProps> = ({
  visible,
  onClose,
  onManualSelect,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { updateUserLocation } = useAuthStore();
  const { setSelectedCity } = useLessonStore();

  const handleGrantPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLoading(false);
        onManualSelect();
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const cityObj = await safeReverseGeocode(location.coords.latitude, location.coords.longitude);
      
      if (cityObj && cityObj.city) {
        await updateUserLocation(cityObj.city, cityObj.country || 'Türkiye', true);
        setSelectedCity(cityObj.city);
        onClose();
      } else {
        onManualSelect();
      }
    } catch (error) {
      console.warn('Location permission error:', error);
      onManualSelect();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="location-pin" size={48} color={colors.student.primary} />
          </View>
          
          <Text style={styles.title}>{t('location.softPrompt.title', 'Sana En Yakın Dans Kurslarını Bulalım')}</Text>
          <Text style={styles.description}>
            {t('location.softPrompt.description', 'Bulunduğun şehirdeki en iyi dans okulları ve eğitmenlerle tanışmak için konumunu paylaş.')}
          </Text>

          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.buttonDisabled]} 
              onPress={handleGrantPermission}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? t('common.loading', 'Yükleniyor...') : t('location.softPrompt.grant', 'Konumumu Kullan')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onManualSelect} disabled={loading}>
              <Text style={styles.secondaryButtonText}>{t('location.softPrompt.manual', 'Şehrimi Kendim Seçeceğim')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.student.card.light,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    ...shadows.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.student.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.student.text.secondaryLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  actionContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.student.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.student.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});
