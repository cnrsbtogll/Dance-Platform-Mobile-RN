import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { MockDataService } from '../../services/mockDataService';
import { formatDate, formatTime, getDurationText } from '../../utils/helpers';
import { useLessonStore } from '../../store/useLessonStore';
import { useBookingStore } from '../../store/useBookingStore';

export const LessonDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { lessonId?: string; bookingId?: string } | undefined;
  const lessonId = params?.lessonId;
  const bookingId = params?.bookingId;
  const insets = useSafeAreaInsets();
  
  const { toggleFavorite, favoriteLessons } = useLessonStore();
  const { createBooking } = useBookingStore();
  
  const lesson = MockDataService.getLessonById(lessonId || '');
  const instructor = lesson ? MockDataService.getInstructorForLesson(lesson.id) : null;
  const booking = bookingId ? MockDataService.getBookingById(bookingId) : null;
  
  const isFavorite = lesson ? favoriteLessons.includes(lesson.id) : false;
  const [isRegistered, setIsRegistered] = useState(false);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ders bulunamadı</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleRegister = () => {
    if (booking || isRegistered) {
      // Already registered
      return;
    }
    
    // Navigate to payment screen
    (navigation as any).navigate('Payment', {
      lessonId: lesson.id,
      date: new Date().toISOString().split('T')[0], // Default to today, in real app get from date picker
      time: '18:00', // Default time, in real app get from time picker
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          {lesson.imageUrl && (
            <Image
              source={{ uri: lesson.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradientOverlay}
          />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back-ios-new" size={20} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => lesson && toggleFavorite(lesson.id)}
              >
                <MaterialIcons
                  name={isFavorite ? "favorite" : "favorite-border"}
                  size={20}
                  color="#ffffff"
                />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerButton, styles.headerButtonMargin]}>
                <MaterialIcons name="share" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title Overlay */}
          <View style={styles.titleOverlay}>
            <Text style={styles.heroTitle}>{lesson.title}</Text>
            <Text style={styles.heroInstructor}>Eğitmen: {instructor?.name || 'Bilinmiyor'}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <MaterialIcons name="calendar-today" size={32} color={colors.student.primary} />
              <Text style={styles.infoCardLabel}>Tarih</Text>
              <Text style={styles.infoCardValue}>
                {booking ? `${formatDate(booking.date)}` : 'Belirtilmemiş'}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <MaterialIcons name="schedule" size={32} color={colors.student.primary} />
              <Text style={styles.infoCardLabel}>Saat</Text>
              <Text style={styles.infoCardValue}>
                {booking ? formatTime(booking.time) : 'Belirtilmemiş'}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <MaterialIcons name="hourglass-empty" size={32} color={colors.student.primary} />
              <Text style={styles.infoCardLabel}>Süre</Text>
              <Text style={styles.infoCardValue}>{getDurationText(lesson.duration)}</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ders Açıklaması</Text>
            <Text style={styles.descriptionText}>{lesson.description}</Text>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Konum</Text>
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={24} color={colors.student.primary} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationName}>Dans Stüdyosu A</Text>
                <Text style={styles.locationAddress}>
                  Merkez Mah. Sanat Sk. No:12, Beşiktaş/İstanbul
                </Text>
              </View>
            </View>
            <View style={styles.mapContainer}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdlKSrjSVNaws68X6Mj1wmNS4eTBkffsjaEQpAM66SAJwU6d2aTkwdmJ_FiNH__z1BzgxangkJH8tCrYxzMyiIpeDzj4_8EfiBVAl61zDO3oboPKjMgMkcdTFDkngMdK7BuzchBo1SJaQMGWjwGMBjjRRgBLw6tpwcU7C6q1Wj_WSViCjrsDaZRPShHonoPLVDni-BJVBvYq73a7jwf96AX8j6d19tjIPV5sj4r_-X39wu2ta5fpdF4TnwxYKJ6siZVRfUWyPV1uyb' }}
                style={styles.mapImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Bottom spacing for fixed bar */}
          <View style={{ height: 80 + insets.bottom }} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBarContainer}>
        <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Ücret</Text>
          <Text style={styles.priceValue}>₺{lesson.price.toLocaleString('tr-TR')}</Text>
        </View>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={isRegistered || !!booking}
        >
          <LinearGradient
            colors={['#4A90E2', '#5BA3F5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.registerButtonGradient}
          >
            <Text style={styles.registerButtonText}>
              {booking || isRegistered ? 'Kayıtlı' : 'Derse Kaydol'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.student.background.light,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 288,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonMargin: {
    marginLeft: spacing.sm,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    zIndex: 10,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
    lineHeight: 36,
  },
  heroInstructor: {
    fontSize: typography.fontSize.lg,
    color: '#ffffff',
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  infoCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.student.card.light,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  infoCardLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.student.text.primaryLight,
    marginTop: spacing.xs,
  },
  infoCardValue: {
    fontSize: typography.fontSize.xs,
    color: colors.student.text.secondaryLight,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    color: colors.student.text.secondaryLight,
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.student.text.primaryLight,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.student.text.secondaryLight,
  },
  mapContainer: {
    height: 160,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.student.background.light,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.student.text.secondaryLight,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.primary,
  },
  registerButton: {
    flex: 1,
    marginLeft: spacing.md,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.lg,
  },
  registerButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.student.text.secondaryLight,
    marginBottom: spacing.md,
  },
  backButton: {
    fontSize: typography.fontSize.base,
    color: colors.student.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

