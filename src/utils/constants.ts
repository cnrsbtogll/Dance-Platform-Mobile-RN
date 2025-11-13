export const LESSON_CATEGORIES = ['Salsa', 'Bachata', 'Tango', 'Kizomba'] as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
} as const;

export const DURATION_OPTIONS = [45, 60, 90] as const;

