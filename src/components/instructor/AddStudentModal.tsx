import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseConfig } from '../../services/firebase/config';
import { FirestoreService } from '../../services/firebase/firestore';
import { useThemeStore } from '../../store/useThemeStore';
import { colors, spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { Lesson, User } from '../../types';
import { isValidPhoneNumber, getPhoneMask } from '../../utils/validation';
import MaskInput from 'react-native-mask-input';

interface AddStudentModalProps {
    visible: boolean;
    onClose: () => void;
    instructorId: string;
    isSchool: boolean;
    onSuccess: () => void;
    initialLessonId?: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
    visible,
    onClose,
    instructorId,
    isSchool,
    onSuccess,
    initialLessonId
}) => {
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette(isSchool ? 'school' : 'instructor', isDarkMode);

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
    const [selectedLessonId, setSelectedLessonId] = useState<string>(initialLessonId || '');
    const [lessons, setLessons] = useState<Lesson[]>([]);

    const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [fetchingLessons, setFetchingLessons] = useState(false);

    useEffect(() => {
        if (visible && instructorId) {
            loadLessons();
            resetForm();
            if (initialLessonId) {
                setSelectedLessonId(initialLessonId);
            }
        }
    }, [visible, instructorId, initialLessonId]);

    const loadLessons = async () => {
        setFetchingLessons(true);
        try {
            const fetchedLessons = isSchool
                ? await FirestoreService.getLessonsBySchool(instructorId)
                : await FirestoreService.getLessonsByInstructor(instructorId);

            setLessons(fetchedLessons.filter(l => l.isActive || l.status === 'active'));
        } catch (error) {
            console.error('Error fetching lessons:', error);
        } finally {
            setFetchingLessons(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setGender('');
        setSelectedLessonId(initialLessonId || '');
        setActiveTab('new');
        setSearchText('');
        setSelectedUserId('');
    };

    useEffect(() => {
        if (visible && activeTab === 'existing') {
            const delayDebounceFn = setTimeout(() => {
                fetchSearchResults(searchText);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchText, activeTab, visible]);

    const fetchSearchResults = async (text: string) => {
        setSearching(true);
        try {
            const results = await FirestoreService.searchStudents(text);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching students:', error);
        } finally {
            setSearching(false);
        }
    };

    // İkinci bir Firebase App instance'ı oluşturarak mevcut eğitmenin çıkış yapmasını engelliyoruz
    const getSecondaryAuth = () => {
        const secondaryAppName = 'SecondaryApp';
        const apps = getApps();
        let secondaryApp = apps.find(a => a.name === secondaryAppName);

        if (!secondaryApp) {
            secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        }
        return getAuth(secondaryApp);
    };

    const handleSave = async () => {
        if (activeTab === 'new') {
            if (!email.trim() || !firstName.trim() || !lastName.trim() || !phone.trim() || !gender || !selectedLessonId) {
                Alert.alert(t('common.error'), t('lessons.fillAllFields') || 'Lütfen tüm alanları doldurunuz.');
                return;
            }
            if (!isValidPhoneNumber(phone)) {
                Alert.alert(t('common.error'), t('profile.invalidPhoneNumber'));
                return;
            }

            setLoading(true);
            try {
                const secondaryAuth = getSecondaryAuth();
                const formattedEmail = email.trim().toLowerCase();
                const displayName = `${firstName.trim()} ${lastName.trim()}`;

                let newUserId = '';
                let isNewUser = true;

                try {
                    const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
                    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formattedEmail, randomPassword);
                    newUserId = userCredential.user.uid;

                    await sendPasswordResetEmail(secondaryAuth, formattedEmail);
                    await secondaryAuth.signOut();
                } catch (authError: any) {
                    if (authError.code === 'auth/email-already-in-use') {
                        isNewUser = false;
                    } else {
                        throw authError;
                    }
                }

                if (!isNewUser) {
                    Alert.alert(
                        t('common.error'),
                        'Bu e-posta adresi sistemimizde zaten kayıtlı. Öğrenci, hesabına girip kendisi derse kayıt olmalıdır veya yönetici onayı gerekir.\nVarolan Öğrenci sekmesini kullanabilirsiniz.'
                    );
                    setLoading(false);
                    return;
                }

                const newUser: Partial<User> = {
                    id: newUserId,
                    email: formattedEmail,
                    name: displayName,
                    displayName: displayName,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    phoneNumber: phone.trim(),
                    gender: gender as any,
                    role: 'student',
                    isVerified: false,
                    onboardingCompleted: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                await FirestoreService.createUser(newUserId, newUser);

                const selectedLesson = lessons.find(l => l.id === selectedLessonId);
                if (selectedLesson) {
                    await FirestoreService.createBooking({
                        studentId: newUserId,
                        lessonId: selectedLessonId,
                        instructorId: selectedLesson.instructorId || instructorId,
                        date: selectedLesson.date || new Date().toISOString().split('T')[0],
                        time: selectedLesson.time || "00:00",
                        status: 'confirmed',
                        paymentStatus: 'paid',
                        price: selectedLesson.price || 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        studentName: displayName,
                        studentGender: gender as any,
                        lessonTitle: selectedLesson.title || selectedLesson.name
                    });
                }

                Alert.alert(t('common.success'), 'Öğrenci başarıyla eklendi ve şifre belirleme e-postası gönderildi.');
                onSuccess();
                onClose();

            } catch (error: any) {
                console.error('Error adding student:', error);
                Alert.alert(t('common.error'), error?.message || t('common.errorDesc'));
            } finally {
                setLoading(false);
            }
        } else {
            // Existing Student Logic
            if (!selectedUserId || !selectedLessonId) {
                Alert.alert(t('common.error'), t('lessons.selectStudentAndLesson'));
                return;
            }

            if (!phone.trim() || !gender || (gender !== 'male' && gender !== 'female')) {
                Alert.alert(t('common.error'), t('lessons.fillAllFields') || 'Lütfen telefon ve cinsiyet bilgilerini eksiksiz doldurunuz.');
                return;
            }
            if (!isValidPhoneNumber(phone)) {
                Alert.alert(t('common.error'), t('profile.invalidPhoneNumber'));
                return;
            }

            setLoading(true);
            try {
                // Check if booking already exists
                const selectedLesson = lessons.find(l => l.id === selectedLessonId);
                const existingBooking = await FirestoreService.getUserBookingForLesson(selectedUserId, selectedLessonId, {
                    instructorId: selectedLesson?.instructorId || instructorId
                });
                if (existingBooking && existingBooking.status !== 'cancelled') {
                    Alert.alert(t('common.info'), t('lessons.studentAlreadyEnrolled'));
                    setLoading(false);
                    return;
                }

                const selectedUserDetail = searchResults.find(u => u.id === selectedUserId);

                // Update user details if missing phone or gender
                if (selectedUserDetail) {
                    const needsUpdate = (selectedUserDetail.phoneNumber !== phone.trim()) || (selectedUserDetail.gender !== gender);
                    if (needsUpdate) {
                        try {
                            await FirestoreService.updateUser(selectedUserId, {
                                phoneNumber: phone.trim(),
                                gender: gender as any
                            });
                        } catch (err) {
                            console.error('Error updating existing user info:', err);
                        }
                    }
                }

                if (selectedLesson) {
                    const studentName = selectedUserDetail?.name || selectedUserDetail?.displayName || `${selectedUserDetail?.firstName || ''} ${selectedUserDetail?.lastName || ''}`.trim() || t('studentHome.unknown');

                    await FirestoreService.createBooking({
                        studentId: selectedUserId,
                        lessonId: selectedLessonId,
                        instructorId: selectedLesson.instructorId || instructorId,
                        date: selectedLesson.date || new Date().toISOString().split('T')[0],
                        time: selectedLesson.time || "00:00",
                        status: 'confirmed',
                        paymentStatus: 'paid',
                        price: selectedLesson.price || 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        studentName: studentName,
                        studentGender: gender as any,
                        lessonTitle: selectedLesson.title || selectedLesson.name
                    });
                }

                Alert.alert(t('common.success'), t('lessons.studentAddedSuccessfully'));
                onSuccess();
                onClose();

            } catch (error: any) {
                console.error('Error adding existing student:', error);
                Alert.alert(t('common.error'), error?.message || t('common.errorDesc'));
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: palette.background }]}>
                    <View style={[styles.header, { borderBottomColor: palette.border }]}>
                        <Text style={[styles.headerTitle, { color: palette.text.primary }]}>{t('lessons.addStudent')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={24} color={palette.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'new' && { borderBottomColor: palette.primary, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab('new')}
                        >
                            <Text style={[styles.tabLabel, activeTab === 'new' ? { color: palette.primary, fontWeight: 'bold' } : { color: palette.text.secondary }]}>
                                {t('lessons.newRegistration')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'existing' && { borderBottomColor: palette.primary, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab('existing')}
                        >
                            <Text style={[styles.tabLabel, activeTab === 'existing' ? { color: palette.primary, fontWeight: 'bold' } : { color: palette.text.secondary }]}>
                                {t('lessons.registeredStudent')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        {activeTab === 'new' ? (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: palette.text.primary }]}>{t('common.firstName')}</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: palette.border, color: palette.text.primary, backgroundColor: palette.card }]}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        placeholder={t('common.firstName')}
                                        placeholderTextColor={palette.text.secondary}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: palette.text.primary }]}>{t('common.lastName')}</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: palette.border, color: palette.text.primary, backgroundColor: palette.card }]}
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder={t('common.lastName')}
                                        placeholderTextColor={palette.text.secondary}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: palette.text.primary }]}>{t('common.email')}</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: palette.border, color: palette.text.primary, backgroundColor: palette.card }]}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="ornek@email.com"
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        placeholderTextColor={palette.text.secondary}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: palette.text.primary }]}>{t('common.phone') || 'Telefon Numarası'}</Text>
                                    <MaskInput
                                        style={[styles.input, { borderColor: palette.border, color: palette.text.primary, backgroundColor: palette.card }]}
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="+90 555 444 33 22"
                                        keyboardType="phone-pad"
                                        placeholderTextColor={palette.text.secondary}
                                        mask={getPhoneMask('TR')}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: palette.text.primary }]}>{t('common.gender', 'Cinsiyet')}</Text>
                                    <View style={styles.genderOptions}>
                                        <TouchableOpacity
                                            style={[
                                                styles.genderBtn,
                                                { borderColor: palette.border, backgroundColor: palette.card },
                                                gender === 'male' && { borderColor: palette.primary, backgroundColor: palette.primary + '10' }
                                            ]}
                                            onPress={() => setGender('male')}
                                        >
                                            <Text style={[
                                                styles.genderText,
                                                { color: palette.text.secondary },
                                                gender === 'male' && { color: palette.primary, fontWeight: 'bold' }
                                            ]}>{t('common.male', 'Erkek')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.genderBtn,
                                                { borderColor: palette.border, backgroundColor: palette.card },
                                                gender === 'female' && { borderColor: palette.primary, backgroundColor: palette.primary + '10' }
                                            ]}
                                            onPress={() => setGender('female')}
                                        >
                                            <Text style={[
                                                styles.genderText,
                                                { color: palette.text.secondary },
                                                gender === 'female' && { color: palette.primary, fontWeight: 'bold' }
                                            ]}>{t('common.female', 'Kadın')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: palette.text.primary }]}>{t('lessons.searchStudent')}</Text>
                                <View style={styles.searchBar}>
                                    <MaterialIcons name="search" size={20} color={palette.text.secondary} style={styles.searchIcon} />
                                    <TextInput
                                        style={[styles.input, { borderColor: palette.border, color: palette.text.primary, backgroundColor: palette.card, flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 }]}
                                        value={searchText}
                                        onChangeText={setSearchText}
                                        placeholder={t('lessons.searchStudentPlaceholder')}
                                        placeholderTextColor={palette.text.secondary}
                                        autoCapitalize="none"
                                    />
                                </View>

                                {searching ? (
                                    <ActivityIndicator size="small" color={palette.primary} style={{ marginTop: spacing.md }} />
                                ) : searchResults.length === 0 ? (
                                    <Text style={[styles.noItemsText, { color: palette.text.secondary }]}>{t('lessons.studentNotFound')}</Text>
                                ) : (
                                    <ScrollView style={styles.searchResultsContainer} nestedScrollEnabled={true}>
                                        {searchResults.map(user => (
                                            <TouchableOpacity
                                                key={user.id}
                                                style={[
                                                    styles.userItem,
                                                    { borderColor: palette.border, backgroundColor: palette.card },
                                                    selectedUserId === user.id && { borderColor: palette.primary, backgroundColor: palette.primary + '10' }
                                                ]}
                                                onPress={() => {
                                                    setSelectedUserId(user.id);
                                                    setPhone((user as any).phone || user.phoneNumber || '');
                                                    const dbGender = (user as any).gender;
                                                    setGender(dbGender === 'male' || dbGender === 'female' ? dbGender : '');
                                                }}
                                            >
                                                <MaterialIcons
                                                    name={selectedUserId === user.id ? 'check-circle' : 'radio-button-unchecked'}
                                                    size={22}
                                                    color={selectedUserId === user.id ? palette.primary : palette.text.secondary}
                                                />
                                                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                                                    <Text style={[styles.userName, { color: palette.text.primary }]}>{user.name || user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || t('studentHome.unknown')}</Text>
                                                    <Text style={[styles.userEmail, { color: palette.text.secondary }]}>{user.email}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}

                                {selectedUserId && (
                                    <>
                                        <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
                                            <Text style={[styles.label, { color: palette.text.primary }]}>{t('common.phone', 'Telefon')} *</Text>
                                            <MaskInput
                                                style={[styles.input, { borderColor: palette.border, color: palette.text.primary, backgroundColor: palette.card }]}
                                                value={phone}
                                                onChangeText={setPhone}
                                                placeholder="+90 555 444 33 22"
                                                placeholderTextColor={palette.text.secondary}
                                                keyboardType="phone-pad"
                                                mask={getPhoneMask('TR')}
                                            />
                                            <Text style={{ fontSize: 12, color: palette.text.secondary, marginTop: 4 }}>
                                                Eksik ise lütfen öğrencinin iletişim bilgisini doğrulayın.
                                            </Text>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.label, { color: palette.text.primary }]}>{t('common.gender', 'Cinsiyet')} *</Text>
                                            <View style={styles.genderOptions}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.genderBtn,
                                                        { borderColor: palette.border, backgroundColor: palette.card },
                                                        gender === 'male' && { borderColor: palette.primary, backgroundColor: palette.primary + '10' }
                                                    ]}
                                                    onPress={() => setGender('male')}
                                                >
                                                    <Text style={[
                                                        styles.genderText,
                                                        { color: palette.text.secondary },
                                                        gender === 'male' && { color: palette.primary, fontWeight: 'bold' }
                                                    ]}>{t('common.male', 'Erkek')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.genderBtn,
                                                        { borderColor: palette.border, backgroundColor: palette.card },
                                                        gender === 'female' && { borderColor: palette.primary, backgroundColor: palette.primary + '10' }
                                                    ]}
                                                    onPress={() => setGender('female')}
                                                >
                                                    <Text style={[
                                                        styles.genderText,
                                                        { color: palette.text.secondary },
                                                        gender === 'female' && { color: palette.primary, fontWeight: 'bold' }
                                                    ]}>{t('common.female', 'Kadın')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: palette.text.primary }]}>{t('lessons.assignToLesson')}</Text>
                            {fetchingLessons ? (
                                <ActivityIndicator size="small" color={palette.primary} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
                            ) : lessons.length === 0 ? (
                                <Text style={[styles.noItemsText, { color: palette.text.secondary }]}>{t('lessons.noActiveLessonsModal')}</Text>
                            ) : (
                                <View style={styles.lessonsContainer}>
                                    {lessons.map(lesson => (
                                        <TouchableOpacity
                                            key={lesson.id}
                                            style={[
                                                styles.lessonItem,
                                                { borderColor: palette.border, backgroundColor: palette.card },
                                                selectedLessonId === lesson.id && { borderColor: palette.primary, backgroundColor: palette.primary + '10' }
                                            ]}
                                            onPress={() => setSelectedLessonId(lesson.id)}
                                        >
                                            <MaterialIcons
                                                name={selectedLessonId === lesson.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                                                size={20}
                                                color={selectedLessonId === lesson.id ? palette.primary : palette.text.secondary}
                                            />
                                            <Text style={[styles.lessonName, { color: palette.text.primary }]}>{lesson.title || lesson.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {activeTab === 'new' && (
                            <Text style={[styles.infoText, { color: palette.text.secondary }]}>
                                {t('lessons.newStudentNote')}
                            </Text>
                        )}
                        <View style={{ height: 20 }} />
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: palette.border, backgroundColor: palette.background }]}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: palette.primary }]}
                            onPress={handleSave}
                            disabled={loading || fetchingLessons}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: '85%',
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: spacing.xs,
    },
    formContainer: {
        flex: 1,
        padding: spacing.md,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.sm,
        height: 48,
        fontSize: typography.fontSize.base,
    },
    lessonsContainer: {
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    lessonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderWidth: 1,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    lessonName: {
        fontSize: typography.fontSize.base,
        flex: 1,
    },
    noItemsText: {
        fontSize: typography.fontSize.sm,
        marginTop: spacing.xs,
    },
    infoText: {
        fontSize: typography.fontSize.xs,
        marginTop: spacing.sm,
        fontStyle: 'italic',
    },
    footer: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        borderTopWidth: 1,
    },
    saveButton: {
        height: 50,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: typography.fontSize.base,
        fontWeight: 'bold',
    },
    genderOptions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    genderBtn: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: borderRadius.md,
    },
    genderText: {
        fontSize: typography.fontSize.sm,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tabButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    tabLabel: {
        fontSize: typography.fontSize.base,
        fontWeight: '600',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: borderRadius.md,
        paddingLeft: spacing.sm,
    },
    searchIcon: {
        marginRight: spacing.xs,
    },
    searchResultsContainer: {
        maxHeight: 200,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: borderRadius.md,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    userName: {
        fontSize: typography.fontSize.sm,
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: typography.fontSize.xs,
    },
});
