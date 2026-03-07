// Tramitly Design System - Theme Configuration

export const colors = {
  // Background colors
  bg: {
    primary: '#0A0F1A',
    secondary: '#111827',
    tertiary: '#1F2937',
    card: '#151C2C',
    elevated: '#1A2332',
  },
  
  // Brand colors
  brand: {
    primary: '#00D4FF',
    primaryDark: '#00A3CC',
    primaryLight: '#66E5FF',
    secondary: '#6366F1',
    accent: '#10B981',
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    muted: '#64748B',
    inverse: '#0A0F1A',
  },
  
  // Status colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    pending: '#F59E0B',
    processing: '#6366F1',
    completed: '#10B981',
    failed: '#EF4444',
    refunded: '#64748B',
  },
  
  // Border colors
  border: {
    default: '#1F2937',
    light: '#374151',
    focus: '#00D4FF',
  },
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,
  hero: 48,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};
