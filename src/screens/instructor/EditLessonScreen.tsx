import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, FlatList, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../../components/common/Card';
import { MockDataService } from '../../services/mockDataService';
import { CURRENCY_SYMBOLS } from '../../utils/helpers';
import { getImageSource } from '../../utils/imageHelper';

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
    const palette = getPalette('instructor', isDarkMode);
    
    const currency = user?.currency || 'USD';
    const currencySymbol = CURRENCY_SYMBOLS[currency];

    const lesson = lessonId ? MockDataService.getLessonById(lessonId) : null;

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTitle: t('lessons.editLesson'),
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
    }, [navigation, isDarkMode, palette, t]);

    // Initialize state with lesson data
    const [title, setTitle] = useState(lesson?.title || '');
    const [danceType, setDanceType] = useState(lesson?.category || '');
    const [description, setDescription] = useState(lesson?.description || '');
    const [price, setPrice] = useState(lesson?.price?.toString() || '150');
    const [duration, setDuration] = useState(lesson?.duration || 60);
    const [selectedDate, setSelectedDate] = useState<Date | null>(
        lesson?.date ? new Date(lesson.date) : null
    );
    const [selectedTime, setSelectedTime] = useState<Date | null>(() => {
        if (lesson?.time) {
            const [hours, minutes] = lesson.time.split(':');
            const date = new Date();
            date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            return date;
        }
        return null;
    });
    const [recurring, setRecurring] = useState(false);
    
    // Initialize selectedImage from lesson imageUrl
    const getInitialSelectedImage = () => {
        if (!lesson?.imageUrl || !lesson?.category) return null;
        const availableImages = LESSON_IMAGES[lesson.category] || [];
        if (availableImages.length === 0) return null;
        
        // Try to match by filename pattern (e.g., "salsa-1.jpeg" -> first image in Salsa array)
        const imageUrlString = lesson.imageUrl;
        const filename = imageUrlString.split('/').pop() || imageUrlString;
        
        // Extract number from filename (e.g., "salsa-1.jpeg" -> 1)
        const match = filename.match(/-(\d+)\./);
        if (match) {
            const index = parseInt(match[1], 10) - 1;
            if (index >= 0 && index < availableImages.length) {
                return availableImages[index];
            }
        }
        
        // Fallback: use first image
        return availableImages[0];
    };
    
    const [selectedImage, setSelectedImage] = useState<any>(getInitialSelectedImage());
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDanceTypePicker, setShowDanceTypePicker] = useState(false);
    const [showDurationPicker, setShowDurationPicker] = useState(false);

    const availableImages = danceType ? LESSON_IMAGES[danceType] || [] : [];

    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const formatTime = (date: Date | null): string => {
        if (!date) return '';
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleSave = () => {
        if (!title || !danceType || !description || !price) {
            Alert.alert(t('common.error'), t('lessons.fillAllFields'));
            return;
        }
        // Update lesson logic here
        console.log('Updating lesson:', {
            lessonId,
            title,
            danceType,
            description,
            price,
            duration,
            date: selectedDate,
            time: selectedTime,
            selectedImage
        });
        Alert.alert(t('common.success'), t('lessons.lessonUpdated'), [
            { text: t('common.ok'), onPress: () => navigation.goBack() }
        ]);
    };

    const handleDelete = () => {
        Alert.alert(
            t('lessons.deleteLesson'),
            t('lessons.deleteLessonConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('lessons.delete'),
                    style: 'destructive',
                    onPress: () => {
                        // Delete lesson logic here
                        console.log('Deleting lesson:', lessonId);
                        Alert.alert(t('common.success'), t('lessons.lessonDeleted'), [
                            { text: t('common.ok'), onPress: () => navigation.goBack() }
                        ]);
                    }
                }
            ]
        );
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
            <ScrollView
                style={[styles.scrollView, { backgroundColor: palette.background }]}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
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
                                    placeholder={t('lessons.enterLessonTitle')}
                                    placeholderTextColor={palette.text.secondary}
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.description')}</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                                    placeholder={t('lessons.enterLessonDescription')}
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
                                <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.price')}</Text>
                                <View style={[styles.priceInputContainer, { borderColor: palette.border, backgroundColor: palette.card }]}>
                                    <Text style={[styles.currencySymbol, { color: palette.text.secondary }]}>{currencySymbol}</Text>
                                    <TextInput
                                        style={[styles.input, styles.priceInput, { color: palette.text.primary }]}
                                        placeholder="0.00"
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
                        <View style={styles.gridRow}>
                            <View style={[styles.inputGroup, styles.gridItem]}>
                                <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.selectDate')}</Text>
                                <TouchableOpacity
                                    style={[styles.dateTimeInput, { borderColor: palette.border, backgroundColor: palette.card }]}
                                    onPress={() => setShowDatePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons name="calendar-month" size={20} color={palette.text.secondary} />
                                    <Text style={[styles.dateTimeText, { color: selectedDate ? palette.text.primary : palette.text.secondary }]}>
                                        {selectedDate ? formatDate(selectedDate) : t('lessons.datePlaceholder')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.inputGroup, styles.gridItem]}>
                                <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.selectTime')}</Text>
                                <TouchableOpacity
                                    style={[styles.dateTimeInput, { borderColor: palette.border, backgroundColor: palette.card }]}
                                    onPress={() => setShowTimePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons name="schedule" size={20} color={palette.text.secondary} />
                                    <Text style={[styles.dateTimeText, { color: selectedTime ? palette.text.primary : palette.text.secondary }]}>
                                        {selectedTime ? formatTime(selectedTime) : t('lessons.timePlaceholder')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.checkboxContainer}>
                            <TouchableOpacity
                                style={[styles.checkbox, { borderColor: palette.border, backgroundColor: palette.card }]}
                                onPress={() => setRecurring(!recurring)}
                                activeOpacity={0.7}
                            >
                                {recurring && <MaterialIcons name="check" size={20} color={colors.instructor.secondary} />}
                            </TouchableOpacity>
                            <Text style={[styles.checkboxLabel, { color: palette.text.primary }]}>{t('lessons.repeatWeekly')}</Text>
                        </View>
                    </Card>
                </View>

                {/* Action Buttons */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.saveButtonText}>{t('lessons.saveChanges')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDelete}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.deleteButtonText}>{t('lessons.deleteLesson')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>

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

            {/* Date Picker */}
            {showDatePicker && (
                Platform.OS === 'ios' ? (
                    <Modal
                        visible={showDatePicker}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setShowDatePicker(false)}
                    >
                        <View style={[styles.pickerModalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                            <View style={[styles.pickerModalContent, { backgroundColor: palette.card }]}>
                                <View style={[styles.pickerModalHeader, { borderBottomColor: palette.border }]}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={[styles.pickerModalButton, { color: palette.text.secondary }]}>{t('common.cancel')}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.pickerModalTitle, { color: palette.text.primary }]}>{t('lessons.selectDate')}</Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={[styles.pickerModalButton, { color: palette.primary }]}>{t('common.done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={selectedDate || new Date()}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, date) => {
                                        if (event.type === 'set' && date) {
                                            setSelectedDate(date);
                                        }
                                    }}
                                    minimumDate={new Date()}
                                    textColor={palette.text.primary}
                                    themeVariant={isDarkMode ? 'dark' : 'light'}
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={selectedDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowDatePicker(false);
                            if (event.type === 'set' && date) {
                                setSelectedDate(date);
                            }
                        }}
                        minimumDate={new Date()}
                    />
                )
            )}

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
                                        // Reset image if dance type changes
                                        if (selectedImage) {
                                            const availableImages = LESSON_IMAGES[item] || [];
                                            const isImageInList = availableImages.some(img => {
                                                if (typeof selectedImage === 'string' && typeof img === 'string') {
                                                    return selectedImage === img;
                                                }
                                                // For local assets, compare by reference
                                                return selectedImage === img;
                                            });
                                            if (!isImageInList) {
                                                setSelectedImage(null);
                                            }
                                        }
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
        </SafeAreaView>
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
});

