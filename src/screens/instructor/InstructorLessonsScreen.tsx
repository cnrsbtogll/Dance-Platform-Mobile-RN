import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { MockDataService } from '../../services/mockDataService';
import { Card } from '../../components/common/Card';
import { Lesson } from '../../types';
import { FirestoreService } from '../../services/firebase/firestore';

type TabType = 'active' | 'past';

export const InstructorLessonsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const params = (route.params as any);
  const [activeTab, setActiveTab] = useState<TabType>(params?.initialTab ?? 'active');
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('instructor', isDarkMode);

  // State for lessons
  const [instructorLessons, setInstructorLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch lessons from Firestore when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchLessons = async () => {
        if (!user || (user.role !== 'instructor' && user.role !== 'draft-instructor')) {
          setInstructorLessons([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const lessons = await FirestoreService.getLessonsByInstructor(user.id);
          setInstructorLessons(lessons);
        } catch (error) {
          console.error('Error fetching instructor lessons:', error);
          setInstructorLessons([]);
        } finally {
          setLoading(false);
        }
      };

      fetchLessons();
    }, [user])
  );

  // Lessons with stats (stats currently mocked/simplified until Firestore bookings/reviews are implemented)
  const lessonsWithStats = useMemo(() => {
    return instructorLessons.map(lesson => {
      // TODO: Implement Firestore service for bookings and reviews
      const studentCount = lesson.currentParticipants || lesson.participantStats?.total || 0;
      const averageRating = lesson.rating || 0;

      return {
        ...lesson,
        studentCount,
        averageRating,
      };
    });
  }, [instructorLessons]);

  const activeLessons = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return lessonsWithStats.filter(lesson => {
      // Must be active
      if (!lesson.isActive) return false;
      // If date exists, must be today or future
      if (lesson.date && lesson.date < today) return false;
      return true;
    });
  }, [lessonsWithStats]);

  const pastLessons = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return lessonsWithStats.filter(lesson => {
      // Either explicitly inactive OR date is in past
      if (!lesson.isActive) return true;
      if (lesson.date && lesson.date < today) return true;
      return false;
    });
  }, [lessonsWithStats]);

  const displayedLessons = activeTab === 'active' ? activeLessons : pastLessons;

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: t('lessons.myLessons'),
      headerStyle: {
        backgroundColor: palette.background,
      },
      headerTitleStyle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: palette.text.primary,
      },
      headerTintColor: palette.text.primary,
      headerLeft: () => (
        <View style={{
          backgroundColor: palette.secondary,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: borderRadius.full,
          marginLeft: spacing.sm,
        }}>
          <Text style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.bold,
            color: '#ffffff',
          }}>
            {t('instructor.badge')}
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: spacing.md }}
          onPress={() => {
            console.log('[InstructorLessons] Header Add clicked. User:', user?.id, 'onboardingCompleted:', user?.onboardingCompleted);
            if (user && !user.onboardingCompleted) {
              Alert.alert(
                t('instructor.profileIncomplete') || 'Profiliniz Eksik',
                t('instructor.completeProfileBeforeLesson') || 'Ders oluşturabilmek için önce eğitmen profilinizi tamamlamanız gerekmektedir.',
                [{
                  text: t('common.ok'),
                  onPress: () => {
                    // @ts-ignore
                    navigation.navigate('InstructorOnboarding');
                  }
                }]
              );
            } else {
              (navigation as any).navigate('CreateLesson');
            }
          }}
        >
          <MaterialIcons
            name="add"
            size={28}
            color={palette.text.primary}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isDarkMode, t]);



  const handleEdit = (lesson: Lesson) => {
    (navigation as any).navigate('EditLesson', {
      lessonId: lesson.id,
    });
  };

  const handleToggleStatus = async (lesson: Lesson) => {
    if (user?.role !== 'instructor') {
      Alert.alert(
        t('instructor.verificationRequired') || 'Kimlik Doğrulaması Gerekiyor',
        t('instructor.verificationDesc') || 'Derslerinizi yayınlayabilmek için onaylanmış bir eğitmen olmanız gerekmektedir. Şimdi belge yüklemek ister misiniz?',
        [{
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('instructor.verifyNow') || 'Hemen Doğrula',
          onPress: () => {
            // @ts-ignore
            navigation.navigate('Verification');
          }
        }]
      );
      return;
    }

    try {
      const newActiveState = !lesson.isActive;

      // Optimistic update
      setInstructorLessons(prev =>
        prev.map(l => l.id === lesson.id ? { ...l, isActive: newActiveState, status: newActiveState ? 'active' : 'inactive' } : l)
      );

      await FirestoreService.updateLesson(lesson.id, {
        isActive: newActiveState,
        status: newActiveState ? 'active' : 'inactive'
      });
    } catch (error) {
      console.error('Error updating lesson status:', error);
      // Revert optimization
      setInstructorLessons(prev =>
        prev.map(l => l.id === lesson.id ? { ...l, isActive: !lesson.isActive, status: !lesson.isActive ? 'active' : 'inactive' } : l)
      );
      Alert.alert(t('common.error'), 'Error updating status');
    }
  };

  const renderLessonCard = (lesson: Lesson & { studentCount: number; averageRating: number }) => (
    <TouchableOpacity
      key={lesson.id}
      onPress={() => (navigation as any).navigate('LessonDetail', { lessonId: lesson.id, isInstructor: true })}
      activeOpacity={0.9}
    >
      <Card style={styles.lessonCard}>
        <View style={styles.lessonCardHeader}>
          <Text style={[styles.lessonTitle, { color: palette.text.primary }]}>{lesson.title}</Text>
          <View style={styles.lessonActions}>
            <TouchableOpacity
              style={{
                backgroundColor: lesson.isActive ? colors.general.warning : colors.general.success,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
              onPress={() => handleToggleStatus(lesson)}
            >
              <Text style={{
                color: '#fff',
                fontSize: 12,
                fontWeight: '600'
              }}>
                {lesson.isActive ? t('lessons.deactivateLesson') : t('lessons.activateLesson')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(lesson)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="edit" size={20} color={palette.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.lessonStatus}>
          <View style={[styles.statusDot, { backgroundColor: palette.text.secondary }, lesson.isActive && styles.statusDotActive]} />
          <Text style={[styles.statusText, { color: palette.text.secondary }, lesson.isActive && styles.statusTextActive]}>
            {lesson.status === 'draft' ? (t('lessons.draft') || 'Taslak') : (lesson.isActive ? t('lessons.active') : t('lessons.inactive'))}
          </Text>
        </View>

        <View style={styles.lessonStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="people" size={18} color={palette.text.secondary} />
            <Text style={[styles.statText, { color: palette.text.secondary }]}>
              {lesson.studentCount} {t('lessons.registeredStudent')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="star" size={18} color="#FFB800" />
            <Text style={[styles.statText, { color: palette.text.secondary }]}>
              {lesson.averageRating.toFixed(1)} {t('lessons.averageRating')}
            </Text>
          </View>
        </View>
      </Card >
    </TouchableOpacity >
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: palette.card }, activeTab === 'active' && { backgroundColor: palette.secondary }]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: palette.text.primary }, activeTab === 'active' && styles.tabTextActive]}>
            {t('lessons.activeLessons')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: palette.card }, activeTab === 'past' && { backgroundColor: palette.secondary }]}
          onPress={() => setActiveTab('past')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: palette.text.primary }, activeTab === 'past' && styles.tabTextActive]}>
            {t('lessons.inactiveLessons')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lessons List */}
      <ScrollView style={[styles.scrollView, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
        {displayedLessons.length > 0 ? (
          <View style={styles.lessonsList}>
            {displayedLessons.map(lesson => renderLessonCard(lesson))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="school"
              size={64}
              color={palette.text.secondary}
            />
            <Text style={[styles.emptyStateText, { color: palette.text.secondary }]}>
              {activeTab === 'active' ? t('lessons.noActiveLessons') : t('lessons.noInactiveLessons')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {},
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: typography.fontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  lessonsList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  lessonCard: {
    padding: spacing.md,
    ...shadows.md,
  },
  lessonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  lessonTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.sm,
  },
  lessonActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
  lessonStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  statusTextActive: {
    color: '#10B981',
  },
  lessonStats: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.fontSize.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
  },
});

