import { Lesson, Booking, Currency } from '../types';
import i18n from './i18n';

import * as Localization from 'expo-localization';

export const CURRENCY_SYMBOLS: { [key in Currency]: string } = {
  USD: '$',
  EUR: '€',
  TRY: '₺',
};

export const getDefaultCurrency = (): Currency => {
  const locales = Localization.getLocales();
  const regionCode = locales?.[0]?.regionCode;
  
  if (regionCode === 'TR') return 'TRY';
  // Simple check for some major Eurozone countries, can be expanded
  const euroZone = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'FI', 'PT', 'GR'];
  if (regionCode && euroZone.includes(regionCode)) return 'EUR';
  
  return 'USD';
};

export const formatPrice = (price: number, currency?: Currency): string => {
  const effectiveCurrency = currency || getDefaultCurrency();
  
  const symbol = CURRENCY_SYMBOLS[effectiveCurrency] || '$';
  
  // Format based on currency
  let locale = 'en-US';
  if (effectiveCurrency === 'TRY') {
    locale = 'tr-TR';
  } else if (effectiveCurrency === 'EUR') {
    locale = 'de-DE'; // Use German locale for Euro formatting (1.234,56 €)
  }
  
  // For TRY, symbol usually goes after in some contexts, but standard is often before or handled by Intl.NumberFormat
  // Here we stick to the simple symbol prefix/suffix logic or just prefix as per mockup
  
  if (effectiveCurrency === 'TRY') {
     return `${price.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  }
  
  return `${symbol}${price.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return i18n.t('common.today');
  } else if (diffDays === 1) {
    return i18n.t('common.tomorrow');
  } else if (diffDays === -1) {
    return i18n.t('common.yesterday');
  } else if (diffDays > 1 && diffDays <= 7) {
    const dayNames = [
      i18n.t('common.days.sunday'),
      i18n.t('common.days.monday'),
      i18n.t('common.days.tuesday'),
      i18n.t('common.days.wednesday'),
      i18n.t('common.days.thursday'),
      i18n.t('common.days.friday'),
      i18n.t('common.days.saturday'),
    ];
    return dayNames[date.getDay()];
  } else {
    const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
};

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);

  const date = new Date();
  date.setHours(hour, minute);

  const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const getDurationText = (duration: number): string => {
  if (duration < 60) {
    return `${duration} ${i18n.t('common.minutes')}`;
  }
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (minutes === 0) {
    return `${hours} ${i18n.t('common.hours')}`;
  }
  return `${hours}${i18n.t('common.hourShort')} ${minutes}${i18n.t('common.minuteShort')}`;
};

export const getInitials = (name: string): string => {
  const names = name.split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // Basic phone validation (10-15 digits)
  const phoneRegex = /^\+?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone);
};

export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const getBookingStatus = (booking: Booking): 'upcoming' | 'completed' | 'cancelled' => {
  if (booking.status === 'cancelled') return 'cancelled';
  
  const bookingDate = new Date(`${booking.date}T${booking.time}`);
  const now = new Date();
  
  if (bookingDate > now) return 'upcoming';
  return 'completed';
};

export const getUpcomingBookings = (bookings: Booking[]): Booking[] => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return bookings.filter(booking => {
    if (booking.status === 'cancelled') return false;
    
    const dateStr = booking.date.includes('T') ? booking.date.split('T')[0] : booking.date;
    
    // Include today's lessons (date >= today)
    return dateStr >= todayStr;
  }).sort((a, b) => {
    const dateA = new Date(`${a.date.split('T')[0]}T${a.time || '00:00'}`).getTime();
    const dateB = new Date(`${b.date.split('T')[0]}T${b.time || '00:00'}`).getTime();
    return dateA - dateB;
  });
};

export const getPastBookings = (bookings: Booking[]): Booking[] => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return bookings.filter(booking => {
    const dateStr = booking.date.includes('T') ? booking.date.split('T')[0] : booking.date;
    
    if (booking.status === 'completed' || booking.status === 'cancelled') return true;
    
    // Past if before today
    return dateStr < todayStr;
  }).sort((a, b) => {
    const dateA = new Date(`${a.date.split('T')[0]}T${a.time || '00:00'}`).getTime();
    const dateB = new Date(`${b.date.split('T')[0]}T${b.time || '00:00'}`).getTime();
    return dateB - dateA; 
  });
};

