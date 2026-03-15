import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    FlatList, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { spacing, typography, borderRadius } from '../../utils/theme';
import { useLocationStore } from '../../store/useLocationStore';
import { useLessonStore } from '../../store/useLessonStore';
import { ActivityIndicator } from 'react-native';

type Step = 'country' | 'city';

type Props = {
    visible: boolean;
    onClose: () => void;
    selectedCountry: string;
    selectedCity: string;
    onConfirm: (country: string, city: string) => void;
    palette?: ReturnType<typeof getPalette>;
};

export const LocationPickerModal: React.FC<Props> = ({
    visible, onClose, selectedCountry, selectedCity, onConfirm,
}) => {
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette('student', isDarkMode);
    const insets = useSafeAreaInsets();

    const { locations, isLoading, isLoaded, fetchLocations, getAllCountryNames, getCitiesForCountry } = useLocationStore();
    const { lessons } = useLessonStore();

    // Fetch locations when modal opens if not loaded
    React.useEffect(() => {
        if (visible && !isLoaded && !isLoading) {
            fetchLocations();
        }
    }, [visible, isLoaded, isLoading, fetchLocations]);

    // Derived sets for active courses' locations and frequencies
    const { activeCountries, activeCities, countryCounts, cityCounts } = useMemo(() => {
        const cCountries = new Set<string>();
        const cCities = new Set<string>();
        const cCounts: Record<string, number> = {};
        const ciCounts: Record<string, number> = {};
        const allCities = getCitiesForCountry('Türkiye').map(c => c.trim().toLocaleLowerCase('tr-TR'));

        lessons.forEach(l => {
            const country = l.location?.customCountry || 'Türkiye'; // Default
            if (country) {
                cCountries.add(country.trim().toLocaleLowerCase('tr-TR'));
                cCounts[country.trim().toLocaleLowerCase('tr-TR')] = (cCounts[country.trim().toLocaleLowerCase('tr-TR')] || 0) + 1;
            }
            // Add schoolAddress to the checks
            let city = l.location?.customCity || (l as any).city;
            
            // If explicit city is not found, attempt to find it from schoolAddress or schoolName
            if (!city && l.schoolAddress) {
                const lowerAddress = l.schoolAddress.toLocaleLowerCase('tr-TR');
                const matchedCity = allCities.find(c => lowerAddress.includes(c));
                if (matchedCity) {
                    city = matchedCity;
                }
            }
            if (!city && l.schoolName) {
                const lowerName = l.schoolName.toLocaleLowerCase('tr-TR');
                const matchedCity = allCities.find(c => lowerName.includes(c));
                if (matchedCity) {
                    city = matchedCity;
                }
            }

            if (city) {
                const normalizedCity = city.trim().toLocaleLowerCase('tr-TR');
                cCities.add(normalizedCity);
                ciCounts[normalizedCity] = (ciCounts[normalizedCity] || 0) + 1;
            }
        });
        return { activeCountries: cCountries, activeCities: cCities, countryCounts: cCounts, cityCounts: ciCounts };
    }, [lessons]);

    const [step, setStep] = useState<Step>('country');
    const [localCountry, setLocalCountry] = useState(selectedCountry || 'Türkiye');
    const [localCity, setLocalCity] = useState(selectedCity || '');
    const [search, setSearch] = useState('');

    const countries = useMemo(() => {
        const allNames = getAllCountryNames();
        let list = allNames;
        if (search) {
            list = list.filter(c => c.toLowerCase().includes(search.toLowerCase()));
        }
        // Sort: Türkiye first, then by frequency, then alphabetically
        return list.sort((a, b) => {
            if (a === 'Türkiye') return -1;
            if (b === 'Türkiye') return 1;

            const aNormalized = a.trim().toLocaleLowerCase('tr-TR');
            const bNormalized = b.trim().toLocaleLowerCase('tr-TR');
            
            const aCount = countryCounts[aNormalized] || 0;
            const bCount = countryCounts[bNormalized] || 0;
            if (aCount !== bCount) return bCount - aCount;
            
            return a.localeCompare(b, 'tr');
        });
    }, [search, locations, countryCounts]);

    const cities = useMemo(() => {
        const originalList = getCitiesForCountry(localCountry);
        let list = [...originalList];
        if (search) {
            list = list.filter(c => c.toLowerCase().includes(search.toLowerCase()));
        }
        // Sort: frequency first, then original order or alphabetical
        return list.sort((a, b) => {
            const aNormalized = a.trim().toLocaleLowerCase('tr-TR');
            const bNormalized = b.trim().toLocaleLowerCase('tr-TR');

            const aCount = cityCounts[aNormalized] || 0;
            const bCount = cityCounts[bNormalized] || 0;

            if (aCount !== bCount) return bCount - aCount; // highest count first
            
            // Fallback equal counts
            if (localCountry === 'Türkiye') {
                return originalList.indexOf(a) - originalList.indexOf(b);
            }
            
            return a.localeCompare(b, 'tr');
        });
    }, [localCountry, search, locations, cityCounts]);

    const handleOpenCity = (country: string) => {
        setLocalCountry(country);
        setLocalCity('');
        setSearch('');
        setStep('city');
    };

    const handleSelectCity = (city: string) => {
        setLocalCity(city);
        onConfirm(localCountry, city);
        onClose();
    };

    const handleConfirmNoCity = () => {
        onConfirm(localCountry, '');
        onClose();
    };

    const handleBack = () => {
        setSearch('');
        setStep('country');
    };

    const handleOpen = () => {
        setLocalCountry(selectedCountry || 'Türkiye');
        setLocalCity(selectedCity || '');
        setSearch('');
        setStep('country');
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
            onShow={handleOpen}
        >
            <View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
                <View style={[styles.sheet, { backgroundColor: palette.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: palette.border }]}>
                        {step === 'city' ? (
                            <TouchableOpacity onPress={handleBack} style={styles.headerAction}>
                                <MaterialIcons name="arrow-back" size={22} color={palette.text.primary} />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.headerAction} />
                        )}
                        <Text style={[styles.headerTitle, { color: palette.text.primary }]}>
                            {step === 'country'
                                ? t('location.selectCountry') || 'Ülke Seç'
                                : t('location.selectCity') || `${localCountry} - Şehir Seç`}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.headerAction}>
                            <MaterialIcons name="close" size={22} color={palette.text.primary} />
                        </TouchableOpacity>
                    </View>

                    {isLoading && !isLoaded && (
                        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={palette.primary} />
                        </View>
                    )}

                    {(!isLoading || isLoaded) && (
                        <>
                            {/* Search */}
                    <View style={[styles.searchBox, { backgroundColor: palette.card, borderColor: palette.border }]}>
                        <MaterialIcons name="search" size={18} color={palette.text.secondary} />
                        <TextInput
                            style={[styles.searchInput, { color: palette.text.primary }]}
                            placeholder={step === 'country' ? (t('location.searchCountry') || 'Ülke ara...') : (t('location.searchCity') || 'Şehir ara...')}
                            placeholderTextColor={palette.text.secondary}
                            value={search}
                            onChangeText={setSearch}
                            autoCorrect={false}
                        />
                        {!!search && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <MaterialIcons name="close" size={16} color={palette.text.secondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Country List */}
                    {step === 'country' && (
                        <FlatList
                            data={countries}
                            keyExtractor={item => item}
                            renderItem={({ item }) => {
                                const normalized = item.trim().toLocaleLowerCase('tr-TR');
                                return (
                                <TouchableOpacity
                                    style={[
                                        styles.listItem,
                                        { borderBottomColor: palette.border },
                                        item === localCountry && { backgroundColor: palette.primary + '15' },
                                    ]}
                                    onPress={() => handleOpenCity(item)}
                                >
                                    <Text style={[styles.listItemText, { color: palette.text.primary }]}>
                                        {item}
                                        {activeCountries.has(normalized) && ` (${countryCounts[normalized] || 0})`}
                                    </Text>
                                    <MaterialIcons name="chevron-right" size={20} color={palette.text.secondary} />
                                </TouchableOpacity>
                                );
                            }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    {/* City List */}
                    {step === 'city' && (
                        <FlatList
                            data={cities}
                            keyExtractor={item => item}
                            ListHeaderComponent={
                                <TouchableOpacity
                                    style={[styles.listItem, styles.skipItem, { borderBottomColor: palette.border }]}
                                    onPress={handleConfirmNoCity}
                                >
                                    <Text style={[styles.listItemText, { color: palette.text.secondary }]}>
                                        {t('location.allCities') || 'Şehir Belirtme'}
                                    </Text>
                                </TouchableOpacity>
                            }
                            renderItem={({ item }) => {
                                const normalized = item.trim().toLocaleLowerCase('tr-TR');
                                return (
                                <TouchableOpacity
                                    style={[
                                        styles.listItem,
                                        { borderBottomColor: palette.border },
                                        item === localCity && { backgroundColor: palette.primary + '15' },
                                    ]}
                                    onPress={() => handleSelectCity(item)}
                                >
                                    <Text style={[styles.listItemText, { color: palette.text.primary }]}>
                                        {item}
                                        {activeCities.has(normalized) && ` (${cityCounts[normalized] || 0})`}
                                    </Text>
                                    {item === localCity && (
                                        <MaterialIcons name="check" size={18} color={palette.primary} />
                                    )}
                                </TouchableOpacity>
                                );
                            }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </>
                )}
                </View>
            </View>
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
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '80%',
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    headerAction: {
        width: 36,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: '700' as any,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        paddingHorizontal: spacing.sm,
        height: 42,
        gap: spacing.xs,
    },
    searchInput: {
        flex: 1,
        fontSize: typography.fontSize.base,
        paddingVertical: 0,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    skipItem: {
        paddingVertical: 12,
    },
    listItemText: {
        fontSize: typography.fontSize.base,
    },
});
