import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { openWhatsApp } from '../../utils/whatsapp';
import { Card } from '../../components/common/Card';
import { FirestoreService } from '../../services/firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/config';

export const BecomeSchoolScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const { isAuthenticated, user, setUser } = useAuthStore();
    const palette = getPalette('student', isDarkMode);

    const handleCreateAccount = () => {
        (navigation as any).navigate('Login');
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingRequest, setIsCheckingRequest] = useState(false);
    const [requestSubmitted, setRequestSubmitted] = useState(false);

    // Form State removed, no inputs needed at this stage

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            checkExistingRequest();
        }
    }, [isAuthenticated, user?.id]);

    const checkExistingRequest = async () => {
        if (!user?.id) return;

        setIsCheckingRequest(true);
        try {
            const status = await FirestoreService.getSchoolRequestStatus(user.id);
            setRequestSubmitted(status === 'pending');
        } catch (error) {
            console.error('[BecomeSchool] Error checking request:', error);
        } finally {
            setIsCheckingRequest(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!user?.id || !user.email) {
            Alert.alert(t('common.error'), t('becomeSchool.mustLogin'));
            return;
        }

        setIsSubmitting(true);
        try {
            // Direct the user to the School Panel as a 'draft-school'
            const updatedData = {
                role: 'draft-school' as const,
                onboardingCompleted: false, // User must complete profile in the school panel
                isVerified: false,
            };

            await FirestoreService.updateUser(user.id, updatedData);
            setUser({ ...user, ...updatedData } as any);

            Alert.alert(
                t('common.success'),
                t('becomeSchool.roleUpdated'),
                [{
                    text: t('common.ok'),
                    onPress: () => {
                        // Navigate to School mode via RootNavigator
                        navigation.getParent()?.getParent()?.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'School' }],
                            })
                        );
                    }
                }]
            );
        } catch (error) {
            console.error('[BecomeSchool] Error updating role:', error);
            Alert.alert(t('common.error'), t('common.errorDesc'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: palette.background }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <Card style={styles.card}>
                <View style={styles.headerRow}>
                    <MaterialIcons name="business" size={24} color={colors.student.primary} />
                    <Text style={[styles.title, { color: palette.text.primary }]}>{t('becomeSchool.title')}</Text>
                </View>
                <Text style={[styles.description, { color: palette.text.secondary }]}>
                    {t('becomeSchool.description')}
                </Text>

                {/* Step 1: Create Account / Login - Always show */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={[styles.stepNumber, isAuthenticated ? styles.stepNumberCompleted : styles.stepNumberActive]}>
                            {isAuthenticated ? (
                                <MaterialIcons name="check" size={18} color="#ffffff" />
                            ) : (
                                <Text style={styles.stepNumberText}>1</Text>
                            )}
                        </View>
                        <Text style={[styles.stepTitle, { color: palette.text.primary }]}>
                            {t('becomeSchool.step1')}
                        </Text>
                    </View>
                    <Text style={[styles.stepDescription, { color: palette.text.secondary }]}>
                        {t('becomeSchool.step1Description')}
                    </Text>

                    {isAuthenticated ? (
                        <View style={styles.successContainer}>
                            <MaterialIcons name="check-circle" size={24} color={colors.general.success} />
                            <Text style={[styles.successText, { color: colors.general.success }]}>
                                {t('becomeSchool.step1Completed')}
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: colors.student.primary }]}
                            onPress={handleCreateAccount}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>{t('becomeSchool.createAccount')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Step 2: Complete Profile */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepHeader}>
                        <View style={[styles.stepNumber, isAuthenticated ? styles.stepNumberActive : styles.stepNumberInactive]}>
                            <Text style={[styles.stepNumberText, !isAuthenticated && styles.stepNumberTextInactive]}>2</Text>
                        </View>
                        <Text style={[styles.stepTitle, { color: isAuthenticated ? palette.text.primary : palette.text.secondary }]}>
                            {t('becomeSchool.step2Title')}
                        </Text>
                    </View>
                    <Text style={[styles.stepDescription, { color: palette.text.secondary }]}>
                        {t('becomeSchool.step2Description')}
                    </Text>

                    {!isAuthenticated ? (
                        <TouchableOpacity
                            style={styles.warningContainer}
                            onPress={handleCreateAccount}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="info-outline" size={20} color={colors.student.primary} />
                            <Text style={[styles.warningText, { color: colors.student.primary }]}>
                                {t('becomeSchool.step2NeedLogin')}
                            </Text>
                        </TouchableOpacity>
                    ) : requestSubmitted ? (
                        <View style={styles.warningContainer}>
                            <MaterialIcons name="hourglass-empty" size={24} color={colors.school.primary} />
                            <Text style={[styles.warningText, { color: colors.school.primary }]}>
                                {t('becomeSchool.requestPending')}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.formContainer}>
                            <Text style={[styles.stepDescription, { color: palette.text.secondary, marginBottom: spacing.lg }]}>
                                {t('becomeSchool.applyNowDesc')}
                            </Text>

                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: colors.school.primary }]}
                                onPress={handleSubmitRequest}
                                disabled={isSubmitting}
                                activeOpacity={0.8}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>{t('becomeSchool.submitRequest')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>


            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.md,
    },
    card: {
        padding: spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    description: {
        fontSize: typography.fontSize.base,
        marginBottom: spacing.xl,
    },
    stepContainer: {
        marginBottom: spacing.xl,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberActive: {
        backgroundColor: colors.student.primary,
    },
    stepNumberCompleted: {
        backgroundColor: colors.general.success,
    },
    stepNumberInactive: {
        backgroundColor: '#E5E7EB',
    },
    stepNumberText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: '#ffffff',
    },
    stepNumberTextInactive: {
        color: '#9CA3AF',
    },
    stepTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        flex: 1,
    },
    stepDescription: {
        fontSize: typography.fontSize.base,
        marginBottom: spacing.md,
        lineHeight: 22,
    },
    primaryButton: {
        width: '100%',
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
    },
    primaryButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: '#ffffff',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
    },
    warningText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        textAlign: 'center',
    },
    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: '#25D366',
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.md,
        ...shadows.sm,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    whatsappText: {
        color: '#ffffff',
        fontWeight: typography.fontWeight.bold,
        fontSize: typography.fontSize.base,
    },
    loadingContainer: {
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: '#F0FDF4',
        borderRadius: borderRadius.md,
    },
    successText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
    },
    formContainer: {
        width: '100%',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
    },
    inputSection: {
        gap: spacing.md,
        marginVertical: spacing.md,
    },
    inputContainer: {
        gap: spacing.xs,
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        marginLeft: spacing.xs,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        fontSize: typography.fontSize.base,
    },
    textArea: {
        height: 100,
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        fontSize: typography.fontSize.base,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        height: 56,
        borderRadius: borderRadius.xl,
        ...shadows.md,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
});
