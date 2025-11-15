import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../../components/common/Card';
import { CURRENCY_SYMBOLS } from '../../utils/helpers';

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
const getDurationOptions = (t: any) => [
    { label: t('lessons.durations.45min'), value: 45 },
    { label: t('lessons.durations.60min'), value: 60 },
    { label: t('lessons.durations.90min'), value: 90 },
];

export const CreateLessonScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const { user } = useAuthStore();
    const palette = getPalette('instructor', isDarkMode);
    
    const currency = user?.currency || 'USD';
    const currencySymbol = CURRENCY_SYMBOLS[currency];

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTitle: t('lessons.createLesson'),
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

    const [title, setTitle] = useState('');
    const [danceType, setDanceType] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('150');
    const [duration, setDuration] = useState(60);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [recurring, setRecurring] = useState(false);
    const [selectedImage, setSelectedImage] = useState<any>(null);
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

    const handleCreate = () => {
        if (!title || !danceType || !description || !price || !selectedImage) {
            // Show error message
            return;
        }
        // Create lesson logic here
        console.log('Creating lesson:', {
            title,
            danceType,
            description,
            price,
            duration,
            date: selectedDate,
            time: selectedTime,
            recurring,
            selectedImage
        });
        navigation.goBack();
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
                        <View style={styles.gridRow}>
                            <View style={[styles.inputGroup, styles.gridItem]}>
                                <Text style={[styles.inputLabel, { color: palette.text.primary }]}>{t('lessons.selectDate')}</Text>
                                <TouchableOpacity
                                    style={[styles.dateTimeInput, { borderColor: palette.border, backgroundColor: palette.card }]}
                                    onPress={() => setShowDatePicker(true)}
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

                {/* Bottom spacing for button */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Fixed Bottom Button */}
            <SafeAreaView edges={['bottom']} style={[styles.bottomButtonContainer, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreate}
                    activeOpacity={0.8}
                >
                    <Text style={styles.createButtonText}>{t('lessons.save')}</Text>
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
        backgroundColor: '#137fec',
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

