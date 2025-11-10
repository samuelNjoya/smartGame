// src/constants/theme.ts

export const palette = {
  primary: '#6A1B9A', // Violet
  secondary: '#FFC107', // Jaune
  accent: '#00BCD4', // Cyan
  error: '#D32F2F',
  success: '#4CAF50',
  
  white: '#FFFFFF',
  black: '#000000',
  grey: '#9E9E9E',
  lightGrey: '#F5F5F5',
  darkGrey: '#333333',
};

export const lightTheme = {
  background: palette.lightGrey,
  card: palette.white,
  text: palette.darkGrey,
  primary: palette.primary,
  secondary: palette.secondary,
  accent: palette.accent,
  error: palette.error,
  success: palette.success,
};

export const darkTheme = {
  background: palette.darkGrey,
  card: '#424242',
  text: palette.lightGrey,
  primary: palette.primary,
  secondary: palette.secondary,
  accent: palette.accent,
  error: palette.error,
  success: palette.success,
};

export type AppTheme = typeof lightTheme;