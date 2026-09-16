import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/contexts/AuthContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { PropertyProvider } from '@/contexts/PropertyContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ShopProvider } from '@/contexts/ShopContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigation() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.tint,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="property-select" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
        <Stack.Screen name="shop-form" options={{ presentation: 'modal', title: 'Shop Details' }} />
        <Stack.Screen name="tenant-form" options={{ presentation: 'modal', title: 'Tenant Details' }} />
        <Stack.Screen name="tenant-detail" options={{ title: 'Tenant' }} />
        <Stack.Screen name="payment-form" options={{ presentation: 'modal', title: 'Payment Details' }} />
        <Stack.Screen name="approvals" options={{ title: 'Approvals' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AuthProvider>
          <PropertyProvider>
            <PaymentProvider>
              <ShopProvider>
                <TenantProvider>
                  <RootNavigation />
                </TenantProvider>
              </ShopProvider>
            </PaymentProvider>
          </PropertyProvider>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
