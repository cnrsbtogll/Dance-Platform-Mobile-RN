import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/common/Card';
import { Lesson } from '../../types';
import { FirestoreService } from '../../services/firebase/firestore';

type TabType = 'active' | 'past';

export const SchoolLessonsScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const params = (route.params as any);
    const [activeTab, setActiveTab] = useState<TabType>(params?.initialTab ?? 'active');
    const { isDarkMode } = useThemeStore();
    const palette = getPalette('school', isDarkMode);

    const [schoolLessons, setSchoolLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchLessons = async () => {
                if (!user || (user.role !== 'school' && user.role !== 'draft-school')) {
                    setSchoolLessons([]);
                    setLoading(false);
                    return;
                }

                try {
                    setLoading(true);
                    const lessons = await FirestoreService.getLessonsBySchool(user.id);
                    setSchoolLessons(lessons);
                } catch (error) {
                    console.error('Error fetching school lessons:', error);
                    setSchoolLessons([]);
                } finally {
                    setLoading(false);
                }
            };

            fetchLessons();
        }, [user])
    );

    const lessonsWithStats = useMemo(() => {
        return schoolLessons.map(lesson => ({
            ...lesson,
            studentCount: lesson.currentParticipants || lesson.participantStats?.total || 0,
            averageRating: lesson.rating || 0,
        }));
    }, [schoolLessons]);

    const activeLessons = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return lessonsWithStats.filter(lesson => {
            if (!lesson.isActive) return false;
            if (lesson.date && lesson.date < today) return false;
            return true;
        });
    }, [lessonsWithStats]);

    const pastLessons = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return lessonsWithStats.filter(lesson => {
            if (!lesson.isActive) return true;
            if (lesson.date && lesson.date < today) return true;
            return false;
        });
    }, [lessonsWithStats]);

    const displayedLessons = activeTab === 'active' ? activeLessons : pastLessons;

    React.useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTitle: t('lessons.myLessons'),
            headerStyle: { backgroundColor: palette.background },
            headerTitleStyle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: palette.text.primary },
            headerTintColor: palette.text.primary,
            headerLeft: () => (
                <View style={[styles.badge, { backgroundColor: colors.school.primary }]}>
                    <Text style={styles.badgeText}>{t('school.badge') || 'OKUL'}</Text>
                </View>
            ),
            headerRight: () => (
                <TouchableOpacity
                    style={{ marginRight: spacing.md }}
                    onPress={() => (navigation as any).navigate('CreateLesson')}
                >
                    <MaterialIcons name="add" size={28} color={palette.text.primary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, isDarkMode, t, palette]);

    const handleToggleStatus = async (lesson: Lesson) => {
        if (user?.role !== 'school') {
            Alert.alert(
                t('becomeSchool.underReview') || 'Başvurunuz İncelemede',
                'Okulunuz onaylanana kadar kursları aktifleştiremezsiniz.',
                [{ text: t('common.ok') }]
            );
            return;
        }

        try {
            const newActiveState = !lesson.isActive;
            setSchoolLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, isActive: newActiveState, status: newActiveState ? 'active' : 'inactive' } : l));
            await FirestoreService.updateLesson(lesson.id, { isActive: newActiveState, status: newActiveState ? 'active' : 'inactive' });
        } catch (error) {
            console.error('Error updating lesson status:', error);
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
                            style={[styles.statusToggle, { backgroundColor: lesson.isActive ? colors.general.warning : colors.general.success }]}
                            onPress={() => handleToggleStatus(lesson)}
                        >
                            <Text style={styles.statusToggleText}>
                                {lesson.isActive ? t('lessons.deactivateLesson') : t('lessons.activateLesson')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => (navigation as any).navigate('EditLesson', { lessonId: lesson.id })}
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
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: palette.background }]}>
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, { backgroundColor: palette.card }, activeTab === 'active' && { backgroundColor: colors.school.primary }]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, { color: palette.text.primary }, activeTab === 'active' && styles.tabTextActive]}>
                        {t('lessons.activeLessons')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, { backgroundColor: palette.card }, activeTab === 'past' && { backgroundColor: colors.school.primary }]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, { color: palette.text.primary }, activeTab === 'past' && styles.tabTextActive]}>
                        {t('lessons.inactiveLessons')}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {displayedLessons.length > 0 ? (
                    <View style={styles.lessonsList}>
                        {displayedLessons.map(lesson => renderLessonCard(lesson))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="business" size={64} color={palette.text.secondary} />
                        <Text style={[styles.emptyStateText, { color: palette.text.secondary }]}>
                            {activeTab === 'active' ? (t('lessons.noActiveLessons') || 'Aktif kurs bulunamadı') : (t('lessons.noInactiveLessons') || 'Geçmiş kurs bulunamadı')}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, marginLeft: spacing.sm },
    badgeText: { fontSize: 10, fontWeight: 'bold', color: '#ffffff' },
    tabsContainer: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
    tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
    tabText: { fontSize: typography.fontSize.base, fontWeight: '500' },
    tabTextActive: { color: '#ffffff', fontWeight: 'bold' },
    scrollView: { flex: 1 },
    lessonsList: { padding: spacing.md, gap: spacing.md },
    lessonCard: { padding: spacing.md, ...shadows.md },
    lessonCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
    lessonTitle: { flex: 1, fontSize: typography.fontSize.base, fontWeight: 'bold' },
    lessonActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    statusToggle: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    statusToggleText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    actionButton: { padding: 4 },
    lessonStatus: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusDotActive: { backgroundColor: '#10B981' },
    statusText: { fontSize: 12, fontWeight: '500' },
    statusTextActive: { color: '#10B981' },
    lessonStats: { flexDirection: 'row', gap: spacing.md },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    statText: { fontSize: 12 },
    emptyState: { padding: 60, alignItems: 'center' },
    emptyStateText: { marginTop: 10, fontSize: 14 },
});
