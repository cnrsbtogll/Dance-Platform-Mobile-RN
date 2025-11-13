import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../../components/common/Card';

// Predefined lesson images for each dance type
const LESSON_IMAGES: { [key: string]: string[] } = {
    Salsa: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAZDbnf1_BcJpeGVAiB82q62bj9gF-jZ3vF-3Xgx7nBrahcw7B-XjftsO-2q1TdxaCJgv1zq_YLmIikUlvRXmrjRr8J7p7HRpUi6QY-7HXNi89ZrAoUarJ4YIVJAMVWWGWCdk4-AwotV7jmdKBlI1hVffZCkDPCySd-TDhvb6GagMdBlNVOXubiUxh-LcC6HH4Kv7CeF8s50hMhXGOg63xZC4rvq9_nhvmb4QtMpOuCCpRCvQtyQ77szSweIg_unHz1oypoeuQrt1xr',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBkU2rFZjX7PZJATa4coHm9_lFLDyUo-6oSiTpbq2aBZc7XcgYfAATsAf0WnoOxaEHpasHsUItGLmRVW97fmn7hhE5C8k11e896IS4fjW0yxJ8MdQQQC1FM445cQeKaiooExB4dP7HRr4eKgRNWXvBKPM3Cg0hCejy3AfrArlXrNO5Ucped9Iz0FmtYW_U6P1wIMAtzlRP2hV28TKhXJgQ4aOUAcBBllX4D51eQ7yuwavRpcEgvseO_c8-V55u6yokMleFV-VNhAjFG',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAJhqQ4KzAehAqHju2rv6ai3E7BsTG9CW2xfnywNDMv0H4Ift9weFwl6gJAvHBNPOV41fY4poJRV942DXPLEp7Acz6mcY1MrG_tJZ_gtamBizh9HFYRhAlGaqlCM-t-ySHZ3C3NkL37c-zomlTr--Twa8Ruf0365qgPfgnUiO6XWPRZJy6LC-Thm1JcFOAgMgwBwMnc0lQdweaiFq3ifcTsnodiGnl5lUV3CcGKyY0ofaQ4nWQ7O0px-S3pvsr-K9Jaqq2QaK1EcUVJ',
    ],
    Bachata: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDrK6s9NaTyFHSKbR1zxuzYarzb0trW_ghQ8ZEn3wypuiJp6-SQvw7SuuvE3BCgsuZZS3B9wDOgk6B-EGaRofd1aC4yJdDqryIwmdbJhOkiKXiCgG7WGO2EBOJZw3tGVKo0ZXcAwCOuLEALPoOk15D_F9WGgINGzMFyC4jVXrdzvWk5l8_0rrKGZISOWleltB6E27Ra6DW1kWrKJsUBMDxa2GUKYmH3eY6FKnxr4Afo5ar8SW9LBf4ZKeflOCdzvuJrJ2xTXQDYOhrM',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC3BKLybEFhgx2pywJvsbUiPuhvLQAHjNc0D7Kt6xr4eEEHhgqNt0antxjocgBY8ctVD5jf1NYwjFkYQFQMmO9sp2fWifVc_Gmie9-_Ne1LlYNT4MAKhJyLxB4YEEIbf_hsJ7fiuqiIMT1Cdmy7LB7vr3Ru1cNyn2N4yI9miw7ad-gF_lMaHXPexn3slSla9lOQ7wRBGhbFiQ9_bFFu3MvoLQwnz7yPmvRAejMCYgfo92kmlK9daeHsgCnbuRe4_muuNBOorhsPIViK',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDc_GniRukhXbXao6NUWTknnoIGZRgiFe7iWo2sq-kugk-ZqK6Xyk0zHF75jAEZQeDTiyRuNK_cNPtKlDWVJwXNemXrLts0FermOiORgIacikUvkj1q0mDu_Hulo3fDwwvVqfZcxh8nE5Z0Oj0xwOAcKEfysfxRHYa1pr9ydFo9nh63jOnawCMZo4GMT1oT7a_hIrnoKlAe0uah1XEtv1ilwAN7l5m5tYkzwIaiirrdKUrZ_Ynrtju5uD36OkyePI-ICGVzotJcLiy1',
    ],
    Kizomba: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBC3nmzujhmO9XJXjveJcNSN2L5yTo4VIxlMY6WSlkiOgTUFhdpuQQi3Y1wOTJreXOjUY0RK8sK6z6hKf_P7r1j-ZifOtQ9RRci0GDT1q6EQdsBISoRjw9qn1xmKPUdqYxBrxs8aCYgjI3f5GWI9wwp41aNd9EasyZgonVCxnsUuXBqMkUgtbPMLPi4uTMFWAN1bqQ1ayCZcFlq79IuanpaGaKDYT0xquC_13QcmCLsd43naJXdXqQXMmBpkCL0u3vrEU47eEvB2NcM',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBBsId8zlGD_lhAxsHvmOFooP81liuKLtancbqIp5CNNcIWfjh39M2gAsA4l9zUk6MproU13_xcy1pTGVJY7i_Wx7R3QDV0kl9_z2YPSdIOLBp8ZPnFOKqRJqEGs0jcSUua1XhXHAOQl_u1Dwsqztb4aqcRUyVojJuZiZDlE-Hh6Y3iqO1ONCXiFT3pyPlB77RN50eur0I6KI1MEgl5wUTsQDvLx2M567QiyT79upv8SKHB-Bt4lA5Kkd7geKUHyQPi7IR41DchY4Yu',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBBX9DiROq9N1QS5nCWOBfVSt9JUKJDlBdgu9wKR8zyUM9zNoFzmrTXUmy8dyKHcuKzrJ8fGG0LnbesYB-YHkWyU6evvIFfUIlSzX9JntSwoibT022-tVnA3PTzgvFASSt6ho8y31xE_6WvB_p4ONar7xuduNmeHNmWsor6OsAguv8qXn2KyUvrH-gxr4MEnT_aUUgK0rK-6AU-WVU95M525dtRKzomoieg8bLqTQ9T-m8wkm7oKBhn8zm27ADjErqUw3fZu7a_nM5E',
    ],
    Tango: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCY1YRDTBqG0J6H_95zmqGpNadfETh0Po1YLyXvaZ8ibYlFzLEQjLEZLIpJeUehGCE_UYa3206xbGPGyofUdgq0FDziwQkB_JK0rbK6rEoxJzVNUI7oUefEavM09Syeik6AVhq3TapcGAK5EI2rZJpWcMxOZBvzVfmGnlq8ZxF-WtyoVAFt4JAMy4EpixWWpG392juXIBT5EOSGJMRgh1-THn_J3649cLQ86u9hw5_Ai4afhc4uy3CyzTySvStE6m1vxIcjn-ZtqtR3',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBBX9DiROq9N1QS5nCWOBfVSt9JUKJDlBdgu9wKR8zyUM9zNoFzmrTXUmy8dyKHcuKzrJ8fGG0LnbesYB-YHkWyU6evvIFfUIlSzX9JntSwoibT022-tVnA3PTzgvFASSt6ho8y31xE_6WvB_p4ONar7xuduNmeHNmWsor6OsAguv8qXn2KyUvrH-gxr4MEnT_aUUgK0rK-6AU-WVU95M525dtRKzomoieg8bLqTQ9T-m8wkm7oKBhn8zm27ADjErqUw3fZu7a_nM5E',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCgTmZbmoEphxMf0JNkTKEBncLLltfGS7BGfp8LG3B5bdR4wlvAJtoCe5dsUnIURI2Dr5PruB6brXR1j8XFbXzYVWWtlrgpcAbfifF2NCXtz3IWiLayviWZ7Bk9x-zsI94zM5E5Az3LEXsDohw_XMHBtzSBilbZSXROcMQnYGa6ZW6etjvWBMHCECXeN566y6SmD65vsDJBI95KtE0CtQBqLaPYSTtX_2lvcRqD34M9OGF34VWp1wyEW5B7rBiA6oBa26ojL9sTl0zN',
    ],
    Modern: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCgTmZbmoEphxMf0JNkTKEBncLLltfGS7BGfp8LG3B5bdR4wlvAJtoCe5dsUnIURI2Dr5PruB6brXR1j8XFbXzYVWWtlrgpcAbfifF2NCXtz3IWiLayviWZ7Bk9x-zsI94zM5E5Az3LEXsDohw_XMHBtzSBilbZSXROcMQnYGa6ZW6etjvWBMHCECXeN566y6SmD65vsDJBI95KtE0CtQBqLaPYSTtX_2lvcRqD34M9OGF34VWp1wyEW5B7rBiA6oBa26ojL9sTl0zN',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBBsId8zlGD_lhAxsHvmOFooP81liuKLtancbqIp5CNNcIWfjh39M2gAsA4l9zUk6MproU13_xcy1pTGVJY7i_Wx7R3QDV0kl9_z2YPSdIOLBp8ZPnFOKqRJqEGs0jcSUua1XhXHAOQl_u1Dwsqztb4aqcRUyVojJuZiZDlE-Hh6Y3iqO1ONCXiFT3pyPlB77RN50eur0I6KI1MEgl5wUTsQDvLx2M567QiyT79upv8SKHB-Bt4lA5Kkd7geKUHyQPi7IR41DchY4Yu',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAJhqQ4KzAehAqHju2rv6ai3E7BsTG9CW2xfnywNDMv0H4Ift9weFwl6gJAvHBNPOV41fY4poJRV942DXPLEp7Acz6mcY1MrG_tJZ_gtamBizh9HFYRhAlGaqlCM-t-ySHZ3C3NkL37c-zomlTr--Twa8Ruf0365qgPfgnUiO6XWPRZJy6LC-Thm1JcFOAgMgwBwMnc0lQdweaiFq3ifcTsnodiGnl5lUV3CcGKyY0ofaQ4nWQ7O0px-S3pvsr-K9Jaqq2QaK1EcUVJ',
    ],
};

