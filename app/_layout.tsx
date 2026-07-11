import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ShopProvider } from '@/contexts/ShopContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SettingsProvider>
        <PaymentProvider>
        <ShopProvider>
          <TenantProvider>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
            <Stack.Screen name="shop-form" options={{ presentation: 'modal', title: 'Shop Details' }} />
            <Stack.Screen name="tenant-form" options={{ presentation: 'modal', title: 'Tenant Details' }} />
            <Stack.Screen name="tenant-detail" options={{ title: 'Tenant' }} />
            <Stack.Screen name="payment-form" options={{ presentation: 'modal', title: 'Payment Details' }} />
            <Stack.Screen name="approvals" options={{ title: 'Approvals' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          </TenantProvider>
        </ShopProvider>
        </PaymentProvider>
        </SettingsProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
