import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { MockDataService } from '../../services/mockDataService';
import { useBookingStore } from '../../store/useBookingStore';
import { formatPrice, formatDate, formatTime } from '../../utils/helpers';
import { Card } from '../../components/common/Card';

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { lessonId?: string; date?: string; time?: string } | undefined;
  const insets = useSafeAreaInsets();
  
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
      title: 'Ödeme Ekranı',
      headerTintColor: colors.student.text.primaryLight,
      headerStyle: {
        backgroundColor: colors.student.background.light,
      },
      headerTitleStyle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.student.text.primaryLight,
      },
    });
  }, [navigation]);

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

  const handlePayment = () => {
    if (!lesson || !params?.date || !params?.time) return;

    // Validate form if not using saved card
    if (!useSavedCard) {
      if (!cardNumber || !cardholderName || !expirationDate || !cvv) {
        // Show error - in real app, show alert
        return;
      }
    }

    // Create booking
    const booking = createBooking(lesson.id, params.date, params.time, lesson.price);
    
    // Update payment status
    // In real app, this would call payment API
    
    // Navigate back or to success screen
    navigation.goBack();
  };

  if (!lesson) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ders bulunamadı</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalAmount = lesson.price;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Lesson Summary Card */}
        <View style={styles.section}>
          <Card style={styles.lessonCard}>
            <View style={styles.lessonCardContent}>
              {instructor?.avatar ? (
                <Image
                  source={{ uri: instructor.avatar }}
                  style={styles.instructorAvatar}
                />
              ) : (
                <View style={[styles.instructorAvatar, styles.avatarPlaceholder]}>
                  <MaterialIcons name="person" size={24} color={colors.student.text.secondaryLight} />
                </View>
              )}
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle} numberOfLines={1}>
                  {lesson.title}
                </Text>
                <Text style={styles.lessonDetails} numberOfLines={2}>
                  Öğretmen: {instructor?.name || 'Bilinmiyor'} | {params?.date ? formatDate(params.date) : ''}, {params?.time || ''}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Payment Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ödeme Detayları</Text>
          <Card style={styles.paymentDetailsCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Ders Ücreti</Text>
              <Text style={styles.paymentValue}>{formatPrice(lesson.price)}</Text>
            </View>
            <View style={[styles.paymentRow, styles.paymentRowTotal]}>
              <Text style={styles.paymentLabelTotal}>Toplam Tutar</Text>
              <Text style={styles.paymentValueTotal}>{formatPrice(totalAmount)}</Text>
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
                  <Text style={styles.savedCardText}>
                    {savedCard.brand} **** {savedCard.last4}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setUseSavedCard(false)}>
                  <Text style={styles.changeButton}>Değiştir</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <>
              {/* Credit Card Input Form */}
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kart Sahibinin Adı Soyadı</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ad Soyad"
                    placeholderTextColor={colors.student.text.secondaryLight}
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kart Numarası</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor={colors.student.text.secondaryLight}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Son K. Tarihi</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="AA/YY"
                      placeholderTextColor={colors.student.text.secondaryLight}
                      value={expirationDate}
                      onChangeText={handleExpirationDateChange}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor={colors.student.text.secondaryLight}
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
                  trackColor={{ false: '#E5E7EB', true: colors.student.primary }}
                  thumbColor="#ffffff"
                />
                <Text style={styles.saveCardText}>
                  Kartımı sonraki ödemeler için kaydet
                </Text>
              </View>

              {/* Use Saved Card Option */}
              <TouchableOpacity 
                style={styles.useSavedCardButton}
                onPress={() => setUseSavedCard(true)}
              >
                <Text style={styles.useSavedCardText}>
                  Kayıtlı kartımı kullan
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA Bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.securityMessage}>
          <MaterialIcons name="lock" size={16} color={colors.student.text.secondaryLight} />
          <Text style={styles.securityText}>
            Ödemeniz güvenli bir şekilde işlenmektedir
          </Text>
        </View>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          activeOpacity={0.8}
        >
          <Text style={styles.payButtonText}>
            {formatPrice(totalAmount)} Öde
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
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
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
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
    backgroundColor: colors.student.card.light,
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
    color: colors.student.text.primaryLight,
  },
  lessonDetails: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.student.text.secondaryLight,
  },
  paymentDetailsCard: {
    marginBottom: 0,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.student.border.light,
  },
  paymentRowTotal: {
    borderBottomWidth: 0,
    paddingTop: spacing.md,
    paddingBottom: 0,
  },
  paymentLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.student.text.secondaryLight,
  },
  paymentValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.student.text.primaryLight,
  },
  paymentLabelTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.student.text.primaryLight,
  },
  paymentValueTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
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
    color: colors.student.text.primaryLight,
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
    color: colors.student.text.secondaryLight,
    marginBottom: spacing.xs,
  },
  input: {
    width: '100%',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.student.border.light,
    backgroundColor: colors.student.card.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.student.text.primaryLight,
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
    color: colors.student.text.primaryLight,
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
    backgroundColor: colors.student.background.light,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
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
    color: colors.student.text.secondaryLight,
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
    color: colors.student.text.primaryLight,
    marginBottom: spacing.md,
  },
  backButton: {
    fontSize: typography.fontSize.base,
    color: colors.student.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

