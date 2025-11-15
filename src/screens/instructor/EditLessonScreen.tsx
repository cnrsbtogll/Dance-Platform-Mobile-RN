import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, FlatList, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../../components/common/Card';
import { MockDataService } from '../../services/mockDataService';

// Predefined lesson images for each dance type (using the specified style URL format)
const LESSON_IMAGES: { [key: string]: string[] } = {
    Salsa: [
        'https://avatars.mds.yandex.net/i?id=ddbb349f1b55622d00375ab354eec9442085e0f9-4299853-images-thumbs&n=13',
        'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQmVVBLbFat_j1m1j-hv-tIcveNi0wkO1hqyGaqSrgIXJXXrizY',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzfCoXz4Fk0r8oJOosTGnul_uDyXYxSSJn5tj2lh5T_K0sF9Uc',
    ],
    Bachata: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAZDbnf1_BcJpeGVAiB82q62bj9gF-jZ3vF-3Xgx7nBrahcw7B-XjftsO-2q1TdxaCJgv1zq_YLmIikUlvRXmrjRr8J7p7HRpUi6QY-7HXNi89ZrAoUarJ4YIVJAMVWWGWCdk4-AwotV7jmdKBlI1hVffZCkDPCySd-TDhvb6GagMdBlNVOXubiUxh-LcC6HH4Kv7CeF8s50hMhXGOg63xZC4rvq9_nhvmb4QtMpOuCCpRCvQtyQ77szSweIg_unHz1oypoeuQrt1xr',
        'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQfYwXEpetAF4RLyA1S10GrldHSDQn6S7kTWfQabM6t0CP1KlWv',
        'https://kultura-volyne.cz/wp-content/uploads/2025/09/tanecni_volyne_A3_spad-scaled-e1758277008245-1024x724.jpg',
    ],
    Kizomba: [
        'https://cdn.vectorstock.com/i/1000v/15/09/kizomba-dancing-couple-vector-20271509.jpg',
        'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRrwdMdJiIf5cUsOwpt3zE9FLcyZYrfq6tl8--kX0Empz0uK7S7',
        'https://us.123rf.com/450wm/chachar/chachar1812/chachar181200011/120120697-ballroom-dancers-couple-stylized-illustration-of-young-couples-dancing-tango-foxtrot-isolated-on.jpg',
        'https://img.freepik.com/premium-vektor/arjantin-tangosu-dansci-cift-cizgi-film_12402-1230.jpg?semt=ais_hybrid&w=740&q=80'
    ],
    Tango: [
        'https://www.tangoturco.com/wp-content/uploads/2018/10/fff.jpg',
        'https://img.freepik.com/premium-vektor/uluslararasi-tango-gunu-kadin-ve-erkek-birlikte-dans-ediyor_499739-1320.jpg',
        'https://st3.depositphotos.com/10507036/13361/v/450/depositphotos_133612658-stock-illustration-international-tango-day.jpg'
    ],
    Modern: [
        'https://www.shutterstock.com/image-vector/man-woman-dancing-home-living-600nw-1722758842.jpg',
        'https://media.istockphoto.com/id/1037376044/tr/vekt%C3%B6r/g%C3%BCzel-%C3%A7ift-tango-dans-d%C3%BCz-ill%C3%BCstrasyon-vekt%C3%B6r.jpg?s=612x612&w=0&k=20&c=QhUe-Mb7P2kxQNJvnHJ3Pnhg7Wp-3haqE-VWzO_bFJ0=',
        'https://www.citadela-litvinov.cz/data/USR_056_DEFAULT/Venecek___web.png',
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
    const palette = getPalette('instructor', isDarkMode);

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
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [recurring, setRecurring] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(lesson?.imageUrl || null);
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
        if (selectedImage) {
            return (
                <View style={styles.imageUploadContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.currentImage} resizeMode="cover" />
                    <View style={styles.imageInfoContainer}>
                        <View style={styles.imageInfo}>
                            <Text style={[styles.imageInfoTitle, { color: palette.text.primary }]}>{t('lessons.currentCoverImage')}</Text>
                            <Text style={[styles.imageInfoSubtitle, { color: palette.text.secondary }]}>{t('lessons.tapToChangeImage')}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.changeImageButton}
                            onPress={() => setShowImagePicker(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.changeImageButtonText}>{t('lessons.change')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

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
                                    <Text style={[styles.currencySymbol, { color: palette.text.secondary }]}>₺</Text>
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
                                    <Image source={{ uri: item }} style={styles.imageOptionImage} resizeMode="cover" />
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
                <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                        if (Platform.OS === 'android') {
                            setShowDatePicker(false);
                        }
                        if (event.type === 'set' && date) {
                            setSelectedDate(date);
                            if (Platform.OS === 'ios') {
                                setShowDatePicker(false);
                            }
                        } else if (event.type === 'dismissed') {
                            setShowDatePicker(false);
                        }
                    }}
                    minimumDate={new Date()}
                />
            )}

            {/* Time Picker */}
            {showTimePicker && (
                <DateTimePicker
                    value={selectedTime || new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, time) => {
                        if (Platform.OS === 'android') {
                            setShowTimePicker(false);
                        }
                        if (event.type === 'set' && time) {
                            setSelectedTime(time);
                            if (Platform.OS === 'ios') {
                                setShowTimePicker(false);
                            }
                        } else if (event.type === 'dismissed') {
                            setShowTimePicker(false);
                        }
                    }}
                />
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
                                        if (selectedImage && !LESSON_IMAGES[item]?.includes(selectedImage)) {
                                            setSelectedImage(null);
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
        padding: spacing.md,
    },
    formCard: {
        padding: 0,
        overflow: 'hidden',
    },
    sectionLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing.sm,
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
    },
    currentImage: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    imageInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
    },
    imageInfo: {
        flex: 1,
    },
    imageInfoTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.xs,
    },
    imageInfoSubtitle: {
        fontSize: typography.fontSize.sm,
    },
    changeImageButton: {
        backgroundColor: colors.instructor.secondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        minWidth: 84,
    },
    changeImageButtonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: '#ffffff',
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

