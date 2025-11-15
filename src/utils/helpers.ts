import { Lesson, Booking, Currency } from '../types';
import i18n from './i18n';

export const CURRENCY_SYMBOLS: { [key in Currency]: string } = {
  USD: '$',
  EUR: '€',
  TRY: '₺',
};

export const formatPrice = (price: number, currency: Currency = 'USD'): string => {
  const symbol = CURRENCY_SYMBOLS[currency];
  const locale = currency === 'TRY' ? 'tr-TR' : currency === 'EUR' ? 'de-DE' : 'en-US';
  return `${symbol}${price.toLocaleString(locale)}`;
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
  } else if (diffDays > 1 && diffDays < 7) {
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

export const formatTime = (timeString: string): string => {
  return timeString; // Already in HH:mm format
};

export const formatDateTime = (dateString: string, timeString: string): string => {
  return `${formatDate(dateString)} ${timeString}`;
};

export const getDurationText = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} ${i18n.t('common.minutes')}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins > 0) {
    return `${hours} ${i18n.t('common.hours')} ${mins} ${i18n.t('common.minutes')}`;
  }
  return `${hours} ${i18n.t('common.hours')}`;
};

export const calculateTotalPrice = (bookings: Booking[]): number => {
  return bookings.reduce((total, booking) => total + booking.price, 0);
};

export const getUpcomingBookings = (bookings: Booking[]): Booking[] => {
  const now = new Date();
  return bookings
    .filter(booking => {
      const bookingDate = new Date(`${booking.date}T${booking.time}`);
      return bookingDate > now && booking.status !== 'cancelled';
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateA - dateB;
    });
};

export const getPastBookings = (bookings: Booking[]): Booking[] => {
  const now = new Date();
  return bookings
    .filter(booking => {
      const bookingDate = new Date(`${booking.date}T${booking.time}`);
      return bookingDate <= now || booking.status === 'cancelled';
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateB - dateA;
    });
};

export const getRatingStars = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '★'.repeat(fullStars);
  if (hasHalfStar) stars += '½';
  stars += '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
  return stars;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
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
};

export const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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

