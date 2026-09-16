import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  // Dynamic bottom inset handling for all Android navigation modes
  const bottomInset =
    Platform.OS === "android"
      ? Math.max(insets.bottom, 12)
      : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: isDark ? "#64748B" : "#94A3B8",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 12,
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 10,
          height: 60 + bottomInset,
          paddingBottom: bottomInset + 4,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && [
                  styles.iconWrapActive,
                  { backgroundColor: isDark ? "rgba(96, 165, 250, 0.16)" : "rgba(37, 99, 235, 0.1)" },
                ],
              ]}
            >
              <Ionicons
                size={22}
                name={focused ? "grid" : "grid-outline"}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shops"
        options={{
          title: "Shops",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && [
                  styles.iconWrapActive,
                  { backgroundColor: isDark ? "rgba(96, 165, 250, 0.16)" : "rgba(37, 99, 235, 0.1)" },
                ],
              ]}
            >
              <Ionicons
                size={22}
                name={focused ? "business" : "business-outline"}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && [
                  styles.iconWrapActive,
                  { backgroundColor: isDark ? "rgba(96, 165, 250, 0.16)" : "rgba(37, 99, 235, 0.1)" },
                ],
              ]}
            >
              <Ionicons
                size={22}
                name={focused ? "card" : "card-outline"}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: "Tenants",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && [
                  styles.iconWrapActive,
                  { backgroundColor: isDark ? "rgba(96, 165, 250, 0.16)" : "rgba(37, 99, 235, 0.1)" },
                ],
              ]}
            >
              <Ionicons
                size={22}
                name={focused ? "people" : "people-outline"}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && [
                  styles.iconWrapActive,
                  { backgroundColor: isDark ? "rgba(96, 165, 250, 0.16)" : "rgba(37, 99, 235, 0.1)" },
                ],
              ]}
            >
              <Ionicons
                size={22}
                name={focused ? "person" : "person-outline"}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    transform: [{ scale: 1.05 }],
  },
});
