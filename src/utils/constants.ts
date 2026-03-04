export const LESSON_CATEGORIES = ['Salsa', 'Bachata', 'Tango', 'Kizomba'] as const;

export const DANCE_STYLES = [
  'Salsa', 'Bachata', 'Tango', 'Kizomba', 'Zouk',
  'Swing', 'Foxtrot', 'Waltz', 'Cha-Cha', 'Rumba',
  'Jive', 'Quickstep', 'Disco', 'Hip-Hop', 'Breakdance',
] as const;

export type DanceStyle = typeof DANCE_STYLES[number];

export const DANCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'] as const;

export type DanceLevel = typeof DANCE_LEVELS[number];

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

