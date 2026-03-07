import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { FirestoreService } from '../../services/firebase/firestore';
import MaskInput from 'react-native-mask-input';
import { internationalPhoneMask } from '../../utils/validation';

export const SchoolOnboardingScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const { user, setUser } = useAuthStore();
    const palette = getPalette('school', isDarkMode);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [schoolName, setSchoolName] = useState(user?.schoolName || '');
    const [schoolAddress, setSchoolAddress] = useState(user?.schoolAddress || '');
    const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
    const [contactPerson, setContactPerson] = useState(user?.contactPerson || '');
    const [instagramHandle, setInstagramHandle] = useState(user?.instagramHandle || '');
    const [bio, setBio] = useState(user?.bio || '');

    const handleComplete = async () => {
        if (!schoolName.trim() || !schoolAddress.trim() || !contactNumber.trim() || !contactPerson.trim()) {
            Alert.alert(t('common.error'), t('profile.fillRequiredFields') || 'Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        if (!user?.id) return;

        setIsSubmitting(true);
        try {
            const updatedData = {
                schoolName,
                schoolAddress,
                contactNumber,
                contactPerson,
                instagramHandle,
                bio,
                onboardingCompleted: true,
            };

            await FirestoreService.updateUser(user.id, updatedData);
            setUser({ ...user, ...updatedData } as any);

            Alert.alert(
                t('common.success'),
                t('school.onboardingSuccess') || 'Okul profiliniz başarıyla tamamlandı!',
                [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error saving school onboarding data:', error);
            Alert.alert(t('common.error'), t('common.errorDesc'));
        } finally {
            setIsSubmitting(false);
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
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={palette.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: palette.text.primary }]}>
                        {t('school.completeProfile') || 'Okul Profilini Tamamla'}
                    </Text>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, { color: palette.text.primary }]}>
                            {t('school.onboardingTitle') || 'Okul Bilgileri'}
                        </Text>
                        <Text style={[styles.stepDescription, { color: palette.text.secondary }]}>
                            {t('school.onboardingDesc') || 'Öğrencilerin okulunuzu daha iyi tanıması için aşağıdaki bilgileri eksiksiz doldurun.'}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: palette.text.primary }]}>{t('becomeSchool.schoolNamePlaceholder') || 'Okul Adı'} *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: palette.card, color: palette.text.primary, borderColor: palette.border }]}
                                placeholder={t('becomeSchool.schoolNamePlaceholder')}
                                placeholderTextColor={palette.text.secondary}
                                value={schoolName}
                                onChangeText={setSchoolName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: palette.text.primary }]}>{t('becomeSchool.contactPersonPlaceholder') || 'İletişim Kişisi'} *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: palette.card, color: palette.text.primary, borderColor: palette.border }]}
                                placeholder={t('becomeSchool.contactPersonPlaceholder')}
                                placeholderTextColor={palette.text.secondary}
                                value={contactPerson}
                                onChangeText={setContactPerson}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: palette.text.primary }]}>{t('becomeSchool.contactNumberPlaceholder') || 'İletişim Numarası'} *</Text>
                            <MaskInput
                                style={[styles.input, { backgroundColor: palette.card, color: palette.text.primary, borderColor: palette.border }]}
                                placeholder="+90 5XX XXX XX XX"
                                placeholderTextColor={palette.text.secondary}
                                value={contactNumber}
                                onChangeText={setContactNumber}
                                keyboardType="phone-pad"
                                mask={internationalPhoneMask}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: palette.text.primary }]}>{t('becomeSchool.schoolAddressPlaceholder') || 'Okul Adresi'} *</Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: palette.card, color: palette.text.primary, borderColor: palette.border }]}
                                placeholder={t('becomeSchool.schoolAddressPlaceholder')}
                                placeholderTextColor={palette.text.secondary}
                                value={schoolAddress}
                                onChangeText={setSchoolAddress}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: palette.text.primary }]}>{t('becomeSchool.instagramPlaceholder') || 'Instagram Kullanıcı Adı'}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: palette.card, color: palette.text.primary, borderColor: palette.border }]}
                                placeholder="@kullanici_adi"
                                placeholderTextColor={palette.text.secondary}
                                value={instagramHandle}
                                onChangeText={setInstagramHandle}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: palette.text.primary }]}>{t('school.bioPlaceholder') || 'Hakkımızda'} </Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: palette.card, color: palette.text.primary, borderColor: palette.border }]}
                                placeholder={t('school.bioPlaceholder')}
                                placeholderTextColor={palette.text.secondary}
                                value={bio}
                                onChangeText={setBio}
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: palette.border }]}>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.school.primary }]}
                        onPress={handleComplete}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>
                                {t('onboarding.completeProfile') || 'Kaydet ve Tamamla'}
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
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        marginLeft: spacing.sm,
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
        height: 100,
        fontSize: typography.fontSize.base,
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
