import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { MockDataService } from '../../services/mockDataService';
import { useBookingStore } from '../../store/useBookingStore';
import { formatPrice, formatDate, formatTime } from '../../utils/helpers';
import { Card } from '../../components/common/Card';
import { getAvatarSource } from '../../utils/imageHelper';
import { paymentService } from '../../services/backendService';
import { appConfig } from '../../config/appConfig';

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const params = route.params as { lessonId?: string; date?: string; time?: string } | undefined;
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);
  
  const { createBooking } = useBookingStore();
  
  const lessonId = params?.lessonId;
  const lesson = lessonId ? MockDataService.getLessonById(lessonId) : null;
  const instructor = lesson ? MockDataService.getInstructorForLesson(lesson.id) : null;
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [useSavedCard, setUseSavedCard] = useState(true);
  const [savedCard] = useState({ last4: '1234', brand: 'Mastercard' });

  useEffect(() => {
    navigation.setOptions({
      title: t('payment.title'),
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

  const formatCardNumber = (text: string): string => {
    const cleaned = text.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substring(0, 19);
  };

  const formatExpirationDate = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
  };

  const handleExpirationDateChange = (text: string) => {
    const formatted = formatExpirationDate(text);
    setExpirationDate(formatted);
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setCvv(cleaned.substring(0, 3));
  };

  const handlePayment = async () => {
    if (!lesson || !params?.date || !params?.time) return;

    // Validate form if not using saved card
    if (!useSavedCard) {
      if (!cardNumber || !cardholderName || !expirationDate || !cvv) {
        // Show error - in real app, show alert
        return;
      }
    }

    try {
      // Process payment using backend service
      const paymentResult = await paymentService.processPayment(
        lesson.price,
        instructor?.currency || 'USD',
        useSavedCard ? 'saved_card' : cardNumber.replace(/\s/g, '')
      );

      if (paymentResult.success) {
        // Create booking
        const booking = createBooking(lesson.id, params.date, params.time, lesson.price);
        
        // Navigate back or to success screen
        navigation.goBack();
      } else {
        // Show error message
        console.error('Payment failed:', paymentResult.error);
        // In real app, show alert to user
      }
    } catch (error) {
      console.error('Payment error:', error);
      // In real app, show alert to user
    }
  };

  if (!lesson) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: palette.text.primary }]}>{t('payment.lessonNotFound')}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{t('payment.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalAmount = lesson.price;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: palette.background }]} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Lesson Summary Card */}
        <View style={styles.section}>
          <Card style={styles.lessonCard}>
            <View style={styles.lessonCardContent}>
              <Image
                source={getAvatarSource(instructor?.avatar, instructor?.id)}
                style={styles.instructorAvatar}
              />
              <View style={styles.lessonInfo}>
                <Text style={[styles.lessonTitle, { color: palette.text.primary }]} numberOfLines={1}>
                  {lesson.title}
                </Text>
                <Text style={[styles.lessonDetails, { color: palette.text.secondary }]} numberOfLines={2}>
                  {t('payment.teacher')}: {instructor?.name || t('studentHome.unknown')} | {params?.date ? formatDate(params.date) : ''}, {params?.time || ''}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Payment Details Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('payment.paymentDetails')}</Text>
          <Card style={styles.paymentDetailsCard}>
            <View style={[styles.paymentRow, { borderBottomColor: palette.border }]}>
              <Text style={[styles.paymentLabel, { color: palette.text.secondary }]}>{t('payment.lessonFee')}</Text>
              <Text style={[styles.paymentValue, { color: palette.text.primary }]}>{formatPrice(lesson.price, instructor?.currency || 'USD')}</Text>
            </View>
            <View style={[styles.paymentRow, styles.paymentRowTotal]}>
              <Text style={[styles.paymentLabelTotal, { color: palette.text.primary }]}>{t('payment.totalAmount')}</Text>
              <Text style={[styles.paymentValueTotal, { color: palette.text.primary }]}>{formatPrice(totalAmount, instructor?.currency || 'USD')}</Text>
            </View>
          </Card>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          {useSavedCard ? (
            <Card style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodContent}>
                <View style={styles.paymentMethodLeft}>
                  <View style={styles.cardBrandIcon}>
                    <MaterialIcons name="credit-card" size={24} color={colors.student.primary} />
                  </View>
                  <Text style={[styles.savedCardText, { color: palette.text.primary }]}>
                    {savedCard.brand} **** {savedCard.last4}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setUseSavedCard(false)}>
                  <Text style={styles.changeButton}>{t('payment.change')}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <>
              {/* Credit Card Input Form */}
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: palette.text.secondary }]}>{t('payment.cardholderName')}</Text>
                  <TextInput
                    style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                    placeholder={t('payment.cardholderNamePlaceholder')}
                    placeholderTextColor={palette.text.secondary}
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: palette.text.secondary }]}>{t('payment.cardNumber')}</Text>
                  <TextInput
                    style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                    placeholder={t('payment.cardNumberPlaceholder')}
                    placeholderTextColor={palette.text.secondary}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={[styles.label, { color: palette.text.secondary }]}>{t('payment.expirationDate')}</Text>
                    <TextInput
                      style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                      placeholder={t('payment.expirationDatePlaceholder')}
                      placeholderTextColor={palette.text.secondary}
                      value={expirationDate}
                      onChangeText={handleExpirationDateChange}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={[styles.label, { color: palette.text.secondary }]}>{t('payment.cvv')}</Text>
                    <TextInput
                      style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                      placeholder={t('payment.cvvPlaceholder')}
                      placeholderTextColor={palette.text.secondary}
                      value={cvv}
                      onChangeText={handleCvvChange}
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>

              {/* Save Card Toggle */}
              <View style={styles.saveCardContainer}>
                <Switch
                  value={saveCard}
                  onValueChange={setSaveCard}
                  trackColor={{ false: palette.border, true: colors.student.primary }}
                  thumbColor="#ffffff"
                />
                <Text style={[styles.saveCardText, { color: palette.text.primary }]}>
                  {t('payment.saveCard')}
                </Text>
              </View>

              {/* Use Saved Card Option */}
              <TouchableOpacity 
                style={styles.useSavedCardButton}
                onPress={() => setUseSavedCard(true)}
              >
                <Text style={styles.useSavedCardText}>
                  {t('payment.useSavedCard')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA Bar */}
      <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
        <View style={styles.securityMessage}>
          <MaterialIcons name="lock" size={16} color={palette.text.secondary} />
          <Text style={[styles.securityText, { color: palette.text.secondary }]}>
            {t('payment.securityMessage')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          activeOpacity={0.8}
        >
          <Text style={styles.payButtonText}>
            {formatPrice(totalAmount, instructor?.currency || 'USD')} {t('payment.pay')}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    letterSpacing: -0.015,
  },
  lessonCard: {
    marginBottom: 0,
  },
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  instructorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  lessonTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  lessonDetails: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  paymentDetailsCard: {
    marginBottom: 0,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  paymentRowTotal: {
    borderBottomWidth: 0,
    paddingTop: spacing.md,
    paddingBottom: 0,
  },
  paymentLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  paymentValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  paymentLabelTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  paymentValueTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  paymentMethodCard: {
    marginBottom: 0,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  cardBrandIcon: {
    width: 40,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    flex: 1,
  },
  changeButton: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.student.primary,
  },
  formSection: {
    gap: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  input: {
    width: '100%',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    ...shadows.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  saveCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  saveCardText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    flex: 1,
  },
  useSavedCardButton: {
    marginTop: spacing.sm,
  },
  useSavedCardText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.student.primary,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
  },
  securityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
  },
  payButton: {
    width: '100%',
    backgroundColor: colors.student.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  payButtonText: {
    fontSize: typography.fontSize.base,
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

