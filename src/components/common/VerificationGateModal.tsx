import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSchoolApproval: () => void;
    onDocumentApproval: () => void;
    /** Daha önce gönderilmiş doğrulama yöntemi (varsa) */
    alreadyRequestedMethod?: 'school' | 'document' | null;
}

export const VerificationGateModal: React.FC<Props> = ({
    visible,
    onClose,
    onSchoolApproval,
    onDocumentApproval,
    alreadyRequestedMethod,
}) => {
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette('instructor', isDarkMode);

    const hasSchoolRequest = alreadyRequestedMethod === 'school';
    const hasDocumentRequest = alreadyRequestedMethod === 'document';
    const isChangingMethod = !!alreadyRequestedMethod;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={[styles.sheet, { backgroundColor: palette.card }]}
                    activeOpacity={1}
                    onPress={() => { }}
                >
                    {/* Handle */}
                    <View style={[styles.handle, { backgroundColor: palette.border }]} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={[styles.iconWrap, { backgroundColor: colors.instructor.primary + '15' }]}>
                            <MaterialIcons name="verified-user" size={28} color={colors.instructor.primary} />
                        </View>
                        <Text style={[styles.title, { color: palette.text.primary }]}>
                            {isChangingMethod
                                ? (t('verificationGate.changeMethodTitle') || 'Doğrulama Yöntemini Değiştir')
                                : t('verificationGate.title')}
                        </Text>
                        <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
                            {isChangingMethod
                                ? (t('verificationGate.changeMethodSubtitle') || 'Farklı bir yöntem seçerek talebinizi güncelleyebilirsiniz.')
                                : t('verificationGate.subtitle')}
                        </Text>
                    </View>

                    {/* Option 1 — School Approval */}
                    <TouchableOpacity
                        style={[
                            styles.option,
                            {
                                backgroundColor: palette.background,
                                borderColor: hasSchoolRequest ? colors.instructor.primary : palette.border,
                                borderWidth: hasSchoolRequest ? 2 : 1.5,
                            },
                        ]}
                        onPress={onSchoolApproval}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colors.instructor.primary + '15' }]}>
                            <MaterialIcons name="school" size={24} color={colors.instructor.primary} />
                        </View>
                        <View style={styles.optionContent}>
                            <View style={styles.optionTitleRow}>
                                <Text style={[styles.optionTitle, { color: palette.text.primary }]}>
                                    {t('verificationGate.schoolApprovalTitle')}
                                </Text>
                                {hasSchoolRequest && (
                                    <View style={[styles.activeBadge, { backgroundColor: colors.instructor.primary }]}>
                                        <Text style={styles.activeBadgeText}>
                                            {t('verificationGate.active') || 'Aktif'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.optionDesc, { color: palette.text.secondary }]}>
                                {t('verificationGate.schoolApprovalDesc')}
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={colors.instructor.primary} />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={[styles.line, { backgroundColor: palette.border }]} />
                        <Text style={[styles.or, { color: palette.text.secondary }]}>
                            {t('verificationGate.or')}
                        </Text>
                        <View style={[styles.line, { backgroundColor: palette.border }]} />
                    </View>

                    {/* Option 2 — Document Upload */}
                    <TouchableOpacity
                        style={[
                            styles.option,
                            {
                                backgroundColor: palette.background,
                                borderColor: hasDocumentRequest ? palette.secondary : palette.border,
                                borderWidth: hasDocumentRequest ? 2 : 1.5,
                            },
                        ]}
                        onPress={onDocumentApproval}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: palette.secondary + '15' }]}>
                            <MaterialIcons name="upload-file" size={24} color={palette.secondary} />
                        </View>
                        <View style={styles.optionContent}>
                            <View style={styles.optionTitleRow}>
                                <Text style={[styles.optionTitle, { color: palette.text.primary }]}>
                                    {t('verificationGate.documentTitle')}
                                </Text>
                                {hasDocumentRequest && (
                                    <View style={[styles.activeBadge, { backgroundColor: palette.secondary }]}>
                                        <Text style={styles.activeBadgeText}>
                                            {t('verificationGate.active') || 'Aktif'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.optionDesc, { color: palette.text.secondary }]}>
                                {t('verificationGate.documentDesc')}
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={palette.text.secondary} />
                    </TouchableOpacity>

                    {/* Cancel */}
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={[styles.cancelText, { color: palette.text.secondary }]}>
                            {t('common.cancel')}
                        </Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        paddingBottom: spacing.xl + 8,
        ...shadows.lg,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
        lineHeight: 20,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
    },
    optionIcon: {
        width: 46,
        height: 46,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionContent: {
        flex: 1,
        gap: 3,
    },
    optionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        flexWrap: 'wrap',
    },
    optionTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
    optionDesc: {
        fontSize: typography.fontSize.xs,
        lineHeight: 18,
    },
    activeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: typography.fontWeight.bold,
        color: '#ffffff',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    line: { flex: 1, height: 1 },
    or: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
    },
    cancelBtn: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
        marginTop: spacing.xs,
    },
    cancelText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
    },
});
