import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { typography, spacing, borderRadius } from '../../utils/theme';

interface Instructor {
    id: string;
    name: string;
}

interface InstructorMultiSelectModalProps {
    visible: boolean;
    onClose: () => void;
    instructors: Instructor[]; // all available instructors
    selectedInstructors: Instructor[];
    onSave: (selected: Instructor[]) => void;
    palette: any;
    isDarkMode: boolean;
    lockedInstructorId?: string; // ID of the instructor that cannot be removed
}

export const InstructorMultiSelectModal: React.FC<InstructorMultiSelectModalProps> = ({
    visible,
    onClose,
    instructors,
    selectedInstructors,
    onSave,
    palette,
    isDarkMode,
    lockedInstructorId,
}) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [localSelected, setLocalSelected] = useState<Instructor[]>(selectedInstructors);

    // Filter instructors based on search. Require at least 2 chars to show others? User said "ilk 2 harfini yazdıktan sonra liste dökülebilir"
    const filteredInstructors = useMemo(() => {
        if (searchQuery.length < 2) return [];
        return instructors.filter(inst =>
            inst.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [instructors, searchQuery]);

    // Initialize local selected when modal opens
    React.useEffect(() => {
        if (visible) {
            setSearchQuery('');
            setLocalSelected(selectedInstructors);
        }
    }, [visible, selectedInstructors]);

    const toggleInstructor = (instructor: Instructor) => {
        if (lockedInstructorId === instructor.id) return; // Cannot toggle locked instructor

        const isSelected = localSelected.some(inst => inst.id === instructor.id);
        if (isSelected) {
            setLocalSelected(prev => prev.filter(inst => inst.id !== instructor.id));
        } else {
            setLocalSelected(prev => [...prev, instructor]);
        }
    };

    const handleSave = () => {
        onSave(localSelected);
        onClose();
    };

    const renderInstructorItem = ({ item }: { item: Instructor }) => {
        const isSelected = localSelected.some(inst => inst.id === item.id);
        const isLocked = lockedInstructorId === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.instructorItem,
                    { borderBottomColor: palette.border },
                    isSelected && { backgroundColor: palette.secondary + '15' }
                ]}
                onPress={() => toggleInstructor(item)}
                disabled={isLocked}
                activeOpacity={0.7}
            >
                <View style={styles.instructorInfo}>
                    <Text style={[styles.instructorName, { color: palette.text.primary }]}>{item.name}</Text>
                    {isLocked && <Text style={[styles.lockedText, { color: palette.text.secondary }]}>({t('lessons.lockedInstructor') || 'Kurucu Eğitmen'})</Text>}
                </View>
                {isSelected && (
                    <MaterialIcons name="check-circle" size={24} color={palette.secondary} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)' }]}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={28} color={palette.text.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: palette.text.primary }]}>{t('lessons.selectInstructors') || 'Eğitmen Seç'}</Text>
                        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                            <Text style={[styles.saveText, { color: palette.secondary }]}>{t('common.save') || 'Kaydet'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Selected Badges */}
                    <View style={styles.selectedContainer}>
                        {localSelected.length === 0 ? (
                            <Text style={[styles.noSelectedText, { color: palette.text.secondary }]}>{t('lessons.noInstructorSelected') || 'Henüz eğitmen seçilmedi.'}</Text>
                        ) : (
                            <FlatList
                                data={localSelected}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => `selected-${item.id}`}
                                renderItem={({ item }) => {
                                    const isLocked = lockedInstructorId === item.id;
                                    return (
                                        <View style={[styles.selectedBadge, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                            <Text style={[styles.selectedBadgeText, { color: palette.text.primary }]} numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            {!isLocked && (
                                                <TouchableOpacity onPress={() => toggleInstructor(item)} style={styles.removeIcon}>
                                                    <MaterialIcons name="close" size={16} color={palette.text.secondary} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                }}
                                contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
                            />
                        )}
                    </View>

                    {/* Search Input */}
                    <View style={[styles.searchContainer, { backgroundColor: palette.card, borderColor: palette.border }]}>
                        <MaterialIcons name="search" size={24} color={palette.text.secondary} />
                        <TextInput
                            style={[styles.searchInput, { color: palette.text.primary }]}
                            placeholder={t('lessons.searchInstructor') || "İsimle eğitmen ara (en az 2 harf)"}
                            placeholderTextColor={palette.text.secondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="words"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <MaterialIcons name="cancel" size={20} color={palette.text.secondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* List */}
                    <FlatList
                        data={filteredInstructors}
                        keyExtractor={(item) => item.id}
                        renderItem={renderInstructorItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                {searchQuery.length < 2 ? (
                                    <Text style={[styles.emptyText, { color: palette.text.secondary }]}>{t('lessons.typeToSearch') || 'Eğitmen aramak için en az 2 harf yazın.'}</Text>
                                ) : (
                                    <Text style={[styles.emptyText, { color: palette.text.secondary }]}>{t('lessons.noInstructorFound') || 'Eğitmen bulunamadı.'}</Text>
                                )}
                            </View>
                        )}
                    />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    closeButton: {
        padding: spacing.xs,
    },
    saveButton: {
        padding: spacing.xs,
    },
    saveText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        paddingHorizontal: spacing.sm,
        height: 48,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: typography.fontSize.base,
    },
    listContent: {
        paddingBottom: spacing.xxl,
    },
    instructorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    instructorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    instructorName: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
    },
    lockedText: {
        fontSize: typography.fontSize.sm,
        marginLeft: spacing.sm,
    },
    selectedContainer: {
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#333',
    },
    noSelectedText: {
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        maxWidth: 150,
    },
    selectedBadgeText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        marginRight: spacing.xs,
        flexShrink: 1,
    },
    removeIcon: {
        padding: 2,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: typography.fontSize.base,
        textAlign: 'center',
    },
});
