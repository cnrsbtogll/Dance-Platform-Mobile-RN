import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { MockDataService } from '../../services/mockDataService';
import { formatDate, formatTime, getDurationText } from '../../utils/helpers';
import { useLessonStore } from '../../store/useLessonStore';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuthStore } from '../../store/useAuthStore';

export const LessonDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { lessonId?: string; bookingId?: string; isInstructor?: boolean } | undefined;
  const lessonId = params?.lessonId;
  const bookingId = params?.bookingId;
  const isInstructor = params?.isInstructor || false;
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);
  
  const { toggleFavorite, favoriteLessons } = useLessonStore();
  const { createBooking } = useBookingStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const lesson = MockDataService.getLessonById(lessonId || '');
  const instructor = lesson ? MockDataService.getInstructorForLesson(lesson.id) : null;
  const booking = bookingId ? MockDataService.getBookingById(bookingId) : null;
  
  const isFavorite = lesson ? favoriteLessons.includes(lesson.id) : false;
  const [isRegistered, setIsRegistered] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(false);
  const isOwnLesson = isInstructor && lesson && user && lesson.instructorId === user.id;

  // Check if user logged in after clicking register button
  useFocusEffect(
    React.useCallback(() => {
      if (pendingRegistration && isAuthenticated && user && lesson) {
        // User logged in, navigate to payment screen
        setPendingRegistration(false);
        (navigation as any).navigate('Payment', {
          lessonId: lesson.id,
          date: new Date().toISOString().split('T')[0],
          time: '18:00',
        });
      }
    }, [isAuthenticated, user, pendingRegistration, lesson, navigation])
  );

  if (!lesson) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: palette.text.secondary }]}>Ders bulunamadı</Text>
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
    
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      // Set pending registration flag and navigate to login screen
      setPendingRegistration(true);
      (navigation as any).navigate('Login');
      return;
    }
    
    // Navigate to payment screen
    (navigation as any).navigate('Payment', {
      lessonId: lesson.id,
      date: new Date().toISOString().split('T')[0], // Default to today, in real app get from date picker
      time: '18:00', // Default time, in real app get from time picker
    });
  };

  const handleEdit = () => {
    (navigation as any).navigate('EditLesson', { lessonId: lesson?.id });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView style={[styles.scrollView, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
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
            <View style={[styles.infoCard, { backgroundColor: palette.card }]}>
              <MaterialIcons name="calendar-today" size={32} color={colors.student.primary} />
              <Text style={[styles.infoCardLabel, { color: palette.text.primary }]}>Tarih</Text>
              <Text style={[styles.infoCardValue, { color: palette.text.secondary }]}>
                {booking ? `${formatDate(booking.date)}` : 'Belirtilmemiş'}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: palette.card }]}>
              <MaterialIcons name="schedule" size={32} color={colors.student.primary} />
              <Text style={[styles.infoCardLabel, { color: palette.text.primary }]}>Saat</Text>
              <Text style={[styles.infoCardValue, { color: palette.text.secondary }]}>
                {booking ? formatTime(booking.time) : 'Belirtilmemiş'}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: palette.card }]}>
              <MaterialIcons name="hourglass-empty" size={32} color={colors.student.primary} />
              <Text style={[styles.infoCardLabel, { color: palette.text.primary }]}>Süre</Text>
              <Text style={[styles.infoCardValue, { color: palette.text.secondary }]}>{getDurationText(lesson.duration)}</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>Ders Açıklaması</Text>
            <Text style={[styles.descriptionText, { color: palette.text.secondary }]}>{lesson.description}</Text>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>Konum</Text>
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={24} color={colors.student.primary} />
              <View style={styles.locationTextContainer}>
                <Text style={[styles.locationName, { color: palette.text.primary }]}>Dans Stüdyosu A</Text>
                <Text style={[styles.locationAddress, { color: palette.text.secondary }]}>
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
      {isOwnLesson ? (
        <SafeAreaView edges={['bottom']} style={[styles.bottomBarContainer, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.registerButton, { marginLeft: 0, flex: 1 }]}
              onPress={handleEdit}
            >
              <LinearGradient
                colors={[colors.instructor.secondary, colors.instructor.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButtonGradient}
              >
                <MaterialIcons name="edit" size={20} color="#ffffff" style={{ marginRight: spacing.xs }} />
                <Text style={styles.registerButtonText}>Dersi Düzenle</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView edges={['bottom']} style={[styles.bottomBarContainer, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
          <View style={styles.bottomBar}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceLabel, { color: palette.text.secondary }]}>Ücret</Text>
            <Text style={[styles.priceValue, { color: colors.student.primary }]}>₺{lesson.price.toLocaleString('tr-TR')}</Text>
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
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  infoCardLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  infoCardValue: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
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
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: typography.fontSize.sm,
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
    borderTopWidth: 1,
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
  },
  priceValue: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
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
    flexDirection: 'row',
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
    marginBottom: spacing.md,
  },
  backButton: {
    fontSize: typography.fontSize.base,
    color: colors.student.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

