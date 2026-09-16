import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeSelector } from "@/components/ui/theme-selector";
import { ScalePressable } from "@/components/ui/scale-pressable";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useProperty } from "@/contexts/PropertyContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const topInset = Math.max(insets.top, Platform.OS === "android" ? 24 : 0);

  const { selectedProperty } = useProperty();

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }

  const menuItems: {
    label: string;
    sub: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    route: string;
  }[] = [
    {
      label: "Switch Property",
      sub: `Currently managing: ${selectedProperty}`,
      icon: "business-outline",
      color: "#F59E0B",
      route: "/property-select",
    },
    {
      label: "System Settings",
      sub: "Notifications, backup & profile",
      icon: "settings-outline",
      color: "#3B82F6",
      route: "/settings",
    },
    {
      label: "Security & Password",
      sub: "Change password & credentials",
      icon: "shield-checkmark-outline",
      color: "#10B981",
      route: "/change-password",
    },
    {
      label: "Pending Approvals",
      sub: "Tenant requests & authorizations",
      icon: "checkbox-outline",
      color: "#8B5CF6",
      route: "/approvals",
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: "Account", headerShown: false }} />

      {/* Header Profile Hero Banner */}
      <LinearGradient
        colors={
          isDark
            ? ["#0b1219", "#111c26", "#162432"]
            : ["#1E40AF", "#2563EB", "#3B82F6"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerBanner, { paddingTop: topInset + 16 }]}
      >
        <View style={styles.avatarGlowRing}>
          <LinearGradient
            colors={["#60A5FA", "#2563EB"]}
            style={styles.avatarInner}
          >
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
            </Text>
          </LinearGradient>
        </View>

        <Text style={styles.username}>{user?.username ?? "Property Manager"}</Text>
        <Text style={styles.email}>{user?.email ?? "manager@rentalhub.com"}</Text>

        <View style={styles.roleBadge}>
          <Ionicons name="shield-outline" size={12} color="#60A5FA" />
          <Text style={styles.roleText}>ADMINISTRATOR</Text>
        </View>
      </LinearGradient>

      {/* Theme Selection Card */}
      <View style={styles.cardSection}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Appearance & Theme
        </Text>
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: isDark ? "#151F32" : "#FFFFFF",
              borderColor: isDark ? "#23324D" : "#E2E8F0",
            },
          ]}
        >
          <View style={styles.themeSelectorWrap}>
            <View style={styles.themeHeaderRow}>
              <Ionicons
                name="color-palette-outline"
                size={20}
                color={colors.tint}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>
                  App Theme
                </Text>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                  Choose system default, light, or dark mode
                </Text>
              </View>
            </View>
            <ThemeSelector />
          </View>
        </View>
      </View>

      {/* Management Navigation */}
      <View style={styles.cardSection}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Preferences & Controls
        </Text>
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: isDark ? "#151F32" : "#FFFFFF",
              borderColor: isDark ? "#23324D" : "#E2E8F0",
            },
          ]}
        >
          {menuItems.map((item, i) => (
            <ScalePressable
              key={item.label}
              style={[
                styles.menuItem,
                i < menuItems.length - 1 && {
                  borderBottomColor: isDark ? "#1E293B" : "#F1F5F9",
                },
              ]}
              onPress={() => router.push(item.route as Href)}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: item.color + "18" },
                  ]}
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Text
                    style={[styles.subLabel, { color: colors.textSecondary }]}
                  >
                    {item.sub}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.icon}
              />
            </ScalePressable>
          ))}
        </View>
      </View>

      {/* Session Card */}
      <View style={styles.cardSection}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Session
        </Text>
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: isDark ? "#151F32" : "#FFFFFF",
              borderColor: isDark ? "#23324D" : "#E2E8F0",
            },
          ]}
        >
          <ScalePressable style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: "rgba(239, 68, 68, 0.12)" },
                ]}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuLabel, { color: "#EF4444" }]}>
                  Sign Out
                </Text>
                <Text
                  style={[styles.subLabel, { color: colors.textSecondary }]}
                >
                  Log out of this device
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </ScalePressable>
        </View>
      </View>

      <View style={styles.footer}>
        <BrandLogo size="sm" showText={false} variant={isDark ? "dark" : "blue"} />
        <Text style={[styles.footerBrand, { color: colors.text }]}>RentalApp</Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Property & Tenancy Management · Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  headerBanner: {
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  avatarGlowRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },
  username: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  email: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    backgroundColor: "rgba(96, 165, 250, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.3)",
  },
  roleText: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  themeSelectorWrap: {
    padding: 16,
    gap: 14,
  },
  themeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  subLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 10,
    gap: 6,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
