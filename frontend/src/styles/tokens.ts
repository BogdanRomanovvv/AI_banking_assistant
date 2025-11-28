// Design tokens для AI Banking Assistant
// Цветовая схема: синий / белый / оранжевый

export const colors = {
  // Primary Blues
  primaryDark: '#0B4F8C',
  primary: '#1E6FD9',
  primaryLight: '#E9F2FF',
  
  // Accent Orange
  accent: '#FF6A00',
  accentLight: '#FF8A33',
  accentHover: '#E55F00',
  
  // Neutrals
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  bgTertiary: '#E9F2FF',
  
  // Borders
  borderLight: '#E5E7EB',
  borderMedium: '#D1D5DB',
  borderDark: '#9CA3AF',
  
  // Shadows
  shadow: 'rgba(16, 24, 40, 0.06)',
  shadowMedium: 'rgba(16, 24, 40, 0.10)',
  shadowLarge: 'rgba(16, 24, 40, 0.15)',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
};

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const shadows = {
  sm: `0 1px 2px 0 ${colors.shadow}`,
  md: `0 4px 6px -1px ${colors.shadow}, 0 2px 4px -1px ${colors.shadow}`,
  lg: `0 10px 15px -3px ${colors.shadowMedium}, 0 4px 6px -2px ${colors.shadow}`,
  xl: `0 20px 25px -5px ${colors.shadowMedium}, 0 10px 10px -5px ${colors.shadow}`,
};

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '350ms ease-in-out',
};

// Колонки статусов для Kanban
export const statusColumns = {
  NEW: {
    id: 'NEW',
    title: 'К ВЫПОЛНЕНИЮ',
    color: colors.gray500,
    bgColor: colors.gray50,
  },
  ANALYZING: {
    id: 'ANALYZING',
    title: 'В РАБОТЕ',
    color: colors.primary,
    bgColor: colors.primaryLight,
  },
  DRAFT_READY: {
    id: 'DRAFT_READY',
    title: 'НА ПРОВЕРКЕ',
    color: colors.warning,
    bgColor: '#FEF3C7',
  },
  APPROVED: {
    id: 'APPROVED',
    title: 'ВЫПОЛНЕНО',
    color: colors.success,
    bgColor: '#D1FAE5',
  },
} as const;

export type StatusColumnKey = keyof typeof statusColumns;
