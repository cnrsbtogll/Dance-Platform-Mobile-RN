import { Lesson, Booking } from '../types';

export const formatPrice = (price: number): string => {
  return `₺${price.toLocaleString('tr-TR')}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatTime = (timeString: string): string => {
  return timeString; // Already in HH:mm format
};

export const formatDateTime = (dateString: string, timeString: string): string => {
  return `${formatDate(dateString)} ${timeString}`;
};

export const getDurationText = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} dakika`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} saat ${mins} dakika` : `${hours} saat`;
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

