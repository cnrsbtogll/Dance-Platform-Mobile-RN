import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, FlatList, Platform, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../../utils/i18n';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../../components/common/Card';
import { LessonFormStepper } from '../../components/common/LessonFormStepper';
import { InstructorMultiSelectModal } from '../../components/common/InstructorMultiSelectModal';
import { LocationPickerModal } from '../../components/common/LocationPickerModal';
import { AddStudentModal } from '../../components/instructor/AddStudentModal';

import { MockDataService } from '../../services/mockDataService';
import { FirestoreService } from '../../services/firebase/firestore';
import { useLessonStore } from '../../store/useLessonStore';
import { Lesson } from '../../types';
import { CURRENCY_SYMBOLS, normalizeDaysOfWeek } from '../../utils/helpers';
import { getImageSource } from '../../utils/imageHelper';
import { uploadCourseCover } from '../../services/storageService';
import { useDanceStyles } from '../../hooks/useDanceStyles';
import { DANCE_STYLE_IMAGE_MAPPING, DANCE_STYLES, DANCE_STYLE_DESCRIPTIONS } from '../../utils/constants';

const MINIO_BASE_URL = 'https://minio-sdk.cnrsbtogll.store/feriha-danceapp/public/lessons';

const getPredefinedImages = (danceType: string) => {
    const folder = DANCE_STYLE_IMAGE_MAPPING[danceType];
    if (!folder) return [];
    return [1, 2, 3, 4].map(num => `${MINIO_BASE_URL}/${folder}/${folder}-${num}.jpeg`);
};
const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const getDurationOptions = (t: any) => [
    { label: t('lessons.durations.45min'), value: 45 },
    { label: t('lessons.durations.60min'), value: 60 },
    { label: t('lessons.durations.90min'), value: 90 },
];

