import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * Returns the resolved color scheme ('light' or 'dark') based on
 * user preference in SettingsContext (system, light, dark).
 */
export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme() ?? 'light';
  try {
    const settings = useSettings();
    if (settings.themeMode === 'dark') return 'dark';
    if (settings.themeMode === 'light') return 'light';
    return systemScheme;
  } catch {
    return systemScheme;
  }
}

/**
 * Returns the theme preference details:
 * - themeMode: 'system' | 'light' | 'dark'
 * - resolvedTheme: 'light' | 'dark'
 * - setThemeMode: function to update
 */
export function useThemePreference() {
  const systemScheme = useRNColorScheme() ?? 'light';
  try {
    const settings = useSettings();
    const resolvedTheme: 'light' | 'dark' =
      settings.themeMode === 'system' ? systemScheme : settings.themeMode;
    return {
      themeMode: settings.themeMode,
      resolvedTheme,
      isDark: resolvedTheme === 'dark',
      setThemeMode: settings.setThemeMode,
    };
  } catch {
    return {
      themeMode: 'system' as const,
      resolvedTheme: systemScheme,
      isDark: systemScheme === 'dark',
      setThemeMode: async () => {},
    };
  }
}
