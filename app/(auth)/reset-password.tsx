import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { BrandLogo } from "@/components/ui/brand-logo";
import { ScalePressable } from "@/components/ui/scale-pressable";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const topInset = Math.max(insets.top, Platform.OS === "android" ? 24 : 0);

  async function handleReset() {
    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Required", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token.trim().toUpperCase(), newPassword);
      Alert.alert("Success", "Your password has been successfully reset.", [
        {
          text: "Sign In",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (e: unknown) {
      Alert.alert("Reset Failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branded Hero Header */}
          <LinearGradient
            colors={
              isDark
                ? ["#0b1219", "#0e1722", "#132130"]
                : ["#0b1219", "#0f2035", "#1e3a5f"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroSection, { paddingTop: topInset + 20 }]}
          >
            <BrandLogo size="md" variant="dark" />
            <Text style={styles.heroTitle}>RentalApp</Text>
            <Text style={styles.heroSubtitle}>Choose New Password</Text>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              Enter Reset Token
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Enter the verification token along with your new password credentials.
            </Text>

            <View style={styles.form}>
              {/* Token Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Reset Token
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={colors.icon}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. 8A4F12"
                    placeholderTextColor={colors.icon}
                    value={token}
                    onChangeText={setToken}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* New Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  New Password
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.icon}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.icon}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <ScalePressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={colors.icon}
                    />
                  </ScalePressable>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Confirm New Password
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={colors.icon}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Repeat new password"
                    placeholderTextColor={colors.icon}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Reset Button */}
              <ScalePressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 },
                ]}
                onPress={handleReset}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Updating..." : "Confirm & Save Password"}
                </Text>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </ScalePressable>

              <Link href="/(auth)/login" asChild>
                <ScalePressable style={styles.backButton}>
                  <Ionicons name="chevron-back" size={18} color={colors.tint} />
                  <Text style={[styles.backButtonText, { color: colors.tint }]}>
                    Back to Sign In
                  </Text>
                </ScalePressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2,
    fontWeight: "500",
  },
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  eyeBtn: {
    padding: 6,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