export const EditLessonScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { t } = useTranslation();
    const params = route.params as { lessonId?: string } | undefined;
    const lessonId = params?.lessonId;
    const { isDarkMode } = useThemeStore();
    const { user } = useAuthStore();
    const { updateLesson } = useLessonStore();
    const isSchoolRoles = ['draft-school', 'school'];
    const isSchool = user?.role ? isSchoolRoles.includes(user.role) : false;
    const palette = getPalette(isSchool ? 'school' : 'instructor', isDarkMode);

    const { danceStyles, loading: loadingStyles } = useDanceStyles();

    const currency = user?.currency || 'TRY';
    const currencySymbol = CURRENCY_SYMBOLS[currency];

    // State variables
    const [lessonData, setLessonData] = useState<Lesson | null>(null);
    const [title, setTitle] = useState('');
    const [danceType, setDanceType] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('150');
    const [duration, setDuration] = useState(60);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);

    // Step states
    const [currentStep, setCurrentStep] = useState(1);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [maxParticipants, setMaxParticipants] = useState('');


    // Image selection state
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
    const [showSchoolPicker, setShowSchoolPicker] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [danceSchools, setDanceSchools] = useState<{ id: string; name: string }[]>([]);
    const [loadingSchools, setLoadingSchools] = useState(false);

    // Instructor picker state for schools
    const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
    const [selectedInstructors, setSelectedInstructors] = useState<{ id: string; name: string }[]>([]);
    const [showInstructorPicker, setShowInstructorPicker] = useState(false);
    const [loadingInstructors, setLoadingInstructors] = useState(false);

    // Add student modal state
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);

    const availableImages = danceType ? getPredefinedImages(danceType) : [];

    // Fetch dance schools or instructors from Firebase
    useEffect(() => {
        const fetchInstructors = async () => {
            setLoadingInstructors(true);
            try {
                const instructorsData = await FirestoreService.getInstructors();
                const mappedInstructors = instructorsData.map((inst: any) => ({
                    id: inst.id,
                    name: inst.displayName || (inst.firstName ? inst.firstName + (inst.lastName ? ' ' + inst.lastName : '') : 'İsimsiz Eğitmen')
                }));
                // Make sure the current instructor is also in the list if applicable
                if (!isSchool && user) {
                    const currentInstructor = {
                        id: user.id,
                        name: user.displayName || (user.firstName ? user.firstName + (user.lastName ? ' ' + user.lastName : '') : 'Eğitmen')
                    };
                    if (!mappedInstructors.some(i => i.id === user.id)) {
                        mappedInstructors.push(currentInstructor);
                    }
                }
                setInstructors(mappedInstructors);
            } catch (error) {
                console.error('Error fetching instructors:', error);
            } finally {
                setLoadingInstructors(false);
            }
        };
        fetchInstructors();

        if (!isSchool) {
            const fetchDanceSchools = async () => {
                setLoadingSchools(true);
                try {
                    const schools = await FirestoreService.getDanceSchools();
                    setDanceSchools(schools.map(school => ({
                        id: school.id,
                        name: school.name
                    })));
                } catch (error) {
                    console.error('Error fetching dance schools:', error);
                } finally {
                    setLoadingSchools(false);
                }
            };
            fetchDanceSchools();
        }
    }, [isSchool, user]);

    // Fetch lesson data on mount
    useEffect(() => {
        const fetchLesson = async () => {
            if (lessonId) {
                try {
                    const data = await FirestoreService.getLessonById(lessonId);
                    if (data) {
                        setLessonData(data);
                        setTitle(data.title || data.name || '');
                        setDanceType(data.danceStyle || data.category || '');
                        setDescription(data.description || '');
                        setPrice(data.price?.toString() || '');
                        setDuration(data.duration || 60);

                        if (data.daysOfWeek && Array.isArray(data.daysOfWeek)) {
                            // Normalize days to ensure they are in English keys
                            const normalizedDays = normalizeDaysOfWeek(data.daysOfWeek);
                            setSelectedDays(normalizedDays);
                        }

                        if (data.time) {
                            const [hours, minutes] = data.time.split(':');
                            const date = new Date();
                            date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                            setSelectedTime(date);
                        }

                        if (data.maxParticipants) {
                            setMaxParticipants(data.maxParticipants.toString());
                        }

                        // Handle location
                        if (data.location) {
                            setLocationType(data.location.type);
                            if (data.location.type === 'school' && data.location.schoolId && data.location.schoolName) {
                                setSelectedSchool({
                                    id: data.location.schoolId,
                                    name: data.location.schoolName,
                                });
                            } else if (data.location.type === 'custom') {
                                if (data.location.customAddress) setCustomAddress(data.location.customAddress);
                                if (data.location.customCountry) setCustomCountry(data.location.customCountry);
                                if (data.location.customCity) setCustomCity(data.location.customCity);
                            }
                        }

                        // Instructor setup
                        if (data.instructorIds && data.instructorIds.length > 0) {
                            const mapped = data.instructorIds.map((id, index) => ({
                                id,
                                name: data.instructorNames?.[index] || ''
                            }));
                            setSelectedInstructors(mapped);
                        } else if (data.instructorId) {
                            setSelectedInstructors([{ id: data.instructorId, name: data.instructorName || '' }]);
                        } else if (!isSchool && user) {
                            setSelectedInstructors([{
                                id: user.id,
                                name: user.firstName + (user.lastName ? ' ' + user.lastName : '') || 'Eğitmen'
                            }]);
                        }

                        // Handle image
                        if (data.category || data.danceStyle) {
                            const category = data.category || data.danceStyle;
                            const currentAvailableImages = getPredefinedImages(category);

                            if (data.imageUrl) {
                                if (typeof data.imageUrl === 'number') {
                                    setSelectedImage(data.imageUrl);
                                } else {
                                    // Fallback to first image of category
                                    const fallbackImage = currentAvailableImages[0];
                                    setSelectedImage(fallbackImage);
                                }
                            } else {
                                // No imageUrl, use first available image
                                const fallbackImage = currentAvailableImages[0];
                                setSelectedImage(fallbackImage);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching lesson:', error);
                    Alert.alert(t('common.error'), 'Failed to load lesson details');
                }
            }
        };
        fetchLesson();
    }, [lessonId]);






    // Fill description with the default text for the selected dance type
    const handleDraftDescription = () => {
        if (!danceType) return;
        const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
        const desc = DANCE_STYLE_DESCRIPTIONS[danceType]?.[lang as 'tr' | 'en'];
        if (desc) setDescription(desc);
    };

    const validateStep = (step: number): Record<string, string> => {
        const errors: Record<string, string> = {};
        if (step === 1) {
            if (!danceType) errors.danceType = t('lessons.selectDanceType');
            if (!selectedImage) errors.selectedImage = t('lessons.selectImageFirst');
        } else if (step === 2) {
            if (!title.trim()) errors.title = t('lessons.lessonTitlePlaceholder');
            if (!description.trim()) errors.description = t('lessons.descriptionPlaceholder');
            if (!price || isNaN(Number(price)) || Number(price) <= 0) errors.price = t('lessons.price');
        } else if (step === 3) {
            if (selectedDays.length === 0) errors.selectedDays = t('lessons.selectDayError');
            if (!selectedTime) errors.selectedTime = t('lessons.selectTimeError');
        } else if (step === 4) {
            if (selectedInstructors.length === 0) errors.instructor = t('lessons.selectInstructorError');
            if (!maxParticipants || isNaN(Number(maxParticipants)) || Number(maxParticipants) < 1)
                errors.maxParticipants = t('lessons.selectCapacityError');
            if (!isSchool) {
                if (locationType === 'school' && !selectedSchool) errors.location = t('lessons.selectSchoolError');
                if (locationType === 'custom' && (!customCountry || !customCity)) errors.location = t('lessons.selectCountryCityError');
                if (locationType === 'custom' && !customAddress.trim()) errors.address = t('lessons.enterAddressError');
            }
        }
        return errors;
    };

    const handleNextStep = () => {
        const errors = validateStep(currentStep);
        if (Object.keys(errors).length > 0) {
            setStepErrors(errors);
            return;
        }
        setStepErrors({});
        setCurrentStep(prev => prev + 1);
    };

    const handlePrevStep = () => {
        setStepErrors({});
        setCurrentStep(prev => prev - 1);
    };

    const formatTime = (date: Date | null): string => {
        if (!date) return '';
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleSave = async () => {
        const errors = validateStep(4);
        if (Object.keys(errors).length > 0) {
            setStepErrors(errors);
            Alert.alert(t('common.error'), t('lessons.fillAllFields') || 'Lütfen zorunlu alanları doldurun.');
            return;
        }

        try {
            if (lessonId) {
                const updateData: any = {
                    title,
                    name: title,
                    description,
                    danceStyle: danceType,
                    category: danceType,
                    price: parseFloat(price),
                    duration,
                    daysOfWeek: selectedDays,

                    maxParticipants: Number(maxParticipants),
                };

                // Regenerate tags and highlights to keep them in sync
                const level = lessonData?.level || 'beginner';
                updateData.tags = [
                    danceType.toLowerCase(),
                    level.toLowerCase(),
                    `${duration} ${t('common.minutes').toLowerCase()}`
                ];

                updateData.highlights = [
                    `${duration} ${t('common.minutes')} ${t('lessons.durationSuffix') || ''}`,
                    `${t(`lessons.levels.${level}`) || level} ${t('lessons.levelSuffix') || ''}`,
                    t('lessons.instructorSuffix') || 'With experienced instructors'
                ];

                // Only add time if it's defined
                if (selectedTime) {
                    updateData.time = formatTime(selectedTime);
                }

                // Only add imageUrl if it's defined
                if (selectedImage) {
                    updateData.imageUrl = selectedImage;
                }

                // Update instructors for BOTH
                updateData.instructorIds = selectedInstructors.map(i => i.id);
                updateData.instructorNames = selectedInstructors.map(i => i.name);

                if (isSchool) {
                    updateData.instructorId = selectedInstructors.length > 0 ? selectedInstructors[0].id : '';
                    updateData.instructorName = selectedInstructors.length > 0 ? selectedInstructors[0].name : '';
                } else {
                    updateData.instructorId = user?.id || '';
                    updateData.instructorName = user?.displayName || (user?.firstName ? user.firstName + (user.lastName ? ' ' + user.lastName : '') : 'Eğitmen');

                    // Update location
                    if (locationType === 'school' && selectedSchool) {
                        updateData.schoolId = selectedSchool.id;
                        updateData.schoolName = selectedSchool.name;
                        updateData.location = {
                            type: 'school',
                            schoolId: selectedSchool.id,
                            schoolName: selectedSchool.name,
                        };
                    } else if (locationType === 'custom') {
                        if (!customCountry || !customCity || !customAddress) {
                            Alert.alert(t('common.error'), t('lessons.fillAddressFields') || 'Lütfen ülke, il ve adres alanlarını doldurun.');
                            return;
                        }
                        updateData.location = {
                            type: 'custom',
                            customAddress: customAddress,
                            customCountry: customCountry,
                            customCity: customCity,
                        };
                    } else if (lessonData?.location) {
                        updateData.location = lessonData.location; // Fallback to existing location
                    }
                }

                await FirestoreService.updateLesson(lessonId, updateData);
                updateLesson(lessonId, updateData);
                Alert.alert(t('common.success'), t('lessons.lessonUpdated'), [
                    { text: t('common.ok'), onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Error updating lesson:', error);
            Alert.alert(t('common.error'), 'Failed to update lesson');
        }
    };

    const handleToggleActive = async () => {
        if (!lessonId || !lessonData) return;

        // Only block activation (not deactivation). Verified instructors can toggle freely.
        const isActivating = !lessonData.isActive;
        if (isActivating && user?.role !== 'instructor') {
            Alert.alert(
                t('instructor.verificationRequired') || 'Kimlik Doğrulaması Gerekiyor',
                t('instructor.verificationDesc') || 'Kurslarınızı yayınlayabilmek için kimlik doğrulaması yapmanız gerekmektedir.',
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('instructor.verifyNow') || 'Hemen Doğrula',
                        onPress: () => {
                            // @ts-ignore
                            navigation.navigate('Verification');
                        }
                    }
                ]
            );
            return;
        }

        try {
            const newStatus = !lessonData.isActive;
            await FirestoreService.updateLesson(lessonId, { isActive: newStatus });
            updateLesson(lessonId, {
                isActive: newStatus,
                status: newStatus ? 'active' : 'inactive'
            });

            setLessonData({ ...lessonData, isActive: newStatus });

            Alert.alert(
                t('common.success'),
                newStatus ? t('lessons.lessonActivated') : t('lessons.lessonDeactivated')
            );
        } catch (error) {
            console.error('Error toggling status:', error);
            Alert.alert(t('common.error'), 'Failed to update status');
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
            {/* STEP PROGRESS */}
            <LessonFormStepper
                currentStep={currentStep}
                totalSteps={4}
                stepTitles={[
                    t('lessons.step1Title'),
                    t('lessons.step2Title'),
                    t('lessons.step3Title'),
                    t('lessons.step4Title'),
                ]}
                accentColor={palette.secondary}
                textColor={palette.text.primary}
                subTextColor={palette.text.secondary}
                backgroundColor={palette.background}
            />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollViewContent, { paddingBottom: 100 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── STEP 1: Dance Type & Image ── */}
                    {currentStep === 1 && (
                        <>
                            <View style={styles.section}>
                                <Card style={styles.formCard}>
                                    <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.danceType')}</Text>
                                    <View style={styles.formFields}>
                                        <View style={styles.inputGroup}>
                                            <TouchableOpacity
                                                style={[styles.selectInput, { borderColor: stepErrors.danceType ? '#e53935' : palette.border, backgroundColor: palette.card }]}
                                                onPress={() => setShowDanceTypePicker(true)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.selectInputText, { color: danceType ? palette.text.primary : palette.text.secondary }]}>
                                                    {danceType || t('lessons.selectDanceType')}
                                                </Text>
                                                <MaterialIcons name="keyboard-arrow-down" size={24} color={palette.text.secondary} />
                                            </TouchableOpacity>
                                            {stepErrors.danceType && <Text style={styles.fieldError}>{stepErrors.danceType}</Text>}
                                        </View>
                                    </View>
                                </Card>
                            </View>
                            <View style={styles.section}>
                                <Card style={styles.imageCard}>
                                    <Text style={[styles.sectionLabel, { color: palette.text.primary }]}>{t('lessons.lessonImage')}</Text>
                                    {renderImagePicker()}
                                    {stepErrors.selectedImage && <Text style={[styles.fieldError, { marginTop: 4 }]}>{stepErrors.selectedImage}</Text>}
                                </Card>
                            </View>
                        </>
                    )}

                    {/* ── STEP 2: Basic Info ── */}
                    {currentStep === 2 && (
                        <>
                            <View style={styles.section}>
                                <Card style={styles.formCard}>
                                    <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.basicInfo')}</Text>
                                    <View style={styles.formFields}>
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.lessonTitle')}</Text>
                                            <TextInput
                                                style={[styles.input, { borderColor: stepErrors.title ? '#e53935' : palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                                                placeholder={t('lessons.lessonTitlePlaceholder')}
                                                placeholderTextColor={palette.text.secondary}
                                                value={title}
                                                onChangeText={setTitle}
                                            />
                                            {stepErrors.title && <Text style={styles.fieldError}>{stepErrors.title}</Text>}
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.description')}</Text>
                                            {danceType && DANCE_STYLE_DESCRIPTIONS[danceType] && (
                                                <TouchableOpacity
                                                    onPress={handleDraftDescription}
                                                    activeOpacity={0.7}
                                                    style={[styles.draftButton, { backgroundColor: palette.primary + '14', borderColor: palette.primary + '30' }]}
                                                >
                                                    <MaterialIcons name="auto-fix-high" size={14} color={palette.primary} />
                                                    <Text style={[styles.draftButtonText, { color: palette.primary }]}>{t('lessons.useDraftDescription')}</Text>
                                                </TouchableOpacity>
                                            )}
                                            <TextInput
                                                style={[styles.input, styles.textArea, { borderColor: stepErrors.description ? '#e53935' : palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                                                placeholder={t('lessons.descriptionPlaceholder')}
                                                placeholderTextColor={palette.text.secondary}
                                                value={description}
                                                onChangeText={setDescription}
                                                multiline
                                                numberOfLines={6}
                                                textAlignVertical="top"
                                            />
                                            {stepErrors.description && <Text style={styles.fieldError}>{stepErrors.description}</Text>}
                                        </View>
                                    </View>
                                </Card>
                            </View>
                            <View style={styles.section}>
                                <Card style={styles.formCard}>
                                    <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.pricing')} & {t('lessons.duration')}</Text>
                                    <View style={styles.gridRow}>
                                        <View style={[styles.inputGroup, styles.gridItem]}>
                                            <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.hourlyPrice')}</Text>
                                            <View style={[styles.priceInputContainer, { borderColor: stepErrors.price ? '#e53935' : palette.border, backgroundColor: palette.card }]}>
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
                                            {stepErrors.price && <Text style={styles.fieldError}>{stepErrors.price}</Text>}
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
                                                <MaterialIcons name="keyboard-arrow-down" size={24} color={palette.text.secondary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Card>
                            </View>
                        </>
                    )}

                    {/* ── STEP 3: Scheduling ── */}
                    {currentStep === 3 && (
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
                                                { borderColor: stepErrors.selectedDays ? '#e53935' : palette.border },
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
                                            <Text style={[styles.dayButtonText, { color: selectedDays.includes(day) ? '#ffffff' : palette.text.primary }]}>
                                                {t(`lessons.shortDays.${day}`)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {stepErrors.selectedDays && <Text style={[styles.fieldError, { marginHorizontal: spacing.md }]}>{stepErrors.selectedDays}</Text>}

                                <View style={styles.gridRow}>
                                    <View style={[styles.inputGroup, styles.gridItem, { marginTop: spacing.md }]}>
                                        <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.selectTime')}</Text>
                                        <TouchableOpacity
                                            style={[styles.dateTimeInput, { borderColor: stepErrors.selectedTime ? '#e53935' : palette.border, backgroundColor: palette.card }]}
                                            onPress={() => setShowTimePicker(true)}
                                        >
                                            <MaterialIcons name="schedule" size={20} color={palette.text.secondary} />
                                            <Text style={[styles.dateTimeText, { color: selectedTime ? palette.text.primary : palette.text.secondary }]}>
                                                {selectedTime ? formatTime(selectedTime) : t('lessons.timePlaceholder')}
                                            </Text>
                                        </TouchableOpacity>
                                        {stepErrors.selectedTime && <Text style={styles.fieldError}>{stepErrors.selectedTime}</Text>}
                                    </View>
                                </View>
                            </Card>
                        </View>
                    )}

                    {/* ── STEP 4: Instructor, Location & Capacity ── */}
                    {currentStep === 4 && (
                        <>
                            <View style={styles.section}>
                                <Card style={styles.formCard}>
                                    <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.instructorSelection') || 'Eğitmen Seçimi'}</Text>
                                    <View style={[styles.formFields, { paddingTop: spacing.sm }]}>
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.selectInstructor') || 'Bu kursu kim(ler) verecek?'}</Text>
                                            <TouchableOpacity
                                                style={[styles.selectInput, { borderColor: stepErrors.instructor ? '#e53935' : palette.border, backgroundColor: palette.card }]}
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
                                                <MaterialIcons name="keyboard-arrow-down" size={24} color={palette.text.secondary} />
                                            </TouchableOpacity>
                                            {stepErrors.instructor && <Text style={styles.fieldError}>{stepErrors.instructor}</Text>}
                                        </View>
                                    </View>
                                </Card>
                            </View>

                            {/* Location – only for instructors */}
                            {!isSchool && (
                                <View style={styles.section}>
                                    <Card style={styles.formCard}>
                                        <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.locationSelection')}</Text>
                                        <View style={[styles.formFields, { paddingTop: spacing.sm }]}>
                                            <View style={styles.locationTypeContainer}>
                                                <TouchableOpacity
                                                    style={[styles.locationTypeButton, { borderColor: palette.border }, locationType === 'school' && [styles.locationTypeButtonActive, { backgroundColor: palette.secondary }]]}
                                                    onPress={() => setLocationType('school')}
                                                    activeOpacity={0.7}
                                                >
                                                    <MaterialIcons name="school" size={20} color={locationType === 'school' ? '#ffffff' : palette.text.secondary} />
                                                    <Text style={[styles.locationTypeText, { color: locationType === 'school' ? '#ffffff' : palette.text.primary }]}>{t('lessons.danceSchool')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.locationTypeButton, { borderColor: palette.border }, locationType === 'custom' && [styles.locationTypeButtonActive, { backgroundColor: palette.secondary }]]}
                                                    onPress={() => setLocationType('custom')}
                                                    activeOpacity={0.7}
                                                >
                                                    <MaterialIcons name="location-on" size={20} color={locationType === 'custom' ? '#ffffff' : palette.text.secondary} />
                                                    <Text style={[styles.locationTypeText, { color: locationType === 'custom' ? '#ffffff' : palette.text.primary }]}>{t('lessons.customAddress')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {stepErrors.location && <Text style={styles.fieldError}>{stepErrors.location}</Text>}

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
                                                        <MaterialIcons name="keyboard-arrow-down" size={24} color={palette.text.secondary} />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                            {locationType === 'custom' && (
                                                <>
                                                    <View style={styles.inputGroup}>
                                                        <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('location.countryLabel')} / {t('location.cityLabel')} <Text style={{ color: '#ef4444' }}>*</Text></Text>
                                                        <TouchableOpacity
                                                            style={[styles.selectInput, { borderColor: palette.border, backgroundColor: palette.card }]}
                                                            onPress={() => setShowLocationPicker(true)}
                                                        >
                                                            <Text style={[styles.selectInputText, { color: customCountry || customCity ? palette.text.primary : palette.text.secondary }]}>
                                                                {customCountry ? (customCity ? `${customCountry} · ${customCity}` : customCountry) : (t('location.selectCountry') || 'Ülke Seç...')}
                                                            </Text>
                                                            <MaterialIcons name="chevron-right" size={24} color={palette.text.secondary} />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={styles.inputGroup}>
                                                        <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.enterCustomAddress')}</Text>
                                                        <TextInput
                                                            style={[styles.input, { borderColor: stepErrors.address ? '#e53935' : palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                                                            placeholder={t('lessons.addressPlaceholder')}
                                                            placeholderTextColor={palette.text.secondary}
                                                            value={customAddress}
                                                            onChangeText={setCustomAddress}
                                                            multiline
                                                            numberOfLines={2}
                                                        />
                                                        {stepErrors.address && <Text style={styles.fieldError}>{stepErrors.address}</Text>}
                                                    </View>
                                                </>
                                            )}
                                        </View>
                                    </Card>
                                </View>
                            )}

                            {/* Capacity */}
                            <View style={styles.section}>
                                <Card style={styles.formCard}>
                                    <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.capacityLabel')}</Text>
                                    <View style={[styles.formFields, { paddingTop: spacing.sm }]}>
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.maxParticipants')}</Text>
                                            <TextInput
                                                style={[styles.input, { borderColor: stepErrors.maxParticipants ? '#e53935' : palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                                                placeholder={t('lessons.capacityPlaceholder')}
                                                placeholderTextColor={palette.text.secondary}
                                                value={maxParticipants}
                                                onChangeText={setMaxParticipants}
                                                keyboardType="number-pad"
                                            />
                                            {stepErrors.maxParticipants && <Text style={styles.fieldError}>{stepErrors.maxParticipants}</Text>}
                                        </View>
                                    </View>
                                </Card>
                            </View>
                            {/* Edit Specific Action Buttons */}
                            <View style={[styles.section, { marginBottom: 0, marginTop: spacing.md }]}>
                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.secondary, marginBottom: spacing.md }]}
                                    onPress={() => setShowAddStudentModal(true)}
                                    activeOpacity={0.8}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                        <MaterialIcons name="person-add" size={20} color={palette.secondary} style={{ marginRight: spacing.sm }} />
                                        <Text style={[styles.saveButtonText, { color: palette.secondary }]}>{t('lessons.addStudent') || 'Öğrenci Ekle / Yönet'}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: lessonData?.isActive ? colors.general.warning : colors.general.success }]}
                                    onPress={handleToggleActive}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.saveButtonText}>
                                        {lessonData?.isActive ? t('lessons.deactivateLesson') : t('lessons.activateLesson')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                        </>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fixed Bottom Button */}
            <SafeAreaView edges={['bottom']} style={[styles.bottomButtonContainer, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    {currentStep > 1 && (
                        <TouchableOpacity
                            style={[styles.navigationButton, styles.backButton, { borderColor: palette.border }]}
                            onPress={handlePrevStep}
                        >
                            <Text style={[styles.navigationButtonText, { color: palette.text.primary }]}>{t('common.back') || 'Geri'}</Text>
                        </TouchableOpacity>
                    )}

                    {currentStep < 4 ? (
                        <TouchableOpacity
                            style={[styles.navigationButton, styles.nextButton, { backgroundColor: palette.secondary }]}
                            onPress={handleNextStep}
                        >
                            <Text style={[styles.navigationButtonText, { color: '#ffffff' }]}>{t('common.next')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.navigationButton, styles.saveButton, { backgroundColor: palette.primary }]}
                            onPress={() => handleSave()}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.navigationButtonText, { color: '#ffffff' }]}>
                                {t('lessons.saveChanges') || 'Değişiklikleri Kaydet'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>

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
                            data={danceStyles}
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
                                        setSelectedImage(null);
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
                                        <MaterialIcons name="check" size={24} color={palette.secondary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.pickerListContent}
                        />
                    </View>
                </View>
            </Modal>


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
                                    const targetId = lessonId || `temp-${Date.now()}`;
                                    const url = await uploadCourseCover(
                                        targetId,
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
                visible={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                selectedCountry={customCountry || 'Türkiye'}
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

            <AddStudentModal
                visible={showAddStudentModal}
                onClose={() => setShowAddStudentModal(false)}
                instructorId={user?.id || ''}
                isSchool={isSchool}
                initialLessonId={lessonId}
                onSuccess={() => {
                    setShowAddStudentModal(false);
                    // Refresh or show success message if needed
                }}
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
    draftButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 8,
    },
    draftButtonText: {
        fontSize: 12,
        fontWeight: '500',
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
    saveButton: {
        backgroundColor: colors.instructor.primary,
        height: 56,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        ...shadows.md,
    },

    navigationButton: {
        flex: 1,
        height: 48,
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    nextButton: {
    },
    navigationButtonText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    fieldError: {
        color: '#e53935',
        fontSize: typography.fontSize.xs,
        marginTop: 4,
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        padding: spacing.md,
    },

    saveButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: '#ffffff',
    },
    deleteButton: {
        backgroundColor: 'transparent',
        height: 56,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e53e3e',
    },
    deleteButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: '#e53e3e',
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

