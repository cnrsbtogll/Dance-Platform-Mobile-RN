import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { useLessonStore } from '../../store/useLessonStore';
import { MockDataService } from '../../services/mockDataService';
import { formatPrice } from '../../utils/helpers';
import { Card } from '../../components/common/Card';
import { SearchBar } from '../../components/common/SearchBar';
import { BottomTab } from '../../components/common/BottomTab';

export const StudentHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { lessons, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, toggleFavorite, favoriteLessons } = useLessonStore();
  const filteredLessons = lessons.filter(lesson => {
    if (selectedCategory && lesson.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return lesson.title.toLowerCase().includes(query) || 
             lesson.description.toLowerCase().includes(query) ||
             lesson.category.toLowerCase().includes(query);
    }
    return true;
  });

  const categories = ['Hepsi', 'Salsa', 'Bachata', 'Tango', 'Kizomba'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top App Bar - Fixed */}
      <View style={[styles.header, { backgroundColor: colors.student.background.light + 'CC' }]}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArpIJAKnMfWnO8J2g3xJZUDwv5NZZmqYBdzgLkL0gDYWa8jKfBMgJS_o6tiwX0DPBv32ie4eHsASq5lEM6ovZP8KTnE8jWLe0yPcRa9enxSJ95JT2ytDgZ7emaBv5tyuVYngMoabwB6Egx8SoLhZLGQAwbzLS-W5YSJVjnzMjPYBBNgdvxNIExEsm_onrj9_0K4jdpHYyV71cBuUquOzI5pY9e5Wafqv6V8-yLGh-r3azGvQ8lJeEvuAzTh9BEGjW7mcO1Q5FL4kUa' }}
            style={styles.avatar}
          />
          <Text style={styles.headerTitle}>Merhaba, Ahmet</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications" size={24} color={colors.student.text.primaryLight} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Search Bar & Filter */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Dans veya eğitmen ara..."
          />
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Category Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.chip,
                (selectedCategory === category || (category === 'Hepsi' && !selectedCategory)) && styles.chipActive
              ]}
              onPress={() => setSelectedCategory(category === 'Hepsi' ? null : category)}
            >
              <Text style={[
                styles.chipText,
                (selectedCategory === category || (category === 'Hepsi' && !selectedCategory)) && styles.chipTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lessons List */}
        <View style={styles.lessonsContainer}>
          {filteredLessons.map((lesson) => {
            const instructor = MockDataService.getInstructorForLesson(lesson.id);
            const isFavorite = favoriteLessons.includes(lesson.id);
            
            return (
              <Card key={lesson.id} style={styles.lessonCard}>
                <View style={styles.lessonImageContainer}>
                  {lesson.imageUrl && (
                    <Image
                      source={{ uri: lesson.imageUrl }}
                      style={styles.lessonImage}
                      resizeMode="cover"
                    />
                  )}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(lesson.id)}
                  >
                    <MaterialIcons 
                      name={isFavorite ? "favorite" : "favorite-border"} 
                      size={24} 
                      color="#ffffff" 
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.lessonContent}>
                  <Text style={styles.instructorName}>Eğitmen: {instructor?.name || 'Bilinmiyor'}</Text>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <View style={styles.lessonFooter}>
                    <View style={styles.ratingContainer}>
                      <AntDesign name="star" size={20} color={colors.student.secondary} />
                      <Text style={styles.rating}>
                        {lesson.rating.toFixed(1)} <Text style={styles.reviewCount}>({lesson.reviewCount})</Text>
                      </Text>
                    </View>
                    <Text style={styles.price}>
                      {formatPrice(lesson.price)}
                      <Text style={styles.priceUnit}> / saat</Text>
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Tab Navigator - Fixed */}
      <View style={styles.bottomTabContainer}>
        <BottomTab
          items={[
            { 
              label: 'Ana Sayfa', 
              icon: <MaterialIcons name="home" size={24} />, 
              onPress: () => {} 
            },
            { 
              label: 'Derslerim', 
              icon: <MaterialIcons name="school" size={24} />, 
              onPress: () => {
                navigation.navigate('MyLessons' as never);
              } 
            },
            { 
              label: 'Sohbet', 
              icon: <MaterialIcons name="chat-bubble-outline" size={24} />, 
              onPress: () => {} 
            },
            { 
              label: 'Profil', 
              icon: <MaterialIcons name="person-outline" size={24} />, 
              onPress: () => {} 
            },
          ]}
          activeIndex={0}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.student.background.light,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    paddingTop: spacing.md,
    zIndex: 20,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
    letterSpacing: -0.15,
  },
  headerRight: {
    width: 48,
    alignItems: 'flex-end',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.student.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  chipsContainer: {
    paddingVertical: spacing.sm,
  },
  chipsContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.student.card.light,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  chipActive: {
    backgroundColor: colors.student.primary,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.student.text.primaryLight,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  lessonsContainer: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 100, // Bottom tab için alan
  },
  lessonCard: {
    marginBottom: spacing.md,
  },
  lessonImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  lessonImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  lessonContent: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  instructorName: {
    fontSize: typography.fontSize.sm,
    color: colors.student.text.secondaryLight,
  },
  lessonTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
  },
  lessonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  star: {
    fontSize: 20,
  },
  rating: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.student.text.primaryLight,
  },
  reviewCount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.student.text.secondaryLight,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
  },
  priceUnit: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.student.text.secondaryLight,
  },
});
