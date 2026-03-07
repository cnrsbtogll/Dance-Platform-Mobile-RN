import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, FlatList, Platform, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../../components/common/Card';
import { LocationPickerModal } from '../../components/common/LocationPickerModal';
import { DEFAULT_COUNTRY } from '../../utils/locations';
import { InstructorMultiSelectModal } from '../../components/common/InstructorMultiSelectModal';
import { FirestoreService } from '../../services/firebase/firestore';
import { CURRENCY_SYMBOLS } from '../../utils/helpers';
import { Lesson } from '../../types';
import { uploadCourseCover } from '../../services/storageService';

// Helper function to get image source (supports both local assets and URLs)
const getImageSource = (image: any) => {
    if (typeof image === 'string') {
        return { uri: image }; // URL image
    }
    return image; // Local require() result
};

// Predefined lesson images for each dance type
const LESSON_IMAGES: { [key: string]: any[] } = {
    Salsa: [
        require('../../../assets/lessons/salsa/salsa-1.jpeg'),
        require('../../../assets/lessons/salsa/salsa-2.jpeg'),
        require('../../../assets/lessons/salsa/salsa-3.jpeg'),
        require('../../../assets/lessons/salsa/salsa-4.jpeg'),
    ],
    Bachata: [
        require('../../../assets/lessons/bachata/bachata-1.jpeg'),
        require('../../../assets/lessons/bachata/bachata-2.jpeg'),
        require('../../../assets/lessons/bachata/bachata-3.jpeg'),
        require('../../../assets/lessons/bachata/bachata-4.jpeg'),
    ],
    Kizomba: [
        require('../../../assets/lessons/kizomba/kizomba-1.jpeg'),
        require('../../../assets/lessons/kizomba/kizomba-2.jpeg'),
        require('../../../assets/lessons/kizomba/kizomba-3.jpeg'),
        require('../../../assets/lessons/kizomba/kizomba-4.jpeg'),
    ],
    Tango: [
        require('../../../assets/lessons/tango/tango-1.jpeg'),
        require('../../../assets/lessons/tango/tango-2.jpeg'),
        require('../../../assets/lessons/tango/tango-3.jpeg'),
        require('../../../assets/lessons/tango/tango-4.jpeg'),
    ],
    Modern: [
        require('../../../assets/lessons/moderndance/moderndance-1.jpeg'),
        require('../../../assets/lessons/moderndance/moderndance-2.jpeg'),
        require('../../../assets/lessons/moderndance/moderndance-3.jpeg'),
        require('../../../assets/lessons/moderndance/moderndance-4.jpeg'),
    ],
};

const DANCE_TYPES = ['Salsa', 'Bachata', 'Kizomba', 'Tango', 'Modern'];
const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const getDurationOptions = (t: any) => [
    { label: t('lessons.durations.45min'), value: 45 },
    { label: t('lessons.durations.60min'), value: 60 },
    { label: t('lessons.durations.90min'), value: 90 },
];

