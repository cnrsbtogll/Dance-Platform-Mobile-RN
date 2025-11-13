import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { MockDataService } from '../../services/mockDataService';
import { Card } from '../../components/common/Card';
import { Lesson } from '../../types';

type TabType = 'active' | 'past';

export const InstructorLessonsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const instructorLessons = useMemo(() => {
    if (!user || user.role !== 'instructor') return [];
    return MockDataService.getLessonsByInstructor(user.id);
  }, [user]);

  // Get bookings for each lesson to calculate student count
  const lessonsWithStats = useMemo(() => {
    return instructorLessons.map(lesson => {
      const bookings = MockDataService.getBookingsByLesson(lesson.id);
      const reviews = MockDataService.getReviewsByLesson(lesson.id);
      
      const studentCount = new Set(bookings.map(b => b.studentId)).size;
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      return {
        ...lesson,
        studentCount,
        averageRating,
      };
    });
  }, [instructorLessons]);

  const activeLessons = useMemo(() => {
    return lessonsWithStats.filter(lesson => lesson.isActive);
  }, [lessonsWithStats]);

  const pastLessons = useMemo(() => {
    return lessonsWithStats.filter(lesson => !lesson.isActive);
  }, [lessonsWithStats]);

  const displayedLessons = activeTab === 'active' ? activeLessons : pastLessons;

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Derslerim',
      headerStyle: {
        backgroundColor: colors.instructor.background.light,
      },
      headerTitleStyle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.instructor.text.lightPrimary,
      },
      headerTintColor: colors.instructor.text.lightPrimary,
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: spacing.md }}
          onPress={() => {
            (navigation as any).navigate('CreateLesson');
          }}
        >
          <MaterialIcons
            name="add"
            size={28}
            color={colors.instructor.text.lightPrimary}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleEdit = (lesson: Lesson) => {
    (navigation as any).navigate('EditLesson', {
      lessonId: lesson.id,
    });
  };

  const handleDelete = (lesson: Lesson) => {
    // TODO: Implement delete functionality
    console.log('Delete lesson:', lesson.id);
  };

  const renderLessonCard = (lesson: Lesson & { studentCount: number; averageRating: number }) => (
    <Card key={lesson.id} style={styles.lessonCard}>
      <View style={styles.lessonCardHeader}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <View style={styles.lessonActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(lesson)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="edit" size={20} color={colors.instructor.text.lightSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(lesson)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="delete" size={20} color={colors.instructor.text.lightSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.lessonStatus}>
        <View style={[styles.statusDot, lesson.isActive && styles.statusDotActive]} />
        <Text style={[styles.statusText, lesson.isActive && styles.statusTextActive]}>
          {lesson.isActive ? 'Aktif' : 'Pasif'}
        </Text>
      </View>

      <View style={styles.lessonStats}>
        <View style={styles.statItem}>
          <MaterialIcons name="people" size={18} color={colors.instructor.text.lightSecondary} />
          <Text style={styles.statText}>{lesson.studentCount} Kayıtlı Öğrenci</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="star" size={18} color="#FFB800" />
          <Text style={styles.statText}>{lesson.averageRating.toFixed(1)} Ortalama Puan</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Aktif Dersler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Geçmiş Dersler
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lessons List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {displayedLessons.length > 0 ? (
          <View style={styles.lessonsList}>
            {displayedLessons.map(lesson => renderLessonCard(lesson))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="school"
              size={64}
              color={colors.instructor.text.lightSecondary}
            />
            <Text style={styles.emptyStateText}>
              {activeTab === 'active' ? 'Aktif ders bulunmuyor' : 'Geçmiş ders bulunmuyor'}
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
    backgroundColor: colors.instructor.background.light,
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
    backgroundColor: colors.instructor.card.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.instructor.secondary,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.instructor.text.lightPrimary,
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
    color: colors.instructor.text.lightPrimary,
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
    backgroundColor: colors.instructor.text.lightSecondary,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.instructor.text.lightSecondary,
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
    color: colors.instructor.text.lightSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.instructor.text.lightSecondary,
    marginTop: spacing.md,
  },
});

