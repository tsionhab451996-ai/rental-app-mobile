import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * To support static rendering on web, hydration is respected while connecting to SettingsContext.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const systemScheme = useRNColorScheme() ?? 'light';

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  try {
    const settings = useSettings();
    if (!hasHydrated) return 'light';
    if (settings.themeMode === 'dark') return 'dark';
    if (settings.themeMode === 'light') return 'light';
    return systemScheme;
  } catch {
    return hasHydrated ? systemScheme : 'light';
  }
}

export function useThemePreference() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const systemScheme = useRNColorScheme() ?? 'light';

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  try {
    const settings = useSettings();
    const resolvedTheme: 'light' | 'dark' =
      !hasHydrated
        ? 'light'
        : settings.themeMode === 'system'
        ? systemScheme
        : settings.themeMode;
    return {
      themeMode: settings.themeMode,
      resolvedTheme,
      isDark: resolvedTheme === 'dark',
      setThemeMode: settings.setThemeMode,
    };
  } catch {
    return {
      themeMode: 'system' as const,
      resolvedTheme: hasHydrated ? systemScheme : 'light',
      isDark: hasHydrated && systemScheme === 'dark',
      setThemeMode: async () => {},
    };
  }
}
