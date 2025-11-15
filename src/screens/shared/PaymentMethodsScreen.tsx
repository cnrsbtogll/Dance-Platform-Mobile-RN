import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/common/Card';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// Mock saved payment methods
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'card1',
    type: 'card',
    brand: 'Mastercard',
    last4: '1234',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: 'card2',
    type: 'card',
    brand: 'Visa',
    last4: '5678',
    expiryMonth: 6,
    expiryYear: 2026,
    isDefault: false,
  },
];

export const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette(user?.role || 'student', isDarkMode);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: t('profile.paymentMethods'),
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

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      t('paymentMethods.deleteCard'),
      t('paymentMethods.deleteCardConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(paymentMethods.filter(card => card.id !== cardId));
          },
        },
      ]
    );
  };

  const handleSetDefault = (cardId: string) => {
    setPaymentMethods(
      paymentMethods.map(card => ({
        ...card,
        isDefault: card.id === cardId,
      }))
    );
  };

  const handleAddCard = () => {
    // Navigate to add card screen or show modal
    // For now, just show alert
    Alert.alert(t('paymentMethods.addCard'), t('paymentMethods.addCardMessage'));
  };

  const getCardIcon = (brand: string): string => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'credit-card';
    if (brandLower.includes('mastercard')) return 'credit-card';
    if (brandLower.includes('amex')) return 'credit-card';
    return 'credit-card';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: palette.background }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          {paymentMethods.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: palette.card }]}>
              <MaterialIcons name="credit-card-off" size={48} color={palette.text.secondary} />
              <Text style={[styles.emptyText, { color: palette.text.secondary }]}>
                {t('paymentMethods.noCards')}
              </Text>
              <Text style={[styles.emptySubtext, { color: palette.text.secondary }]}>
                {t('paymentMethods.noCardsDescription')}
              </Text>
            </Card>
          ) : (
            paymentMethods.map((card) => (
              <Card key={card.id} style={[styles.cardItem, { backgroundColor: palette.card }]}>
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.cardIconContainer, { backgroundColor: palette.border }]}>
                      <MaterialIcons
                        name={getCardIcon(card.brand)}
                        size={24}
                        color={palette.text.primary}
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeader}>
                        <Text style={[styles.cardBrand, { color: palette.text.primary }]}>
                          {card.brand}
                        </Text>
                        {card.isDefault && (
                          <View style={[styles.defaultBadge, { backgroundColor: colors.student.primary + '20' }]}>
                            <Text style={[styles.defaultBadgeText, { color: colors.student.primary }]}>
                              {t('paymentMethods.default')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.cardNumber, { color: palette.text.secondary }]}>
                        **** **** **** {card.last4}
                      </Text>
                      {card.expiryMonth && card.expiryYear && (
                        <Text style={[styles.cardExpiry, { color: palette.text.secondary }]}>
                          {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    {!card.isDefault && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSetDefault(card.id)}
                      >
                        <MaterialIcons name="star-outline" size={20} color={palette.text.secondary} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteCard(card.id)}
                    >
                      <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Add Card Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.student.primary }]}
            onPress={handleAddCard}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={24} color="#ffffff" />
            <Text style={styles.addButtonText}>
              {t('paymentMethods.addCard')}
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
    gap: spacing.sm,
  },
  cardItem: {
    marginBottom: 0,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardBrand: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  defaultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  cardNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  cardExpiry: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    textAlign: 'center',
  },
  addButtonContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    ...shadows.lg,
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
});

