import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../../utils/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { FirestoreService } from '../../../services/firebase/firestore';

export const VerificationScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const { user, setUser } = useAuthStore();
    const palette = getPalette('instructor', isDarkMode);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idDocument, setIdDocument] = useState<string | null>(null);       // Kimlik / Ehliyet / Pasaport
    const [certDocument, setCertDocument] = useState<string | null>(null);   // Eğitmen Sertifikası

    const handleSelectDocument = (type: 'id' | 'cert') => {
        Alert.alert(
            type === 'id' ? 'Kimlik Belgesi Seç' : 'Sertifika Seç',
            type === 'id'
                ? 'Kimlik kartı, ehliyet veya pasaportunuzdan birini seçin.'
                : 'Eğitmenlik sertifikanızı seçin.',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: 'Seç',
                    onPress: () => {
                        if (type === 'id') setIdDocument('dummy-id-document.jpg');
                        else setCertDocument('dummy-cert-document.jpg');
                    }
                }
            ]
        );
    };

    const handleSubmit = async () => {
        if (!user?.id) return;
        if (!idDocument || !certDocument) {
            Alert.alert(
                t('common.error'),
                'Lütfen hem kimlik belgenizi hem de eğitmenlik sertifikanızı yükleyin.'
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const now = new Date().toISOString();
            await FirestoreService.createVerificationRequest({
                userId: user.id,
                firstName: user.firstName || user.displayName?.split(' ')[0] || user.name?.split(' ')[0] || '',
                lastName: user.lastName || user.displayName?.split(' ').slice(1).join(' ') || user.name?.split(' ').slice(1).join(' ') || '',
                userEmail: user.email || '',
                danceStyles: (user as any).danceStyles || [],
                experience: (user as any).experience || '',
                bio: (user as any).bio || '',
                contactNumber: user.phoneNumber || '',
                phoneNumber: user.phoneNumber || '',
                idDocumentUrl: idDocument!,
                certDocumentUrl: certDocument!,
                status: 'pending',
                createdAt: now,
                updatedAt: now,
            });

            await FirestoreService.updateUser(user.id, { onboardingCompleted: true });
            setUser({ ...user, onboardingCompleted: true });

            Alert.alert(
                'Başvurunuz Alındı 🎉',
                'Belgeleriniz incelemeye alındı. Onaylandığında dersleriniz yayınlanacak.',
                [{
                    text: t('common.ok'),
                    onPress: () => {
                        if (navigation.canGoBack()) navigation.goBack();
                        else (navigation as any).navigate('MainTabs');
                    }
                }]
            );
        } catch (error) {
            console.error('Error submitting verification:', error);
            Alert.alert(t('common.error'), t('common.errorDesc'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderUploadCard = (
        type: 'id' | 'cert',
        title: string,
        subtitle: string,
        iconName: string,
        document: string | null,
        onRemove: () => void
    ) => (
        <TouchableOpacity
            style={[
                styles.uploadCard,
                {
                    backgroundColor: palette.card,
                    borderColor: document ? colors.instructor.secondary : palette.border,
                    borderWidth: document ? 2 : 1,
                }
            ]}
            onPress={() => handleSelectDocument(type)}
            activeOpacity={0.75}
        >
            {document ? (
                <View style={styles.uploadedRow}>
                    <View style={[styles.uploadedIcon, { backgroundColor: colors.instructor.secondary + '20' }]}>
                        <MaterialIcons name="check-circle" size={28} color={colors.instructor.secondary} />
                    </View>
                    <View style={styles.uploadedText}>
                        <Text style={[styles.uploadedTitle, { color: palette.text.primary }]}>{title}</Text>
                        <Text style={[styles.uploadedSub, { color: colors.instructor.secondary }]}>Yüklendi ✓</Text>
                    </View>
                    <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <MaterialIcons name="close" size={20} color={palette.text.secondary} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.uploadEmptyRow}>
                    <View style={[styles.uploadEmptyIcon, { backgroundColor: palette.background }]}>
                        <MaterialIcons name={iconName as any} size={26} color={palette.text.secondary} />
                    </View>
                    <View style={styles.uploadEmptyText}>
                        <Text style={[styles.uploadCardTitle, { color: palette.text.primary }]}>{title}</Text>
                        <Text style={[styles.uploadCardSub, { color: palette.text.secondary }]} numberOfLines={2}>{subtitle}</Text>
                    </View>
                    <MaterialIcons name="add-circle-outline" size={24} color={colors.instructor.secondary} />
                </View>
            )}
        </TouchableOpacity>
    );

    const bothUploaded = !!idDocument && !!certDocument;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={palette.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: palette.text.primary }]}>Kimlik Doğrulama</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Badge */}
                <View style={[styles.infoBadge, { backgroundColor: colors.instructor.secondary + '15', borderColor: colors.instructor.secondary + '30' }]}>
                    <MaterialIcons name="info-outline" size={18} color={colors.instructor.secondary} />
                    <Text style={[styles.infoBadgeText, { color: colors.instructor.secondary }]}>
                        Belgeleriniz güvenle şifrelenir ve yalnızca inceleme ekibimizle paylaşılır.
                    </Text>
                </View>

                <Text style={[styles.sectionLabel, { color: palette.text.secondary }]}>Gerekli Belgeler</Text>

                {/* ID Document */}
                {renderUploadCard(
                    'id',
                    'Kimlik Belgesi',
                    'Kimlik kartı, ehliyet veya pasaport (birini seçin)',
                    'badge',
                    idDocument,
                    () => setIdDocument(null)
                )}

                {/* Certificate */}
                {renderUploadCard(
                    'cert',
                    'Eğitmen Sertifikası',
                    'Dans eğitmenliği sertifikanızı yükleyin',
                    'workspace-premium',
                    certDocument,
                    () => setCertDocument(null)
                )}

                {/* Progress */}
                <View style={styles.progressRow}>
                    <View style={[styles.progressDot, { backgroundColor: idDocument ? colors.instructor.secondary : palette.border }]} />
                    <View style={[styles.progressLine, { backgroundColor: palette.border }]} />
                    <View style={[styles.progressDot, { backgroundColor: certDocument ? colors.instructor.secondary : palette.border }]} />
                    <Text style={[styles.progressText, { color: palette.text.secondary }]}>
                        {[idDocument, certDocument].filter(Boolean).length} / 2 belge yüklendi
                    </Text>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: palette.border, backgroundColor: palette.background }]}>
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        { backgroundColor: bothUploaded ? colors.instructor.primary : palette.border }
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || !bothUploaded}
                    activeOpacity={0.85}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <MaterialIcons name="send" size={20} color="#ffffff" />
                            <Text style={styles.submitBtnText}>Başvuruyu Gönder</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
        gap: spacing.md,
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.sm,
    },
    infoBadgeText: {
        flex: 1,
        fontSize: typography.fontSize.sm,
        lineHeight: 20,
    },
    sectionLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    uploadCard: {
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        ...shadows.sm,
    },
    uploadedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    uploadedIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadedText: {
        flex: 1,
    },
    uploadedTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
    uploadedSub: {
        fontSize: typography.fontSize.sm,
        marginTop: 2,
    },
    uploadEmptyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    uploadEmptyIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadEmptyText: {
        flex: 1,
    },
    uploadCardTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
    uploadCardSub: {
        fontSize: typography.fontSize.sm,
        marginTop: 2,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
        paddingHorizontal: spacing.xs,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    progressLine: {
        flex: 1,
        height: 2,
        borderRadius: 1,
    },
    progressText: {
        fontSize: typography.fontSize.sm,
    },
    footer: {
        padding: spacing.md,
        paddingBottom: spacing.lg,
        borderTopWidth: 1,
    },
    submitBtn: {
        height: 56,
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        ...shadows.md,
    },
    submitBtnText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: '#ffffff',
    },
});