const DANCE_TYPES = ['Salsa', 'Bachata', 'Kizomba', 'Tango', 'Modern'];
const DURATION_OPTIONS = [
    { label: '45 dakika', value: 45 },
    { label: '60 dakika', value: 60 },
    { label: '90 dakika', value: 90 },
];

export const CreateLessonScreen: React.FC = () => {
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTitle: '',
            headerBackTitle: '',
            headerStyle: {
                backgroundColor: colors.instructor.background.light,
            },
            headerTintColor: colors.instructor.text.lightPrimary,
        });
    }, [navigation]);

    const [title, setTitle] = useState('');
    const [danceType, setDanceType] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('150');
    const [duration, setDuration] = useState(60);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [recurring, setRecurring] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
                    <View style={styles.imageUploadPlaceholder}>
                        <MaterialIcons name="cloud-upload" size={48} color={colors.instructor.text.lightSecondary} />
                        <Text style={styles.imageUploadText}>Önce dans türü seçin</Text>
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
                        <Image source={{ uri: selectedImage }} style={styles.selectedImage} resizeMode="cover" />
                        <View style={styles.imageOverlay}>
                            <MaterialIcons name="edit" size={24} color="#ffffff" />
                            <Text style={styles.imageOverlayText}>Değiştir</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.imageUploadPlaceholder}
                        onPress={() => setShowImagePicker(true)}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="cloud-upload" size={48} color={colors.instructor.text.lightSecondary} />
                        <Text style={styles.imageUploadText}>
                            <Text style={styles.imageUploadTextBold}>Yüklemek için tıkla</Text> veya sürükle
                        </Text>
                        <Text style={styles.imageUploadSubtext}>SVG, PNG, JPG (MAX. 800x400px)</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Dance Type Selection */}
                <View style={styles.section}>
                    <Card style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Dans Türü</Text>
                        <View style={styles.formFields}>
                            <View style={styles.inputGroup}>
                                <TouchableOpacity
                                    style={styles.selectInput}
                                    onPress={() => setShowDanceTypePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.selectInputText, !danceType && styles.placeholderText]}>
                                        {danceType || 'Dans türü seçin'}
                                    </Text>
                                    <MaterialIcons
                                        name="keyboard-arrow-down"
                                        size={24}
                                        color={colors.instructor.text.lightSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Card>
                </View>
                {/* Image Section */}
                <View style={styles.section}>
                    <Card style={styles.imageCard}>
                        <Text style={styles.sectionLabel}>Ders Görseli</Text>
                        {renderImagePicker()}
                    </Card>
                </View>

                {/* Basic Information */}
                <View style={styles.section}>
                    <Card style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
                        <View style={styles.formFields}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Ders Başlığı</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Örn: Başlangıç Seviyesi Salsa"
                                    placeholderTextColor={colors.instructor.text.lightSecondary}
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Açıklama</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Dersin içeriği, seviyesi ve hedefleri hakkında bilgi verin..."
                                    placeholderTextColor={colors.instructor.text.lightSecondary}
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
                        <Text style={styles.sectionTitle}>Fiyatlandırma & Süre</Text>
                        <View style={styles.gridRow}>
                            <View style={[styles.inputGroup, styles.gridItem]}>
                                <Text style={styles.inputLabel}>Saatlik Ücret</Text>
                                <View style={styles.priceInputContainer}>
                                    <Text style={styles.currencySymbol}>₺</Text>
                                    <TextInput
                                        style={[styles.input, styles.priceInput]}
                                        placeholder="150"
                                        placeholderTextColor={colors.instructor.text.lightSecondary}
                                        value={price}
                                        onChangeText={setPrice}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, styles.gridItem]}>
                                <Text style={styles.inputLabel}>Ders Süresi</Text>
                                <TouchableOpacity
                                    style={styles.selectInput}
                                    onPress={() => setShowDurationPicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.selectInputText}>
                                        {DURATION_OPTIONS.find(opt => opt.value === duration)?.label || '60 dakika'}
                                    </Text>
                                    <MaterialIcons
                                        name="keyboard-arrow-down"
                                        size={24}
                                        color={colors.instructor.text.lightSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* Scheduling */}
                <View style={styles.section}>
                    <Card style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Zamanlama</Text>
                        <View style={styles.gridRow}>
                            <View style={[styles.inputGroup, styles.gridItem]}>
                                <Text style={styles.inputLabel}>Tarih Seç</Text>
                                <TouchableOpacity
                                    style={styles.dateTimeInput}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <MaterialIcons name="calendar-month" size={20} color={colors.instructor.text.lightSecondary} />
                                    <Text style={[styles.dateTimeText, !selectedDate && styles.placeholderText]}>
                                        {selectedDate ? formatDate(selectedDate) : 'GG.AA.YYYY'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.inputGroup, styles.gridItem]}>
                                <Text style={styles.inputLabel}>Saat Seç</Text>
                                <TouchableOpacity
                                    style={styles.dateTimeInput}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <MaterialIcons name="schedule" size={20} color={colors.instructor.text.lightSecondary} />
                                    <Text style={[styles.dateTimeText, !selectedTime && styles.placeholderText]}>
                                        {selectedTime ? formatTime(selectedTime) : 'SS:DD'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.checkboxContainer}>
                            <TouchableOpacity
                                style={styles.checkbox}
                                onPress={() => setRecurring(!recurring)}
                                activeOpacity={0.7}
                            >
                                {recurring && <MaterialIcons name="check" size={20} color={colors.instructor.secondary} />}
                            </TouchableOpacity>
                            <Text style={styles.checkboxLabel}>Her hafta tekrar et</Text>
                        </View>
                    </Card>
                </View>

                {/* Bottom spacing for button */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Fixed Bottom Button */}
            <SafeAreaView edges={['bottom']} style={styles.bottomButtonContainer}>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreate}
                    activeOpacity={0.8}
                >
                    <Text style={styles.createButtonText}>Oluştur</Text>
                </TouchableOpacity>
            </SafeAreaView>

            {/* Image Picker Modal */}
            <Modal
                visible={showImagePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowImagePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Ders Görseli Seç</Text>
                            <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                                <MaterialIcons name="close" size={24} color={colors.instructor.text.lightPrimary} />
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

            {/* Dance Type Picker Modal */}
            <Modal
                visible={showDanceTypePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDanceTypePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Dans Türü Seç</Text>
                            <TouchableOpacity onPress={() => setShowDanceTypePicker(false)}>
                                <MaterialIcons name="close" size={24} color={colors.instructor.text.lightPrimary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={DANCE_TYPES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.pickerOption,
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
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Ders Süresi Seç</Text>
                            <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                                <MaterialIcons name="close" size={24} color={colors.instructor.text.lightPrimary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={DURATION_OPTIONS}
                            keyExtractor={(item) => item.value.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.pickerOption,
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
        backgroundColor: colors.instructor.background.light,
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
        color: colors.instructor.text.lightPrimary,
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.instructor.text.lightPrimary,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        letterSpacing: -0.015,
    },
    imageUploadContainer: {
        width: '100%',
    },
    imageUploadPlaceholder: {
        width: '100%',
        height: 128,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.instructor.border.light,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.instructor.background.light,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    imageUploadText: {
        fontSize: typography.fontSize.sm,
        color: colors.instructor.text.lightSecondary,
        textAlign: 'center',
    },
    imageUploadTextBold: {
        fontWeight: typography.fontWeight.bold,
    },
    imageUploadSubtext: {
        fontSize: typography.fontSize.xs,
        color: colors.instructor.text.lightSecondary,
    },
    selectedImageContainer: {
        width: '100%',
        height: 128,
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
        color: colors.instructor.text.lightPrimary,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: colors.instructor.border.light,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.instructor.text.lightPrimary,
        backgroundColor: colors.instructor.background.light,
    },
    textArea: {
        height: 128,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    selectInput: {
        height: 48,
        borderWidth: 1,
        borderColor: colors.instructor.border.light,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.instructor.background.light,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    selectInputText: {
        flex: 1,
        fontSize: typography.fontSize.base,
        color: colors.instructor.text.lightPrimary,
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
        borderColor: colors.instructor.border.light,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.instructor.background.light,
        paddingLeft: spacing.md,
    },
    currencySymbol: {
        fontSize: typography.fontSize.base,
        color: colors.instructor.text.lightSecondary,
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
        borderColor: colors.instructor.border.light,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.instructor.background.light,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    dateTimeText: {
        flex: 1,
        fontSize: typography.fontSize.base,
        color: colors.instructor.text.lightPrimary,
    },
    placeholderText: {
        color: colors.instructor.text.lightSecondary,
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
        borderColor: colors.instructor.border.light,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.instructor.background.light,
    },
    checkboxLabel: {
        fontSize: typography.fontSize.base,
        color: colors.instructor.text.lightPrimary,
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.instructor.card.light,
        borderTopWidth: 1,
        borderTopColor: colors.instructor.border.light,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.instructor.card.light,
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
        borderBottomColor: colors.instructor.border.light,
    },
    modalTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.instructor.text.lightPrimary,
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
        borderBottomColor: colors.instructor.border.light,
    },
    pickerOptionSelected: {
        backgroundColor: `${colors.instructor.secondary}10`,
    },
    pickerOptionText: {
        fontSize: typography.fontSize.base,
        color: colors.instructor.text.lightPrimary,
    },
    pickerOptionTextSelected: {
        fontWeight: typography.fontWeight.bold,
        color: colors.instructor.secondary,
    },
});

