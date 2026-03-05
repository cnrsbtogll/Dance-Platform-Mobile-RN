import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Platform,
    StatusBar,
} from 'react-native';
import { auth } from '../../services/firebase/config';
import { sendEmailVerification } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

const COOLDOWN_SECONDS = 60;
// Platform-aware top padding (safe area without requiring SafeAreaProvider context)
const TOP_PADDING = Platform.OS === 'android'
    ? (StatusBar.currentHeight ?? 24) + 4
    : 50; // iOS static notch-safe value

interface EmailVerificationBannerProps {
    isVisible: boolean;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
    isVisible,
}) => {
    const { t } = useTranslation();

    const [dismissed, setDismissed] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [feedback, setFeedback] = useState<'sent' | 'error' | null>(null);

    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const opacity = useRef(new Animated.Value(1)).current;

    const startCooldown = useCallback(() => {
        setCooldown(COOLDOWN_SECONDS);
        cooldownRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleResend = useCallback(async () => {
        if (isSending || cooldown > 0 || !auth?.currentUser) return;

        try {
            setIsSending(true);
            setFeedback(null);
            await sendEmailVerification(auth.currentUser);
            setFeedback('sent');
            startCooldown();
        } catch {
            setFeedback('error');
        } finally {
            setIsSending(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }, [isSending, cooldown, startCooldown]);

    const handleDismiss = useCallback(() => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => setDismissed(true));
    }, [opacity]);

    if (!isVisible || dismissed) return null;

    const resendLabel = () => {
        if (isSending) return null;
        if (cooldown > 0) return t('emailVerification.cooldown', { seconds: cooldown });
        return t('emailVerification.resend');
    };

    return (
        <Animated.View
            style={[styles.container, { paddingTop: TOP_PADDING }, { opacity }]}
            accessibilityRole="alert"
            accessibilityLabel={t('emailVerification.bannerText')}
        >
            {/* Icon + Text */}
            <View style={styles.left}>
                <Text style={styles.icon}>✉️</Text>
                <View style={styles.textBlock}>
                    <Text style={styles.title}>{t('emailVerification.title')}</Text>
                    {feedback === 'sent' && (
                        <Text style={styles.feedbackSent}>{t('emailVerification.sentSuccess')}</Text>
                    )}
                    {feedback === 'error' && (
                        <Text style={styles.feedbackError}>{t('emailVerification.sendError')}</Text>
                    )}
                    {!feedback && (
                        <Text style={styles.subtitle}>{t('emailVerification.bannerText')}</Text>
                    )}
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={handleResend}
                    disabled={isSending || cooldown > 0}
                    style={[styles.resendBtn, (isSending || cooldown > 0) && styles.resendBtnDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel={t('emailVerification.resend')}
                    accessibilityState={{ disabled: isSending || cooldown > 0 }}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#7A5A00" />
                    ) : (
                        <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
                            {resendLabel()}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleDismiss}
                    style={styles.dismissBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.cancel')}
                >
                    <Text style={styles.dismissText}>✕</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF3CD',
        borderBottomWidth: 1.5,
        borderBottomColor: '#FBBF00',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingBottom: 10,
        zIndex: 999,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    left: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        gap: 8,
    },
    icon: {
        fontSize: 18,
        marginTop: 2,
    },
    textBlock: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: '#7A5A00',
        marginBottom: 1,
    },
    subtitle: {
        fontSize: 12,
        color: '#92651A',
        lineHeight: 16,
    },
    feedbackSent: {
        fontSize: 12,
        color: '#1A7A2E',
        lineHeight: 16,
    },
    feedbackError: {
        fontSize: 12,
        color: '#C0392B',
        lineHeight: 16,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 8,
    },
    resendBtn: {
        backgroundColor: '#FBBF00',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        minWidth: 60,
        alignItems: 'center',
    },
    resendBtnDisabled: {
        backgroundColor: '#E8D87A',
    },
    resendText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#5A3E00',
    },
    resendTextDisabled: {
        color: '#9A8A40',
    },
    dismissBtn: {
        padding: 4,
    },
    dismissText: {
        fontSize: 14,
        color: '#92651A',
        fontWeight: '600',
    },
});
