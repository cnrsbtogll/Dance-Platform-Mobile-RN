import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { MockDataService } from '../../services/mockDataService';
import { formatPrice, formatDate, formatTime } from '../../utils/helpers';
import { Card } from '../../components/common/Card';

export const EarningsDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('instructor', isDarkMode);

  // Get instructor's bookings
  const instructorBookings = useMemo(() => {
    if (!user || user.role !== 'instructor') return [];
    return MockDataService.getBookingsByInstructor(user.id).sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [user]);

  // Calculate monthly earnings (last 6 months)
  const monthlyEarnings = useMemo(() => {
    const months: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    // Calculate earnings per month
    instructorBookings.forEach(booking => {
      const bookingDate = new Date(booking.date);
      const key = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
      if (months.hasOwnProperty(key)) {
        months[key] += booking.price;
      }
    });

    return Object.entries(months).map(([month, earnings]) => ({
      month,
      earnings,
      date: new Date(month + '-01'),
    }));
  }, [instructorBookings]);

  // Calculate total and average
  const totalEarnings = useMemo(() => {
    return instructorBookings.reduce((sum, b) => sum + b.price, 0);
  }, [instructorBookings]);

  const averageEarnings = useMemo(() => {
    return monthlyEarnings.length > 0
      ? monthlyEarnings.reduce((sum, m) => sum + m.earnings, 0) / monthlyEarnings.length
      : 0;
  }, [monthlyEarnings]);

  // Get max earnings for chart scaling
  const maxEarnings = useMemo(() => {
    return Math.max(...monthlyEarnings.map(m => m.earnings), 1);
  }, [monthlyEarnings]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: t('instructorHome.earningsDetails'),
      headerTintColor: palette.text.primary,
      headerStyle: {
        backgroundColor: palette.background,
      },
      headerTitleStyle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: palette.text.primary,
      },
    });
  }, [navigation, isDarkMode, palette, t]);

  const getMonthName = (date: Date): string => {
    const monthNames = [
      t('earnings.jan'), t('earnings.feb'), t('earnings.mar'), t('earnings.apr'),
      t('earnings.may'), t('earnings.jun'), t('earnings.jul'), t('earnings.aug'),
      t('earnings.sep'), t('earnings.oct'), t('earnings.nov'), t('earnings.dec'),
    ];
    return monthNames[date.getMonth()];
  };

  const getStudentName = (studentId: string): string => {
    const student = MockDataService.getUserById(studentId);
    return student?.name || t('studentHome.unknown');
  };

  const getLessonTitle = (lessonId: string): string => {
    const lesson = MockDataService.getLessonById(lessonId);
    return lesson?.title || t('earnings.unknownLesson');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: palette.background }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Card style={[styles.summaryCard, { backgroundColor: palette.card }]}>
              <Text style={[styles.summaryLabel, { color: palette.text.secondary }]}>
                {t('earnings.totalEarnings')}
              </Text>
              <Text style={[styles.summaryValue, { color: palette.text.primary }]}>
                {formatPrice(totalEarnings, user?.currency || 'USD')}
              </Text>
            </Card>
            <Card style={[styles.summaryCard, { backgroundColor: palette.card }]}>
              <Text style={[styles.summaryLabel, { color: palette.text.secondary }]}>
                {t('earnings.averageMonthly')}
              </Text>
              <Text style={[styles.summaryValue, { color: palette.text.primary }]}>
                {formatPrice(averageEarnings, user?.currency || 'USD')}
              </Text>
            </Card>
          </View>
        </View>

        {/* Monthly Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('earnings.monthlyEarnings')}
          </Text>
          <Card style={[styles.chartCard, { backgroundColor: palette.card }]}>
            <View style={styles.chartContainer}>
              {monthlyEarnings.map((item, index) => {
                const barHeight = (item.earnings / maxEarnings) * 100;
                return (
                  <View key={item.month} style={styles.chartBarContainer}>
                    <View style={styles.chartBarWrapper}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${barHeight}%`,
                            backgroundColor: colors.instructor.secondary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartMonthLabel, { color: palette.text.secondary }]}>
                      {getMonthName(item.date).substring(0, 3)}
                    </Text>
                    <Text style={[styles.chartValueLabel, { color: palette.text.primary }]}>
                      {formatPrice(item.earnings, user?.currency || 'USD')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Earnings List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('earnings.recentEarnings')}
          </Text>
          {instructorBookings.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: palette.card }]}>
              <MaterialIcons name="account-balance-wallet" size={48} color={palette.text.secondary} />
              <Text style={[styles.emptyText, { color: palette.text.secondary }]}>
                {t('earnings.noEarnings')}
              </Text>
            </Card>
          ) : (
            instructorBookings.map((booking) => {
              const lesson = MockDataService.getLessonById(booking.lessonId);
              const student = MockDataService.getUserById(booking.studentId);
              
              return (
                <Card key={booking.id} style={[styles.earningItem, { backgroundColor: palette.card }]}>
                  <View style={styles.earningItemContent}>
                    <View style={styles.earningItemLeft}>
                      <View style={[styles.earningIconContainer, { backgroundColor: colors.instructor.secondary + '15' }]}>
                        <MaterialIcons
                          name="account-balance-wallet"
                          size={20}
                          color={colors.instructor.secondary}
                        />
                      </View>
                      <View style={styles.earningItemInfo}>
                        <Text style={[styles.earningLessonTitle, { color: palette.text.primary }]} numberOfLines={1}>
                          {lesson?.title || t('earnings.unknownLesson')}
                        </Text>
                        <Text style={[styles.earningStudentName, { color: palette.text.secondary }]} numberOfLines={1}>
                          {student?.name || t('studentHome.unknown')}
                        </Text>
                        <Text style={[styles.earningDate, { color: palette.text.secondary }]}>
                          {formatDate(booking.date)} • {formatTime(booking.time)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.earningItemRight}>
                      <Text style={[styles.earningAmount, { color: colors.instructor.primary }]}>
                        {formatPrice(booking.price, user?.currency || 'USD')}
                      </Text>
                      <View style={[styles.earningStatusBadge, { backgroundColor: booking.paymentStatus === 'paid' ? '#10B981' + '20' : '#F59E0B' + '20' }]}>
                        <Text style={[styles.earningStatusText, { color: booking.paymentStatus === 'paid' ? '#10B981' : '#F59E0B' }]}>
                          {booking.paymentStatus === 'paid' ? t('earnings.paid') : t('earnings.pending')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
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
  summarySection: {
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    letterSpacing: -0.015,
  },
  chartCard: {
    padding: spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    gap: spacing.xs,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  chartBarWrapper: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: borderRadius.sm,
    minHeight: 4,
  },
  chartMonthLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  chartValueLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
  },
  earningItem: {
    marginBottom: spacing.sm,
  },
  earningItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  earningItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  earningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningItemInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  earningLessonTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  earningStudentName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  earningDate: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
  },
  earningItemRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  earningAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  earningStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  earningStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    textAlign: 'center',
  },
});

