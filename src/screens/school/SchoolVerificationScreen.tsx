import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { FirestoreService } from '../../services/firebase/firestore';

export const SchoolVerificationScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const { user, setUser } = useAuthStore();
    const palette = getPalette('school', isDarkMode);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idDocument, setIdDocument] = useState<string | null>(null);       // Vergi Levhası / Kurucu Kimliği
    const [ministryDocument, setMinistryDocument] = useState<string | null>(null);   // MEB veya Gençlik Spor Belgesi

    const handleSelectDocument = (type: 'id' | 'ministry') => {
        Alert.alert(
            type === 'id' ? (t('becomeSchool.idDocTitle') || 'Kimlik/Vergi Levhası') : (t('becomeSchool.ministryDocTitle') || 'Bakanlık Onay Belgesi'),
            type === 'id'
                ? (t('becomeSchool.idDocDesc') || 'Kurucu kimlik fotokopisi veya vergi levhasını seçin.')
                : (t('becomeSchool.ministryDocDesc') || 'MEB veya Gençlik ve Spor Bakanlığı ruhsatnamenizi seçin.'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.ok'),
                    onPress: () => {
                        if (type === 'id') setIdDocument('dummy-id-document.jpg');
                        else setMinistryDocument('dummy-ministry-document.jpg');
                    }
                }
            ]
        );
    };

    const handleSubmit = async () => {
        if (!user?.id) return;
        if (!idDocument || !ministryDocument) {
            Alert.alert(
                t('common.error'),
                t('becomeSchool.pleaseUploadAllDocs') || 'Lütfen hem kimlik/vergi levhası belgenizi hem de bakanlık onay belgenizi yükleyin.'
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const now = new Date().toISOString();

            // Assuming we have a dedicated collection for school verification or we use schoolRequests
            await FirestoreService.createSchoolRequest({
                userId: user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                userEmail: user.email || '',
                schoolName: user.schoolName || '',
                schoolAddress: user.schoolAddress || '',
                contactNumber: user.contactNumber || '',
                contactPerson: user.contactPerson || '',
                instagramHandle: user.instagramHandle || '',
                status: 'pending',
                createdAt: now,
                updatedAt: now,
                // These would be uploaded to Storage in a real app
                // idDocumentUrl: idDocument,
                // ministryDocumentUrl: ministryDocument,
            } as any);

            const updatedData = {
                verificationStatus: 'pending' as const,
            };

            await FirestoreService.updateUser(user.id, updatedData);
            setUser({ ...user, ...updatedData } as any);

            Alert.alert(
                t('school.verificationPendingTitle') || 'Belgeler İnceleniyor',
                t('school.verificationPendingDesc') || 'Yüklediğiniz belgeler kontrol ediliyor. Onaylandıktan sonra kurslarınızı yayına alabilirsiniz.',
                [{
                    text: t('common.ok'),
                    onPress: () => navigation.goBack()
                }]
            );
        } catch (error) {
            console.error('Error submitting school verification:', error);
            Alert.alert(t('common.error'), t('common.errorDesc'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderUploadCard = (
        type: 'id' | 'ministry',
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
                    borderColor: document ? colors.school.primary : palette.border,
                    borderWidth: document ? 2 : 1,
                }
            ]}
            onPress={() => handleSelectDocument(type)}
            activeOpacity={0.75}
        >
            {document ? (
                <View style={styles.uploadedRow}>
                    <View style={[styles.uploadedIcon, { backgroundColor: colors.school.primary + '20' }]}>
                        <MaterialIcons name="check-circle" size={28} color={colors.school.primary} />
                    </View>
                    <View style={styles.uploadedText}>
                        <Text style={[styles.uploadedTitle, { color: palette.text.primary }]}>{title}</Text>
                        <Text style={[styles.uploadedSub, { color: colors.school.primary }]}>{t('common.done') || 'Yüklendi'} ✓</Text>
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
                    <MaterialIcons name="add-circle-outline" size={24} color={colors.school.primary} />
                </View>
            )}
        </TouchableOpacity>
    );

    const bothUploaded = !!idDocument && !!ministryDocument;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={palette.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: palette.text.primary }]}>{t('school.uploadDocumentsTitle') || 'Belge Doğrulaması'}</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Badge */}
                <View style={[styles.infoBadge, { backgroundColor: colors.school.primary + '10', borderColor: colors.school.primary + '30' }]}>
                    <MaterialIcons name="info-outline" size={18} color={colors.school.primary} />
                    <Text style={[styles.infoBadgeText, { color: colors.school.primary }]}>
                        {t('school.uploadDocumentsDesc') || 'Okul olarak kurs yayınlayabilmeniz için MEB veya Gençlik Spor Bakanlığı onaylı evraklarınızı yüklemeniz gerekmektedir.'}
                    </Text>
                </View>

                <Text style={[styles.sectionLabel, { color: palette.text.secondary }]}>{t('instructor.selectDocument') || 'Gerekli Belgeler'}</Text>

                {/* ID / Tax Document */}
                {renderUploadCard(
                    'id',
                    t('becomeSchool.idDocTitle') || 'Vergi Levhası / Kurucu Kimliği',
                    t('becomeSchool.idDocDesc') || 'Resmi vergi levhası veya kurucu kimlik fotokopisi.',
                    'business',
                    idDocument,
                    () => setIdDocument(null)
                )}

                {/* Ministry Document */}
                {renderUploadCard(
                    'ministry',
                    t('becomeSchool.ministryDocTitle') || 'MEB / Bakanlık Onay Belgesi',
                    t('becomeSchool.ministryDocDesc') || 'MEB veya Gençlik Spor Bakanlığı ruhsatnamesi.',
                    'workspace-premium',
                    ministryDocument,
                    () => setMinistryDocument(null)
                )}

                {/* Privacy Note */}
                <Text style={[styles.privacyNote, { color: palette.text.secondary }]}>
                    <MaterialIcons name="lock" size={12} /> {t('instructor.privacyNote') || 'Belgeleriniz güvenle şifrelenir ve üçüncü şahıslarla paylaşılmaz.'}
                </Text>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: palette.border, backgroundColor: palette.background }]}>
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        { backgroundColor: bothUploaded ? colors.school.primary : palette.border }
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
                            <Text style={styles.submitBtnText}>{t('instructor.submitVerification') || 'Doğrulamayı Gönder'}</Text>
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
    privacyNote: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: spacing.sm,
        fontStyle: 'italic',
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
