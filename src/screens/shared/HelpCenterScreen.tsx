import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/common/Card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Mock FAQ data
const mockFAQs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I book a lesson?',
    answer: 'You can browse available lessons on the home screen, tap on a lesson to view details, and then tap "Register for Lesson" to book.',
  },
  {
    id: '2',
    question: 'How do I become an instructor?',
    answer: 'Go to your profile, tap "Become an Instructor", create an account if needed, and contact us via WhatsApp to complete the registration process.',
  },
  {
    id: '3',
    question: 'How do I cancel a booking?',
    answer: 'Go to "My Lessons", find the lesson you want to cancel, and tap the cancel button. Please note that cancellation policies may apply.',
  },
  {
    id: '4',
    question: 'How do I change my password?',
    answer: 'Go to your profile, tap "Account Settings", then "Change Password". Enter your current password and your new password.',
  },
  {
    id: '5',
    question: 'How do I contact support?',
    answer: 'You can contact us via WhatsApp using the contact information in the app, or email us at support@danceplatform.com',
  },
];

export const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette(user?.role || 'student', isDarkMode);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    navigation.setOptions({
      headerTitle: t('profile.helpCenter'),
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
  }, [navigation, isDarkMode, palette, t, user?.role]);

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: palette.background }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('helpCenter.frequentlyAskedQuestions')}
          </Text>
          <Text style={[styles.sectionDescription, { color: palette.text.secondary }]}>
            {t('helpCenter.findAnswers')}
          </Text>

          {mockFAQs.map((faq) => {
            const isExpanded = expandedItems.has(faq.id);
            return (
              <Card key={faq.id} style={[styles.faqCard, { backgroundColor: palette.card }]}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleItem(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.faqQuestion, { color: palette.text.primary }]} numberOfLines={2}>
                    {faq.question}
                  </Text>
                  <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={24}
                    color={palette.text.secondary}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={[styles.faqAnswerContainer, { borderTopColor: palette.border }]}>
                    <Text style={[styles.faqAnswer, { color: palette.text.secondary }]}>
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        {/* Contact Support */}
        <View style={styles.contactSection}>
          <Text style={[styles.contactTitle, { color: palette.text.primary }]}>
            {t('helpCenter.stillNeedHelp')}
          </Text>
          <Text style={[styles.contactDescription, { color: palette.text.secondary }]}>
            {t('helpCenter.contactSupport')}
          </Text>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.student.primary }]}
            activeOpacity={0.8}
          >
            <MaterialIcons name="support-agent" size={20} color="#ffffff" />
            <Text style={styles.contactButtonText}>
              {t('helpCenter.contactUs')}
            </Text>
          </TouchableOpacity>
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
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    letterSpacing: -0.015,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  faqCard: {
    marginBottom: spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  faqAnswerContainer: {
    borderTopWidth: 1,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  faqAnswer: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: 20,
  },
  contactSection: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  contactDescription: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    minWidth: 200,
  },
  contactButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
});

