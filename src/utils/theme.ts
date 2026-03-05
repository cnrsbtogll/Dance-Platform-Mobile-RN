// Theme colors based on stitch_dance_platform_mobil design references

export const colors = {
  // Student Home Page
  student: {
    primary: '#C7416C', // Deep Maroon (Bordo) - More dominant and premium
    secondary: '#C7416C', // Warm Dusty Rose (Lighter, closer to pink)
    accent: '#C7416C',
    rating: '#FFB800', // Classic star yellow
    background: {
      light: '#F8F9FA',
      dark: '#101922',
    },
    text: {
      primaryLight: '#2D3436', // Slightly softer than black
      primaryDark: '#E9ECEF',
      secondaryLight: '#636E72', // Softer grey for secondary text
      secondaryDark: '#adb5bd',
    },
    card: {
      light: '#ffffff',
      dark: '#1a2632',
    },
    border: {
      light: '#dee2e6',
      dark: '#343a40',
    },
  },
  
  // Instructor Home Page
  instructor: {
    primary: '#1ABC9C',
    secondary: '#005f73',
    background: {
      light: '#F8F9FA',
      dark: '#101922',
    },
    text: {
      lightPrimary: '#34495E',
      lightSecondary: '#617589',
      dark: '#E0E0E0',
    },
    card: {
      light: '#FFFFFF',
      dark: '#1a2632',
    },
    border: {
      light: '#dbe0e6',
      dark: '#34495E',
    },
  },
  
  // School Home Page
  school: {
    primary: '#D97706', // Yellow-brown / Amber
    secondary: '#92400E',
    background: {
      light: '#FFFBEB',
      dark: '#101922',
    },
    text: {
      lightPrimary: '#451A03',
      lightSecondary: '#78350F',
      dark: '#FEF3C7',
    },
    card: {
      light: '#FFFFFF',
      dark: '#1a2632',
    },
    border: {
      light: '#FDE68A',
      dark: '#78350F',
    },
  },
  
  // Lesson Creation
  lessonCreation: {
    primary: '#137fec',
    background: {
      light: '#f6f7f8',
      dark: '#101922',
    },
  },
  
  // Payment Screen
  payment: {
    primary: '#2E8B57',
    secondary: '#F08080',
    background: {
      light: '#F8F9FA',
      dark: '#101922',
    },
    text: {
      primaryLight: '#343A40',
      primaryDark: '#F8F9FA',
      secondaryLight: '#617589',
      secondaryDark: '#98A2B3',
    },
    border: {
      light: '#E5E7EB',
      dark: '#374151',
    },
  },
  
  // General
  general: {
    danger: '#e53e3e',
    success: '#48C9B0',
    warning: '#ee9b00',
    info: '#137fec',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  fontFamily: {
    display: 'Lexend', // Will need to be loaded via expo-font
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 22,
    '3xl': 24,
    '4xl': 32,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Helper function to get theme based on user role
export const getTheme = (role: 'student' | 'instructor' | 'school' = 'student') => {
  if (role === 'school') return colors.school;
  return role === 'student' ? colors.student : colors.instructor;
};

export const getPalette = (role: 'student' | 'instructor' | 'school', dark: boolean) => {
  const base = role === 'school' ? colors.school : (role === 'student' ? colors.student : colors.instructor);
  const background = dark ? base.background.dark : base.background.light;
  const card = dark ? base.card.dark : base.card.light;
  const border = dark ? base.border.dark : base.border.light;
  const text = role === 'student'
    ? {
        primary: dark ? colors.student.text.primaryDark : colors.student.text.primaryLight,
        secondary: dark ? '#CBD5E1' : colors.student.text.secondaryLight,
      }
    : role === 'school'
      ? {
          primary: dark ? colors.school.text.dark : colors.school.text.lightPrimary,
          secondary: dark ? '#FDE68A' : colors.school.text.lightSecondary,
        }
      : {
          primary: dark ? colors.instructor.text.dark : colors.instructor.text.lightPrimary,
          secondary: dark ? '#CBD5E1' : colors.instructor.text.lightSecondary,
        };
  return {
    primary: base.primary,
    secondary: base.secondary,
    background,
    card,
    border,
    text,
  };
};