export const CreateLessonScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as { lesson?: Lesson };
    const editingLesson = params?.lesson;
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const { user } = useAuthStore();
    const isSchoolRoles = ['draft-school', 'school'];
    const isSchool = user?.role ? isSchoolRoles.includes(user.role) : false;
    const palette = getPalette(isSchool ? 'school' : 'instructor', isDarkMode);

    const currency = user?.currency || 'TRY';
    const currencySymbol = CURRENCY_SYMBOLS[currency];
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const title = editingLesson ? t('lessons.editLesson') : t('lessons.createLesson');
        navigation.setOptions({
            headerShown: true,
            headerTitle: title,
            headerBackTitle: '',
            headerStyle: {
                backgroundColor: palette.background,
            },
            headerTitleStyle: {
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: palette.text.primary,
            },
            headerTintColor: palette.text.primary,
        });
    }, [navigation, isDarkMode, palette, t, editingLesson]);

    const [title, setTitle] = useState('');
    const [danceType, setDanceType] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('1250');
    const [duration, setDuration] = useState(60);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState<Date | null>(() => {
        const defaultTime = new Date();
        defaultTime.setHours(19, 0, 0, 0);
        return defaultTime;
    });
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [coverUploadProgress, setCoverUploadProgress] = useState(0);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDanceTypePicker, setShowDanceTypePicker] = useState(false);
    const [showDurationPicker, setShowDurationPicker] = useState(false);
    const [locationType, setLocationType] = useState<'school' | 'custom'>('school');
    const [selectedSchool, setSelectedSchool] = useState<{ id: string; name: string } | null>(null);
    const [customAddress, setCustomAddress] = useState('');
    const [customCountry, setCustomCountry] = useState('');
    const [customCity, setCustomCity] = useState('');
    const [locationPickerVisible, setLocationPickerVisible] = useState(false);
    const [showSchoolPicker, setShowSchoolPicker] = useState(false);
    const [danceSchools, setDanceSchools] = useState<{ id: string; name: string }[]>([]);
    const [loadingSchools, setLoadingSchools] = useState(false);

    // Instructor picker state for schools
    const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
    const [selectedInstructors, setSelectedInstructors] = useState<{ id: string; name: string }[]>([]);
    const [showInstructorPicker, setShowInstructorPicker] = useState(false);
    const [loadingInstructors, setLoadingInstructors] = useState(false);

    const availableImages = danceType ? LESSON_IMAGES[danceType] || [] : [];

    // Fetch dance schools or instructors from Firebase
    useEffect(() => {
        const fetchData = async () => {
            // Always fetch instructors so everyone can use multi-select
            setLoadingInstructors(true);
            try {
                const instructorsData = await FirestoreService.getInstructors();
                const mappedInstructors = instructorsData.map((inst: any) => ({
                    id: inst.id,
                    name: inst.displayName || (inst.firstName ? inst.firstName + (inst.lastName ? ' ' + inst.lastName : '') : 'İsimsiz Eğitmen')
                }));
                // Make sure the current instructor is always in the list and selected if they are an instructor
                if (!isSchool && user) {
                    const currentInstructor = {
                        id: user.id,
                        name: user.displayName || (user.firstName ? user.firstName + (user.lastName ? ' ' + user.lastName : '') : 'Eğitmen')
                    };
                    if (!mappedInstructors.some(i => i.id === user.id)) {
                        mappedInstructors.push(currentInstructor);
                    }
                    if (selectedInstructors.length === 0 && !editingLesson) {
                        setSelectedInstructors([currentInstructor]);
                    }
                }
                setInstructors(mappedInstructors);
            } catch (error) {
                console.error('Error fetching instructors:', error);
            } finally {
                setLoadingInstructors(false);
            }

            // Fetch schools only for non-schools (instructors selecting location)
            if (!isSchool) {
                setLoadingSchools(true);
                try {
                    const schoolsData = await FirestoreService.getDanceSchools();
                    setDanceSchools(schoolsData.map(s => ({
                        id: s.id,
                        name: s.name
                    })));
                } catch (error) {
                    console.error('Error fetching dance schools:', error);
                } finally {
                    setLoadingSchools(false);
                }
            }
        };
        fetchData();
    }, [isSchool, user]);

    // Check if user has completed onboarding or has missing school fields
    useEffect(() => {
        if (!user) return;

        let isMissingFields = false;

        if (isSchool) {
            // Check if school has missing required fields
            if (!user.schoolName || !user.schoolAddress || !user.contactNumber || !user.contactPerson) {
                isMissingFields = true;
            }
        } else {
            // Instructor onboarding check
            if (!user.onboardingCompleted) {
                isMissingFields = true;
            }
        }

        if (isMissingFields) {
            Alert.alert(
                t('instructor.profileIncomplete') || 'Profiliniz Eksik',
                isSchool
                    ? (t('school.completeProfileBeforeLesson') || 'Kurs oluşturabilmek için okul profilinizdeki zorunlu alanları (Okul Adı, Adres, Telefon vb.) doldurmalısınız.')
                    : (t('instructor.completeProfileBeforeLesson') || 'Kurs oluşturabilmek için önce eğitmen profilinizi tamamlamanız gerekmektedir.'),
                [{
                    text: t('common.ok'),
                    onPress: () => {
                        // Go back first so we don't get stuck in CreateLesson alert loop
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        }

                        // Small delay to allow the modal/screen transition
                        setTimeout(() => {
                            if (isSchool) {
                                // @ts-ignore
                                navigation.navigate('EditProfile', { highlightErrors: true });
                            } else {
                                // @ts-ignore
                                navigation.navigate('InstructorOnboarding');
                            }
                        }, 100);
                    }
                }]
            );
        }
    }, [user, isSchool, navigation, t]);

    // Populate form if editing
    useEffect(() => {
        if (editingLesson) {
            setTitle(editingLesson.title);
            setDescription(editingLesson.description);
            setDanceType(editingLesson.category || editingLesson.danceStyle || '');
            setPrice(editingLesson.price.toString());
            setDuration(editingLesson.duration);
            setSelectedDays(editingLesson.daysOfWeek || []);

            if (editingLesson.time) {
                const [hours, minutes] = editingLesson.time.split(':').map(Number);
                const date = new Date();
                date.setHours(hours, minutes, 0, 0);
                setSelectedTime(date);
            }

            setSelectedImage(editingLesson.imageUrl);

            // Handle location
            if (editingLesson.location) {
                const loc = editingLesson.location as any;
                if (typeof loc === 'object' && loc.type === 'school') {
                    setLocationType('school');
                    setSelectedSchool({ id: loc.schoolId, name: loc.schoolName });
                } else if (typeof loc === 'object' && loc.type === 'custom') {
                    setLocationType('custom');
                    setCustomCountry(loc.customCountry || '');
                    setCustomCity(loc.customCity || '');
                    setCustomAddress(loc.customAddress || loc.address || '');
                } else if (typeof loc === 'string') {
                    setLocationType('custom');
                    setCustomAddress(loc);
                }
            }

            // Instructor setup
            if (editingLesson.instructorIds && editingLesson.instructorIds.length > 0) {
                const mapped = editingLesson.instructorIds.map((id, index) => ({
                    id,
                    name: editingLesson.instructorNames?.[index] || ''
                }));
                // Make sure we set selectedInstructors for both school and instructor flows
                setSelectedInstructors(mapped);
            } else if (editingLesson.instructorId) {
                setSelectedInstructors([{ id: editingLesson.instructorId, name: editingLesson.instructorName || '' }]);
            }
        }
    }, [editingLesson]);


    const formatTime = (date: Date | null): string => {
        if (!date) return '';
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleSave = async (saveAsDraft: boolean) => {
        if (!title.trim() || !danceType || !description || !price || !selectedImage) {
            Alert.alert(t('common.error'), t('lessons.fillAllFields') || 'Lütfen tüm alanları doldurun.');
            return;
        }

        if (selectedDays.length === 0) {
            Alert.alert(t('common.error'), t('lessons.selectDayError') || 'En az bir gün seçmelisiniz.');
            return;
        }

        if (selectedInstructors.length === 0) {
            Alert.alert(t('common.error'), t('lessons.selectInstructorError') || 'En az bir eğitmen seçmelisiniz.');
            return;
        }

        if (!isSchool) {
            if (locationType === 'school' && !selectedSchool) {
                Alert.alert(t('common.error'), t('lessons.selectSchoolError') || 'Bir okul seçmelisiniz.');
                return;
            }
            if (locationType === 'custom') {
                if (!customCountry || !customCity) {
                    Alert.alert(t('common.error'), t('lessons.selectCountryCityError') || 'Lütfen ülke ve şehir seçiniz.');
                    return;
                }
                if (!customAddress.trim()) {
                    Alert.alert(t('common.error'), t('lessons.enterAddressError') || 'Adres girmelisiniz.');
                    return;
                }
            }
        }

        if (!user) {
            Alert.alert(t('common.error'), 'User is not authenticated.');
            return;
        }

        try {
            // Draft role lesson cap: max 3 draft lessons
            const isDraftRole = user?.role === 'draft-instructor' || user?.role === 'draft-school';
            if (isDraftRole && !editingLesson) {
                const existingLessons = user?.role === 'draft-school'
                    ? await FirestoreService.getLessonsBySchool(user.id)
                    : await FirestoreService.getLessonsByInstructor(user.id);
                // Status 'draft' or inactive lessons count towards the limit for draft roles
                const draftCount = existingLessons.filter(l => l.status === 'draft' || !l.isActive).length;
                if (draftCount >= 3) {
                    Alert.alert(
                        user?.role === 'draft-school'
                            ? (t('school.draftLimitReachedTitle') || 'Taslak Limitine Ulaşıldı')
                            : (t('instructor.draftLimitTitle') || 'Taslak Kurs Limiti'),
                        user?.role === 'draft-school'
                            ? (t('school.draftLimitReachedDesc') || 'Hesabınız doğrulanmadan en fazla 3 taslak kurs oluşturabilirsiniz. Devam etmek için lütfen belgelerinizi yükleyin.')
                            : (t('instructor.draftLimitDesc') || 'Taslak eğitmen olarak en fazla 3 taslak kurs oluşturabilirsiniz. Daha fazla kurs eklemek için kimliğinizi doğrulayın.'),
                        [{ text: t('common.ok') }]
                    );
                    return;
                }
            }

            // If selectedImage is a string starting with 'http', it's already a MinIO URL.
            // If it's a number (require()), convert to a local URI before storing — we store as-is for static assets.
            let finalImageUrl = selectedImage;

            // Base lesson object
            const now = new Date();
            const lessonData: Partial<Lesson> = {
                title,
                name: title,
                description,
                category: danceType as any,
                danceStyle: danceType,
                price: Number(price),
                currency,
                duration,
                daysOfWeek: selectedDays,
                time: selectedTime ? `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}` : undefined,
                imageUrl: finalImageUrl,
                status: user?.role === 'instructor' ? 'active' : 'draft', // Default status based on user role
                isActive: user?.role === 'instructor', // Default isActive based on user role
                rating: editingLesson?.rating || 0,
                reviewCount: editingLesson?.reviewCount || 0,
                favoriteCount: editingLesson?.favoriteCount || 0,
                createdAt: editingLesson?.createdAt || now.toISOString(),
                updatedAt: now.toISOString()
            };

            // Set instructors for BOTH school and instructor types
            lessonData.instructorIds = selectedInstructors.map(i => i.id);
            lessonData.instructorNames = selectedInstructors.map(i => i.name);

            // Determine primary instructor/creator
            if (isSchool) {
                lessonData.instructorId = selectedInstructors.length > 0 ? selectedInstructors[0].id : '';
                lessonData.instructorName = selectedInstructors.length > 0 ? selectedInstructors[0].name : '';
                lessonData.schoolId = user.id;
                lessonData.schoolName = user.schoolName || user.firstName + (user.lastName ? ' ' + user.lastName : '');
                lessonData.location = {
                    type: 'school',
                    schoolId: user.id,
                    schoolName: user.schoolName || user.firstName + (user.lastName ? ' ' + user.lastName : ''),
                };
            } else {
                lessonData.instructorId = user.id;
                lessonData.instructorName = user.displayName || (user.firstName ? user.firstName + (user.lastName ? ' ' + user.lastName : '') : 'Eğitmen');
                if (locationType === 'school' && selectedSchool) {
                    lessonData.schoolId = selectedSchool.id;
                    lessonData.schoolName = selectedSchool.name;
                    lessonData.location = {
                        type: 'school',
                        schoolId: selectedSchool.id,
                        schoolName: selectedSchool.name,
                    };
                } else {
                    lessonData.location = {
                        type: 'custom',
                        customCountry: customCountry,
                        customCity: customCity,
                        customAddress: customAddress.trim()
                    };
                }
            }


            if (editingLesson) {
                await FirestoreService.updateLesson(editingLesson.id, lessonData);
                Alert.alert(t('common.success'), 'Lesson updated successfully', [
                    { text: t('common.ok'), onPress: () => navigation.goBack() }
                ]);
            } else {
                await FirestoreService.createLesson(lessonData);
                Alert.alert(t('common.success'), t('lessons.lessonCreateSuccess'), [
                    {
                        text: t('common.ok'), onPress: () => {
                            // @ts-ignore
                            navigation.navigate('MainTabs', { screen: 'Lessons', params: { initialTab: 'past' } });
                        }
                    }
                ]);
            }
        } catch (error) {
            console.error('Error creating lesson:', error);
            Alert.alert(t('common.error'), t('common.errorDesc'));
        }
    };

    const renderImagePicker = () => {
        if (!danceType) {
            return (
                <View style={styles.imageUploadContainer}>
                    <View style={[styles.imageUploadPlaceholder, { borderColor: palette.border, backgroundColor: palette.card }]}>
                        <MaterialIcons name="cloud-upload" size={48} color={palette.text.secondary} />
                        <Text style={[styles.imageUploadText, { color: palette.text.secondary }]}>{t('lessons.selectImageFirst')}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.imageUploadContainer}>
                {selectedImage ? (
                    <TouchableOpacity
                        style={styles.selectedImageContainer}
                        onPress={() => setShowImagePicker(true)}
                    >
                        <Image source={getImageSource(selectedImage)} style={styles.selectedImage} resizeMode="cover" />
                        <View style={styles.imageOverlay}>
                            <MaterialIcons name="edit" size={24} color="#ffffff" />
                            <Text style={styles.imageOverlayText}>{t('lessons.change')}</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.imageUploadPlaceholder, { borderColor: palette.border, backgroundColor: palette.card }]}
                        onPress={() => setShowImagePicker(true)}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="cloud-upload" size={48} color={palette.text.secondary} />
                        <Text style={[styles.imageUploadText, { color: palette.text.secondary }]}>
                            <Text style={styles.imageUploadTextBold}>{t('lessons.clickToUpload')}</Text> {t('lessons.orDrag')}
                        </Text>
                        <Text style={[styles.imageUploadSubtext, { color: palette.text.secondary }]}>{t('lessons.imageFormat')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={[]}>
            {(user?.role === 'draft-instructor' || user?.role === 'draft-school') && (
                <View style={[styles.warningBanner, { backgroundColor: '#FEF3C7', borderBottomColor: '#FDE68A' }]}>
                    <MaterialIcons name="info-outline" size={20} color="#D97706" />
                    <Text style={[styles.warningText, { color: '#D97706' }]}>
                        {t('lessons.unverifiedWarning') || 'Hesabınız henüz onaylanmadı. Oluşturduğunuz kurslar "Taslak" olarak kaydedilecektir.'}
                    </Text>
                </View>
            )}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollViewContent, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Dance Type Selection */}
                    <View style={styles.section}>
                        <Card style={styles.formCard}>
                            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.danceType')}</Text>
                            <View style={styles.formFields}>
                                <View style={styles.inputGroup}>
                                    <TouchableOpacity
                                        style={[styles.selectInput, { borderColor: palette.border, backgroundColor: palette.card }]}
                                        onPress={() => setShowDanceTypePicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.selectInputText, { color: danceType ? palette.text.primary : palette.text.secondary }]}>
                                            {danceType || t('lessons.selectDanceType')}
                                        </Text>
                                        <MaterialIcons
                                            name="keyboard-arrow-down"
                                            size={24}
                                            color={palette.text.secondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>
                    </View>
                    {/* Image Section */}
                    <View style={styles.section}>
                        <Card style={styles.imageCard}>
                            <Text style={[styles.sectionLabel, { color: palette.text.primary }]}>{t('lessons.lessonImage')}</Text>
                            {renderImagePicker()}
                        </Card>
                    </View>

                    {/* Basic Information */}
                    <View style={styles.section}>
                        <Card style={styles.formCard}>
                            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.basicInfo')}</Text>
                            <View style={styles.formFields}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.lessonTitle')}</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                                        placeholder={t('lessons.lessonTitlePlaceholder')}
                                        placeholderTextColor={palette.text.secondary}
                                        value={title}
                                        onChangeText={setTitle}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.description')}</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                                        placeholder={t('lessons.descriptionPlaceholder')}
                                        placeholderTextColor={palette.text.secondary}
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                        numberOfLines={6}
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        </Card>
                    </View>

                    {/* Pricing & Duration */}
                    <View style={styles.section}>
                        <Card style={styles.formCard}>
                            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.pricing')} & {t('lessons.duration')}</Text>
                            <View style={styles.gridRow}>
                                <View style={[styles.inputGroup, styles.gridItem]}>
                                    <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.hourlyPrice')}</Text>
                                    <View style={[styles.priceInputContainer, { borderColor: palette.border, backgroundColor: palette.card }]}>
                                        <Text style={[styles.currencySymbol, { color: palette.text.secondary }]}>{currencySymbol}</Text>
                                        <TextInput
                                            style={[styles.input, styles.priceInput, { color: palette.text.primary }]}
                                            placeholder="150"
                                            placeholderTextColor={palette.text.secondary}
                                            value={price}
                                            onChangeText={setPrice}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <View style={[styles.inputGroup, styles.gridItem]}>
                                    <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.lessonDuration')}</Text>
                                    <TouchableOpacity
                                        style={[styles.selectInput, { borderColor: palette.border, backgroundColor: palette.card }]}
                                        onPress={() => setShowDurationPicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.selectInputText, { color: palette.text.primary }]}>
                                            {getDurationOptions(t).find(opt => opt.value === duration)?.label || t('lessons.durations.60min')}
                                        </Text>
                                        <MaterialIcons
                                            name="keyboard-arrow-down"
                                            size={24}
                                            color={palette.text.secondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>
                    </View>

                    {/* Scheduling */}
                    <View style={styles.section}>
                        <Card style={styles.formCard}>
                            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.scheduling')}</Text>

                            <Text style={[styles.inputLabel, { color: palette.text.primary, marginTop: spacing.sm, marginHorizontal: spacing.md, marginBottom: spacing.xs }]}>{t('lessons.selectDays')}</Text>
                            <View style={styles.daysContainer}>
                                {WEEK_DAYS.map(day => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[
                                            styles.dayButton,
                                            { borderColor: palette.border },
                                            selectedDays.includes(day) && styles.dayButtonSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedDays(prev =>
                                                prev.includes(day)
                                                    ? prev.filter(d => d !== day)
                                                    : [...prev, day]
                                            );
                                        }}
                                    >
                                        <Text style={[
                                            styles.dayButtonText,
                                            { color: selectedDays.includes(day) ? '#ffffff' : palette.text.primary }
                                        ]}>
                                            {t(`lessons.shortDays.${day}`)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.gridRow}>
                                <View style={[styles.inputGroup, styles.gridItem, { marginTop: spacing.md }]}>
                                    <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.selectTime')}</Text>
                                    <TouchableOpacity
                                        style={[styles.dateTimeInput, { borderColor: palette.border, backgroundColor: palette.card }]}
                                        onPress={() => setShowTimePicker(true)}
                                    >
                                        <MaterialIcons name="schedule" size={20} color={palette.text.secondary} />
                                        <Text style={[styles.dateTimeText, { color: selectedTime ? palette.text.primary : palette.text.secondary }]}>
                                            {selectedTime ? formatTime(selectedTime) : t('lessons.timePlaceholder')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>
                    </View>

                    {/* Location or Instructor Selection depending on User Role */}
                    <View style={styles.section}>
                        <Card style={styles.formCard}>
                            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.instructorSelection') || 'Eğitmen Seçimi'}</Text>

                            {/* Instructor Selector Box */}
                            <View style={[styles.formFields, { paddingTop: spacing.sm }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.selectInstructor') || 'Bu kursu kim(ler) verecek?'}</Text>
                                    <TouchableOpacity
                                        style={[styles.selectInput, { borderColor: palette.border, backgroundColor: palette.card }]}
                                        onPress={() => setShowInstructorPicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.selectInputText, { color: selectedInstructors.length > 0 ? palette.text.primary : palette.text.secondary }]}>
                                            {selectedInstructors.length > 0
                                                ? (selectedInstructors.length > 1
                                                    ? `${selectedInstructors[0].name} ve +${selectedInstructors.length - 1} diğer eğitmen`
                                                    : selectedInstructors[0].name)
                                                : (t('lessons.selectInstructorPlaceholder') || 'Bir eğitmen seçin')}
                                        </Text>
                                        <MaterialIcons
                                            name="keyboard-arrow-down"
                                            size={24}
                                            color={palette.text.secondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>
                    </View>

                    {/* Location Selection depending on User Role */}
                    {!isSchool && (
                        <View style={styles.section}>
                            <Card style={styles.formCard}>
                                <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.locationSelection')}</Text>

                                {/* Location Type Toggle */}
                                <View style={[styles.formFields, { paddingTop: spacing.sm }]}>
                                    <View style={styles.locationTypeContainer}>
                                        <TouchableOpacity
                                            style={[
                                                styles.locationTypeButton,
                                                { borderColor: palette.border },
                                                locationType === 'school' && [styles.locationTypeButtonActive, { backgroundColor: palette.secondary }]
                                            ]}
                                            onPress={() => setLocationType('school')}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialIcons
                                                name="school"
                                                size={20}
                                                color={locationType === 'school' ? '#ffffff' : palette.text.secondary}
                                            />
                                            <Text style={[
                                                styles.locationTypeText,
                                                { color: locationType === 'school' ? '#ffffff' : palette.text.primary }
                                            ]}>
                                                {t('lessons.danceSchool')}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.locationTypeButton,
                                                { borderColor: palette.border },
                                                locationType === 'custom' && [styles.locationTypeButtonActive, { backgroundColor: palette.secondary }]
                                            ]}
                                            onPress={() => setLocationType('custom')}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialIcons
                                                name="location-on"
                                                size={20}
                                                color={locationType === 'custom' ? '#ffffff' : palette.text.secondary}
                                            />
                                            <Text style={[
                                                styles.locationTypeText,
                                                { color: locationType === 'custom' ? '#ffffff' : palette.text.primary }
                                            ]}>
                                                {t('lessons.customAddress')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* School Selector */}
                                    {locationType === 'school' && (
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.selectDanceSchool')}</Text>
                                            <TouchableOpacity
                                                style={[styles.selectInput, { borderColor: palette.border, backgroundColor: palette.card }]}
                                                onPress={() => setShowSchoolPicker(true)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.selectInputText, { color: selectedSchool ? palette.text.primary : palette.text.secondary }]}>
                                                    {selectedSchool?.name || t('lessons.selectDanceSchool')}
                                                </Text>
                                                <MaterialIcons
                                                    name="keyboard-arrow-down"
                                                    size={24}
                                                    color={palette.text.secondary}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Custom Address Input */}
                                    {locationType === 'custom' && (
                                        <>
                                            <View style={styles.inputGroup}>
                                                <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('location.countryLabel')} / {t('location.cityLabel')} <Text style={{ color: '#ef4444' }}>*</Text></Text>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.selectInput,
                                                        {
                                                            borderColor: palette.border,
                                                            backgroundColor: palette.card,
                                                        },
                                                    ]}
                                                    onPress={() => setLocationPickerVisible(true)}
                                                >
                                                    <Text style={[
                                                        styles.selectInputText,
                                                        { color: customCountry || customCity ? palette.text.primary : palette.text.secondary },
                                                    ]}>
                                                        {customCountry
                                                            ? (customCity ? `${customCountry} · ${customCity}` : customCountry)
                                                            : (t('location.selectCountry') || 'Ülke Seç...')}
                                                    </Text>
                                                    <MaterialIcons name="chevron-right" size={24} color={palette.text.secondary} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.enterCustomAddress')}</Text>
                                                <TextInput
                                                    style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                                                    placeholder={t('lessons.addressPlaceholder')}
                                                    placeholderTextColor={palette.text.secondary}
                                                    value={customAddress}
                                                    onChangeText={setCustomAddress}
                                                    multiline
                                                    numberOfLines={2}
                                                />
                                            </View>
                                        </>
                                    )}
                                </View>
                            </Card>
                        </View>
                    )}

                    {/* Bottom spacing for button */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fixed Bottom Button */}
            <SafeAreaView edges={['bottom']} style={[styles.bottomButtonContainer, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: palette.secondary }]}
                    onPress={() => handleSave(user?.role === 'draft-instructor' || user?.role === 'draft-school')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.createButtonText}>
                        {(user?.role === 'draft-instructor' || user?.role === 'draft-school') ? (t('lessons.saveAsDraft') || 'Taslak Olarak Kaydet') : t('lessons.save')}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>

            {/* Image Picker Modal */}
            <Modal
                visible={showImagePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowImagePicker(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: palette.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                            <Text style={[styles.modalTitle, { color: palette.text.primary }]}>{t('lessons.selectLessonImage')}</Text>
                            <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                                <MaterialIcons name="close" size={24} color={palette.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Gallery Upload Option */}
                        <TouchableOpacity
                            style={[
                                styles.galleryUploadBtn,
                                { backgroundColor: palette.secondary + '15', borderColor: palette.secondary }
                            ]}
                            disabled={uploadingCover}
                            onPress={async () => {
                                const result = await ImagePicker.launchImageLibraryAsync({
                                    mediaTypes: ['images'],
                                    allowsEditing: true,
                                    aspect: [16, 9],
                                    quality: 1,
                                });
                                if (result.canceled || !result.assets?.[0] || !user?.id) return;
                                setShowImagePicker(false);
                                setUploadingCover(true);
                                setCoverUploadProgress(0);
                                try {
                                    // Use a temp courseId placeholder; real courseId assigned on save
                                    const tempId = `temp-${Date.now()}`;
                                    const url = await uploadCourseCover(
                                        tempId,
                                        user.id,
                                        result.assets[0].uri,
                                        (p) => setCoverUploadProgress(p.percent)
                                    );
                                    setSelectedImage(url);
                                } catch (err: any) {
                                    Alert.alert('Yukleme Hatasi', err.message || 'Gorsel yuklenemedi.');
                                } finally {
                                    setUploadingCover(false);
                                    setCoverUploadProgress(0);
                                }
                            }}
                        >
                            {uploadingCover ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <ActivityIndicator size="small" color={palette.secondary} />
                                    <Text style={[styles.galleryUploadText, { color: palette.secondary }]}>
                                        Yukleniyor {coverUploadProgress}%
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <MaterialIcons name="photo-library" size={20} color={palette.secondary} />
                                    <Text style={[styles.galleryUploadText, { color: palette.secondary }]}>
                                        Telefondan Gorsel Yukle
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.orDivider, { color: palette.text.secondary }]}>— veya hazir gorseller —</Text>

                        <FlatList
                            data={availableImages}
                            numColumns={2}
                            keyExtractor={(item, index) => index.toString()}
                            columnWrapperStyle={styles.imageListRow}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.imageOption,
                                        selectedImage === item && styles.imageOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedImage(item);
                                        setShowImagePicker(false);
                                    }}
                                >
                                    <Image source={getImageSource(item)} style={styles.imageOptionImage} resizeMode="cover" />
                                    {selectedImage === item && (
                                        <View style={styles.imageOptionCheck}>
                                            <MaterialIcons name="check-circle" size={24} color="#ffffff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.imageListContent}
                        />
                    </View>
                </View>
            </Modal>



            {/* Time Picker */}
            {showTimePicker && (
                Platform.OS === 'ios' ? (
                    <Modal
                        visible={showTimePicker}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setShowTimePicker(false)}
                    >
                        <View style={[styles.pickerModalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                            <View style={[styles.pickerModalContent, { backgroundColor: palette.card }]}>
                                <View style={[styles.pickerModalHeader, { borderBottomColor: palette.border }]}>
                                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                        <Text style={[styles.pickerModalButton, { color: palette.text.secondary }]}>{t('common.cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.pickerModalTitle, { color: palette.text.primary }]}>{t('lessons.selectTime')}</Text>
                                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                        <Text style={[styles.pickerModalButton, { color: palette.primary }]}>{t('common.done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={selectedTime || new Date()}
                                    mode="time"
                                    display="spinner"
                                    onChange={(event, time) => {
                                        if (event.type === 'set' && time) {
                                            setSelectedTime(time);
                                        }
                                    }}
                                    textColor={palette.text.primary}
                                    themeVariant={isDarkMode ? 'dark' : 'light'}
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={selectedTime || new Date()}
                        mode="time"
                        display="default"
                        onChange={(event, time) => {
                            setShowTimePicker(false);
                            if (event.type === 'set' && time) {
                                setSelectedTime(time);
                            }
                        }}
                    />
                )
            )}

            {/* Dance Type Picker Modal */}
            <Modal
                visible={showDanceTypePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDanceTypePicker(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: palette.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                            <Text style={[styles.modalTitle, { color: palette.text.primary }]}>{t('lessons.selectDanceTypeTitle')}</Text>
                            <TouchableOpacity onPress={() => setShowDanceTypePicker(false)}>
                                <MaterialIcons name="close" size={24} color={palette.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={DANCE_TYPES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.pickerOption,
                                        { borderBottomColor: palette.border },
                                        danceType === item && styles.pickerOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setDanceType(item);
                                        setSelectedImage(null); // Reset image when dance type changes
                                        setShowDanceTypePicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            { color: palette.text.primary },
                                            danceType === item && styles.pickerOptionTextSelected,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    {danceType === item && (
                                        <MaterialIcons
                                            name="check"
                                            size={24}
                                            color={colors.instructor.secondary}
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.pickerListContent}
                        />
                    </View>
                </View>
            </Modal>

            {/* Duration Picker Modal */}
            <Modal
                visible={showDurationPicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDurationPicker(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: palette.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                            <Text style={[styles.modalTitle, { color: palette.text.primary }]}>{t('lessons.selectDuration')}</Text>
                            <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                                <MaterialIcons name="close" size={24} color={palette.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={getDurationOptions(t)}
                            keyExtractor={(item) => item.value.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.pickerOption,
                                        { borderBottomColor: palette.border },
                                        duration === item.value && styles.pickerOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setDuration(item.value);
                                        setShowDurationPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            { color: palette.text.primary },
                                            duration === item.value && styles.pickerOptionTextSelected,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {duration === item.value && (
                                        <MaterialIcons
                                            name="check"
                                            size={24}
                                            color={colors.instructor.secondary}
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.pickerListContent}
                        />
                    </View>
                </View>
            </Modal>

            {/* Location Picker Modal */}
            <LocationPickerModal
                visible={locationPickerVisible}
                onClose={() => setLocationPickerVisible(false)}
                selectedCountry={customCountry || DEFAULT_COUNTRY}
                selectedCity={customCity}
                onConfirm={(country, city) => {
                    setCustomCountry(country);
                    setCustomCity(city);
                }}
            />

            {/* Instructor Multi-Select Modal */}
            <InstructorMultiSelectModal
                visible={showInstructorPicker}
                onClose={() => setShowInstructorPicker(false)}
                instructors={instructors}
                selectedInstructors={selectedInstructors}
                onSave={(selected) => {
                    setSelectedInstructors(selected);
                    setShowInstructorPicker(false);
                }}
                palette={palette}
                isDarkMode={isDarkMode}
                lockedInstructorId={!isSchool ? user?.id : undefined}
            />

            {/* School Picker Modal */}
            <Modal
                visible={showSchoolPicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSchoolPicker(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: palette.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                            <Text style={[styles.modalTitle, { color: palette.text.primary }]}>{t('lessons.selectDanceSchool')}</Text>
                            <TouchableOpacity onPress={() => setShowSchoolPicker(false)}>
                                <MaterialIcons name="close" size={24} color={palette.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={danceSchools}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.pickerOption,
                                        { borderBottomColor: palette.border },
                                        selectedSchool?.id === item.id && styles.pickerOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedSchool(item);
                                        setShowSchoolPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            { color: palette.text.primary },
                                            selectedSchool?.id === item.id && styles.pickerOptionTextSelected,
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                    {selectedSchool?.id === item.id && (
                                        <MaterialIcons
                                            name="check"
                                            size={24}
                                            color={colors.instructor.secondary}
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.pickerListContent}
                            ListEmptyComponent={
                                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                    <Text style={{ color: palette.text.secondary }}>{t('lessons.noDanceSchools')}</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingTop: 10,
    },
    section: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
    },
    imageCard: {
        padding: 0,
        paddingTop: spacing.md,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    formCard: {
        padding: 0,
        overflow: 'hidden',
    },
    sectionLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing.xs,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        letterSpacing: -0.015,
    },
    imageUploadContainer: {
        width: '100%',
        alignSelf: 'flex-start',
        flexShrink: 1,
    },
    imageUploadPlaceholder: {
        width: '100%',
        height: 128,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    imageUploadText: {
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
    },
    imageUploadTextBold: {
        fontWeight: typography.fontWeight.bold,
    },
    imageUploadSubtext: {
        fontSize: typography.fontSize.xs,
    },
    selectedImageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        maxHeight: 200,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        position: 'relative',
    },
    selectedImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    imageOverlayText: {
        color: '#ffffff',
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    formFields: {
        padding: spacing.md,
        paddingTop: 0,
        gap: spacing.md,
    },
    inputGroup: {
        gap: spacing.sm,
    },
    inputLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        fontSize: typography.fontSize.base,
    },
    textArea: {
        height: 128,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    selectInput: {
        height: 48,
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    selectInputText: {
        flex: 1,
        fontSize: typography.fontSize.base,
    },
    gridRow: {
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
        paddingTop: 0,
    },
    gridItem: {
        flex: 1,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        paddingLeft: spacing.md,
    },
    currencySymbol: {
        fontSize: typography.fontSize.base,
        marginRight: spacing.xs,
    },
    priceInput: {
        flex: 1,
        borderWidth: 0,
        paddingLeft: 0,
    },
    dateTimeInput: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    dateTimeText: {
        flex: 1,
        fontSize: typography.fontSize.base,
    },
    placeholderText: {
        // Color will be set dynamically
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxLabel: {
        fontSize: typography.fontSize.base,
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        padding: spacing.md,
    },
    createButton: {
        height: 48,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: '#ffffff',
    },
    pickerModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    pickerModalContent: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingBottom: spacing.lg,
        maxHeight: '50%',
    },
    pickerModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    pickerModalTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    pickerModalButton: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '80%',
        paddingBottom: spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    imageListContent: {
        padding: spacing.md,
        gap: spacing.md,
    },
    imageListRow: {
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    imageOption: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    imageOptionSelected: {
        borderWidth: 3,
        borderColor: colors.instructor.secondary,
    },
    imageOptionImage: {
        width: '100%',
        height: '100%',
    },
    imageOptionCheck: {
        position: 'absolute',
        top: spacing.xs,
        right: spacing.xs,
        backgroundColor: colors.instructor.secondary,
        borderRadius: borderRadius.full,
    },
    pickerListContent: {
        padding: spacing.md,
    },
    warningBanner: {
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    warningText: {
        marginLeft: spacing.sm,
        fontSize: typography.fontSize.sm,
        flex: 1,
        lineHeight: 20,
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
    },
    pickerOptionSelected: {
        backgroundColor: `${colors.instructor.secondary}10`,
    },
    pickerOptionText: {
        fontSize: typography.fontSize.base,
    },
    pickerOptionTextSelected: {
        fontWeight: typography.fontWeight.bold,
        color: colors.instructor.secondary,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        justifyContent: 'space-between',
    },
    dayButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    dayButtonSelected: {
        backgroundColor: colors.instructor.secondary,
        borderColor: colors.instructor.secondary,
    },
    dayButtonText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
    },
    dayButtonTextSelected: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    locationTypeContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    locationTypeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        height: 48,
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
    },
    locationTypeButtonActive: {
        borderColor: 'transparent',
    },
    locationTypeText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    galleryUploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    galleryUploadText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    orDivider: {
        textAlign: 'center',
        fontSize: typography.fontSize.xs,
        marginVertical: spacing.md,
    },
});

