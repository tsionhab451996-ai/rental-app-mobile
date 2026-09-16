import { Platform } from 'react-native';

const tintColorLight = '#2563EB';
const tintColorDark = '#60A5FA';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    tint: tintColorLight,
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    primaryDark: '#1D4ED8',
    icon: '#94A3B8',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    inputBg: '#F8FAFC',
    inputBorder: '#CBD5E1',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    info: '#3B82F6',
    infoLight: '#EFF6FF',
    cardShadow: '#0F172A',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    background: '#0B1120',
    surface: '#151F32',
    surfaceElevated: '#1E293B',
    surfaceSubtle: '#0F172A',
    card: '#151F32',
    cardBorder: '#23324D',
    tint: tintColorDark,
    primary: '#3B82F6',
    primaryLight: 'rgba(59, 130, 246, 0.15)',
    primaryDark: '#1E40AF',
    icon: '#64748B',
    border: '#23324D',
    borderSubtle: '#1E293B',
    inputBg: '#0F172A',
    inputBorder: '#2E3E5B',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.15)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.15)',
    danger: '#F87171',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    info: '#60A5FA',
    infoLight: 'rgba(96, 165, 250, 0.15)',
    cardShadow: '#000000',
  },
};

export const Gradients = {
  light: {
    header: ['#1D4ED8', '#2563EB', '#3B82F6'] as const,
    accent: ['#3B82F6', '#1D4ED8'] as const,
  },
  dark: {
    header: ['#0B132B', '#111E3D', '#16274E'] as const,
    accent: ['#2563EB', '#1D4ED8'] as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