export const sortLessonsByDate = (lessons: Lesson[]): Lesson[] => {
  return [...lessons].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

export const filterLessonsByCategory = (lessons: Lesson[], category: string): Lesson[] => {
  if (category === 'all') return lessons;
  return lessons.filter(lesson => lesson.category === category);
};

export const searchLessons = (lessons: Lesson[], query: string): Lesson[] => {
  const lowerQuery = query.toLowerCase();
  return lessons.filter(
    lesson =>
      lesson.title.toLowerCase().includes(lowerQuery) ||
      (lesson.instructorName || '').toLowerCase().includes(lowerQuery) ||
      lesson.category.toLowerCase().includes(lowerQuery)
  );
};

export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return i18n.t('common.today');
  } else if (diffDays === 1) {
    return i18n.t('common.yesterday');
  } else if (diffDays < 7) {
    const dayNames = [
      i18n.t('common.days.sunday'),
      i18n.t('common.days.monday'),
      i18n.t('common.days.tuesday'),
      i18n.t('common.days.wednesday'),
      i18n.t('common.days.thursday'),
      i18n.t('common.days.friday'),
      i18n.t('common.days.saturday'),
    ];
    return dayNames[date.getDay()];
  } else {
    const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
    });
  }
};

export const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return i18n.t('common.justNow');
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });
  }
};

// Normalize day names to English keys (for database storage)
// Converts Turkish day names to English keys for consistency
const DAY_NAME_MAP: { [key: string]: string } = {
  // Turkish to English mapping
  'Pazartesi': 'monday',
  'Salı': 'tuesday',
  'Çarşamba': 'wednesday',
  'Perşembe': 'thursday',
  'Cuma': 'friday',
  'Cumartesi': 'saturday',
  'Pazar': 'sunday',
  // English (already normalized)
  'monday': 'monday',
  'tuesday': 'tuesday',
  'wednesday': 'wednesday',
  'thursday': 'thursday',
  'friday': 'friday',
  'saturday': 'saturday',
  'sunday': 'sunday',
  // Short forms
  'Pzt': 'monday',
  'Sal': 'tuesday',
  'Çar': 'wednesday',
  'Per': 'thursday',
  'Cum': 'friday',
  'Cmt': 'saturday',
  'Paz': 'sunday',
};

export const normalizeDayName = (day: string): string => {
  return DAY_NAME_MAP[day] || day.toLowerCase();
};

export const normalizeDaysOfWeek = (days: string[]): string[] => {
  return days.map(normalizeDayName);
};

/**
 * Calculate the next occurrence of a recurring lesson
 * @param daysOfWeek - Array of day names (e.g., ['monday', 'wednesday'])
 * @param time - Time string (e.g., '14:00')
 * @param count - Number of upcoming occurrences to return (default: 1)
 * @returns Array of next occurrence dates
 */
export const getNextLessonOccurrence = (
  daysOfWeek: string[],
  time: string,
  count: number = 1
): Date[] => {
  if (!daysOfWeek || daysOfWeek.length === 0 || !time) {
    return [];
  }

  const DAY_TO_NUMBER: { [key: string]: number } = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  };

  const normalizedDays = normalizeDaysOfWeek(daysOfWeek);
  const dayNumbers = normalizedDays
    .map(day => DAY_TO_NUMBER[day])
    .filter(num => num !== undefined)
    .sort((a, b) => a - b);

  if (dayNumbers.length === 0) {
    return [];
  }

  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const results: Date[] = [];

  // Find next occurrences
  let searchDate = new Date(now);
  while (results.length < count) {
    const currentDay = searchDate.getDay();
    
    // Find next matching day
    let nextDayNumber: number | null = null;
    let daysToAdd = 0;

    // First, check if any day is today or later this week
    for (const dayNum of dayNumbers) {
      if (dayNum > currentDay) {
        nextDayNumber = dayNum;
        daysToAdd = dayNum - currentDay;
        break;
      } else if (dayNum === currentDay) {
        // Check if time hasn't passed yet
        const todayLesson = new Date(searchDate);
        todayLesson.setHours(hours, minutes, 0, 0);
        if (todayLesson > now) {
          nextDayNumber = dayNum;
          daysToAdd = 0;
          break;
        }
      }
    }

    // If no day found this week, take first day of next week
    if (nextDayNumber === null) {
      nextDayNumber = dayNumbers[0];
      daysToAdd = 7 - currentDay + nextDayNumber;
    }

    // Create the next occurrence date
    const nextDate = new Date(searchDate);
    nextDate.setDate(searchDate.getDate() + daysToAdd);
    nextDate.setHours(hours, minutes, 0, 0);

    results.push(nextDate);

    // Move search date to day after this occurrence
    searchDate = new Date(nextDate);
    searchDate.setDate(searchDate.getDate() + 1);
  }

  return results;
};
