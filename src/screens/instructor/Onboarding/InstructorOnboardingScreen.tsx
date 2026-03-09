import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../../utils/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { FirestoreService } from '../../../services/firebase/firestore';
import { useDanceStyles } from '../../../hooks/useDanceStyles';
import MaskInput from 'react-native-mask-input';
import { internationalPhoneMask } from '../../../utils/validation';

const STEPS = ['BasicInfo', 'Expertise'];

export const InstructorOnboardingScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const { user, setUser } = useAuthStore();
    const palette = getPalette('instructor', isDarkMode);
    const { danceStyles, loading: loadingStyles } = useDanceStyles();

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

    const handleNext = () => {
        if (currentStepIndex === 0) {
            if (!phoneNumber.trim() || !bio.trim()) {
                Alert.alert(t('common.error'), t('profile.fillRequiredFields') || 'Lütfen tüm zorunlu alanları doldurun.');
                return;
            }
            setCurrentStepIndex(1);
        } else if (currentStepIndex === 1) {
            if (selectedStyles.length === 0) {
                Alert.alert(t('common.error'), t('onboarding.selectStylesErr') || 'Lütfen en az bir uzmanlık alanı seçin.');
                return;
            }
            submitProfile();
        }
    };

    const submitProfile = async () => {
        if (!user?.id) return;

        setIsSubmitting(true);
        try {
            const updatedData = {
                phoneNumber,
                bio,
                onboardingCompleted: true,
            };

            await FirestoreService.updateUser(user.id, updatedData);
            setUser({ ...user, ...updatedData });

            // @ts-ignore
            navigation.navigate('CreateLesson'); // Move to Lesson Creation directly
        } catch (error) {
            console.error('Error saving onboarding data:', error);
            Alert.alert(t('common.error'), t('common.errorDesc'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStyle = (style: string) => {
        if (selectedStyles.includes(style)) {
            setSelectedStyles(selectedStyles.filter(s => s !== style));
        } else {
            setSelectedStyles([...selectedStyles, style]);
        }
    };

    const renderBasicInfo = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: palette.text.primary }]}>{t('onboarding.basicInfoTitle') || 'Temel Bilgiler'}</Text>
            <Text style={[styles.stepDescription, { color: palette.text.secondary }]}>
                {t('onboarding.basicInfoDesc') || 'Öğrencilerin sizi daha iyi tanıması için profil bilgilerinizi tamamlayın.'}
            </Text>

            <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: palette.text.primary }]}>{t('onboarding.phoneLabel') || 'Telefon Numarası'} *</Text>
                <MaskInput
                    style={[styles.input, { backgroundColor: palette.card, color: palette.text.primary, borderColor: palette.border }]}
                    placeholder="+90 5XX XXX XX XX"
                    placeholderTextColor={palette.text.secondary}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    mask={internationalPhoneMask}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: palette.text.primary }]}>{t('onboarding.bioLabel') || 'Hakkımda (Bio)'} *</Text>
                <TextInput
                    style={[styles.textArea, { backgroundColor: palette.card, color: palette.text.primary, borderColor: palette.border }]}
                    placeholder={t('onboarding.bioPlaceholder') || 'Kendinizden, deneyimlerinizden ve dans geçmişinizden kısaca bahsedin...'}
                    placeholderTextColor={palette.text.secondary}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                />
            </View>
        </View>
    );

    const renderExpertise = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: palette.text.primary }]}>{t('onboarding.expertiseTitle') || 'Uzmanlık Alanları'}</Text>
            <Text style={[styles.stepDescription, { color: palette.text.secondary }]}>
                {t('onboarding.expertiseDesc') || 'Hangi dans türlerinde eğitim veriyorsunuz? (Birden fazla seçebilirsiniz)'}
            </Text>

            {loadingStyles ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.instructor.primary} />
                </View>
            ) : (
                <View style={styles.chipsContainer}>
                    {danceStyles.map((style) => {
                        const isSelected = selectedStyles.includes(style);
                        return (
                            <TouchableOpacity
                                key={style}
                                style={[
                                    styles.chip,
                                    { backgroundColor: isSelected ? colors.instructor.primary : palette.card, borderColor: isSelected ? colors.instructor.primary : palette.border }
                                ]}
                                onPress={() => toggleStyle(style)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    { color: isSelected ? '#ffffff' : palette.text.primary }
                                ]}>
                                    {style}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStepIndex) {
            case 0: return renderBasicInfo();
            case 1: return renderExpertise();
            default: return null;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (currentStepIndex > 0 && currentStepIndex < 2) {
                                setCurrentStepIndex(currentStepIndex - 1);
                            } else if (currentStepIndex === 0) {
                                navigation.goBack();
                            }
                        }}
                    >
                        {currentStepIndex < 2 && (
                            <MaterialIcons name="arrow-back" size={24} color={palette.text.primary} />
                        )}
                    </TouchableOpacity>

                    {currentStepIndex < 2 && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        {
                                            backgroundColor: colors.instructor.primary,
                                            width: `${((currentStepIndex + 1) / 2) * 100}%`
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[styles.progressText, { color: palette.text.secondary }]}>
                                {t('onboarding.step') || 'Adım'} {currentStepIndex + 1} / 2
                            </Text>
                        </View>
                    )}
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {renderCurrentStep()}
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: palette.border }]}>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.instructor.primary }]}
                        onPress={handleNext}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>
                                {currentStepIndex === 0 ? (t('onboarding.nextStep') || 'Devam Et') : (t('onboarding.completeProfile') || 'Profili Tamamla')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        height: 56,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    progressContainer: {
        flex: 1,
        alignItems: 'center',
        paddingRight: 40, // Balance back button
    },
    progressTrack: {
        width: '60%',
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: typography.fontSize.xs,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.xl,
        flexGrow: 1,
    },
    stepContent: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: typography.fontSize['2xl'] || 24,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.sm,
    },
    stepDescription: {
        fontSize: typography.fontSize.base,
        lineHeight: 24,
        marginBottom: spacing.xxl,
    },
    textCenter: {
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: spacing.xl,
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        height: 52,
        fontSize: typography.fontSize.base,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        height: 120,
        fontSize: typography.fontSize.base,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    chipText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        borderTopWidth: 1,
    },
    primaryButton: {
        height: 56,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
});
