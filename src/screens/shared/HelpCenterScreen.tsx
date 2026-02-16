import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  // @ts-ignore - params type
  const mode = route.params?.mode || user?.role || 'student';
  const palette = getPalette(mode, isDarkMode);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqs = [
    { id: '1', question: t('helpCenter.faqs.q1'), answer: t('helpCenter.faqs.a1') },
    { id: '2', question: t('helpCenter.faqs.q2'), answer: t('helpCenter.faqs.a2') },
    { id: '3', question: t('helpCenter.faqs.q3'), answer: t('helpCenter.faqs.a3') },
    { id: '4', question: t('helpCenter.faqs.q4'), answer: t('helpCenter.faqs.a4') },
    { id: '5', question: t('helpCenter.faqs.q5'), answer: t('helpCenter.faqs.a5') },
  ];

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: t('profile.helpCenter'),
      headerTintColor: palette.text.primary,
      headerStyle: { backgroundColor: palette.background },
      headerTitleStyle: { fontWeight: 'bold' },
      headerShadowVisible: false,
    });
  }, [navigation, isDarkMode, palette, t]);

  const handleContactSupport = async () => {
    const phoneNumber = '905550059876';
    const message = 'Feriha Dans platformu hakkında yardıma ihtiyacım var';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
      }
    } catch (error) {
      console.error("WhatsApp error:", error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text.primary }]}>{t('helpCenter.frequentlyAskedQuestions')}</Text>
          <Text style={[styles.subtitle, { color: palette.text.secondary }]}>{t('helpCenter.findAnswers')}</Text>
        </View>

        <View style={styles.faqList}>
          {faqs.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id} style={[
                styles.faqItem,
                {
                  backgroundColor: palette.card,
                  borderColor: isExpanded ? palette.primary : 'transparent',
                  borderWidth: 1
                }
              ]}>
                <TouchableOpacity onPress={() => toggleExpand(item.id)} activeOpacity={0.8} style={styles.questionRow}>
                  <View style={styles.qTextContainer}>
                    <Text style={[styles.questionText, { color: isExpanded ? palette.primary : palette.text.primary }]}>
                      {item.question}
                    </Text>
                  </View>
                  <MaterialIcons name={isExpanded ? "remove" : "add"} size={20} color={isExpanded ? palette.primary : palette.text.secondary} />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.answerRow}>
                    <Text style={[styles.answerText, { color: palette.text.secondary }]}>
                      {item.answer}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.contactSection}>
          <Text style={[styles.contactTitle, { color: palette.text.primary }]}>{t('helpCenter.stillNeedHelp')}</Text>
          <TouchableOpacity style={[styles.contactButton, { backgroundColor: palette.primary }]} onPress={handleContactSupport}>
            <MaterialIcons name="chat" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>{t('helpCenter.contactUs')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  faqList: { gap: spacing.md },
  faqItem: { borderRadius: 12, overflow: 'hidden', ...shadows.sm },
  questionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  qTextContainer: { flex: 1, marginRight: 12 },
  questionText: { fontSize: 16, fontWeight: '600' },
  answerRow: { paddingHorizontal: 16, paddingBottom: 16 },
  answerText: { fontSize: 14, lineHeight: 22 },
  contactSection: { marginTop: spacing.xxl, alignItems: 'center', gap: 16 },
  contactTitle: { fontSize: 18, fontWeight: '600' },
  contactButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 30, gap: 8, ...shadows.md },
  contactButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
