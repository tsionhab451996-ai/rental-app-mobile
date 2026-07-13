import { Stack, useRouter, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
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

  const menuItems = [
    {
      label: "Settings",
      icon: "⚙️",
      onPress: () => router.push("/settings" as Href),
    },
    {
      label: "Change Password",
      icon: "🔒",
      onPress: () => router.push("/change-password" as Href),
    },
    {
      label: "Approvals",
      icon: "✅",
      onPress: () => router.push("/approvals" as Href),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: "Account", headerShown: false }} />
      <LinearGradient
        colors={isDark ? ["#1E3A5F", "#0F172A"] : ["#2563EB", "#1D4ED8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBanner}
      >
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            <ThemedText style={styles.avatarText}>
              {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.username}>
          {user?.username ?? "User"}
        </ThemedText>
        <ThemedText style={styles.email}>{user?.email}</ThemedText>
      </LinearGradient>

      <View style={styles.cardSection}>
        <ThemedText style={styles.sectionLabel}>Account</ThemedText>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {menuItems.map((item, i) => (
            <Pressable
              key={item.label}
              style={[
                styles.menuItem,
                i < menuItems.length - 1 && {
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <ThemedText style={styles.menuIcon}>{item.icon}</ThemedText>
                <ThemedText style={[styles.menuLabel, { color: colors.text }]}>
                  {item.label}
                </ThemedText>
              </View>
              <ThemedText style={[styles.chevron, { color: colors.icon }]}>
                ›
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.cardSection}>
        <ThemedText style={styles.sectionLabel}>Session</ThemedText>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <ThemedText style={styles.menuIcon}>🚪</ThemedText>
              <ThemedText style={{ color: "#EF4444", fontSize: 16, fontWeight: "600" }}>
                Sign Out
              </ThemedText>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>RentalApp v1.0.0</ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  headerBanner: {
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: "center",
    gap: 8,
  },
  avatarOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
  },
  username: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  email: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  cardSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    opacity: 0.4,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  chevron: {
    fontSize: 24,
    fontWeight: "300",
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.3,
  },
});
