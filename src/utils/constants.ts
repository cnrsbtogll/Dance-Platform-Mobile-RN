export const DANCE_STYLES = [
  'Salsa', 'Bachata', 'Tango', 'Kizomba', 'Zouk',
  'Swing', 'Foxtrot', 'Waltz', 'Cha-Cha', 'Rumba',
  'Jive', 'Quickstep', 'Disco', 'Hip-Hop', 'Breakdance',
  'Zumba', 'Bale', 'Modern Dans', 'Halk Oyunları', 'Vals'
] as const;

export const DANCE_STYLE_IMAGE_MAPPING: { [key: string]: string } = {
  'Salsa': 'salsa',
  'Bachata': 'bachata',
  'Kizomba': 'kizomba',
  'Tango': 'tango',
  'Modern Dans': 'moderndance',
  'Modern': 'moderndance',
  'Halk Oyunları': 'halkoyunlari',
  'Bale': 'bale',
  'Zumba': 'zumba',
  'Swing': 'swing',
  'Foxtrot': 'foxtrot',
  'Waltz': 'waltz',
  'Cha-Cha': 'cha-cha',
  'Rumba': 'rumba',
  'Jive': 'jive',
  'Quickstep': 'quickstep',
  'Disco': 'disco',
  'Hip-Hop': 'hip-hop',
  'Breakdance': 'breakdance',
  'Zouk': 'zouk',
  'Vals': 'vals',
};

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

