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
import { Link, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { BrandLogo } from "@/components/ui/brand-logo";
import { ScalePressable } from "@/components/ui/scale-pressable";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { forgotPassword } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const topInset = Math.max(insets.top, Platform.OS === "android" ? 24 : 0);

  async function handleSubmit() {
    if (!emailOrUsername.trim()) {
      Alert.alert("Required", "Please enter your email or username.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(emailOrUsername.trim());
      setSent(true);
    } catch (e: unknown) {
      Alert.alert("Error", (e as Error).message);
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
                : ["#0b1219", "#112032", "#193555"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroSection, { paddingTop: topInset + 20 }]}
          >
            <BrandLogo size="md" />
            <Text style={styles.heroTitle}>RentalApp</Text>
            <Text style={styles.heroSubtitle}>Account Recovery</Text>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              {sent ? "Check Your Token" : "Forgot Password?"}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {sent
                ? "A reset token has been generated. Use the token to create your new password."
                : "Enter your registered email address or username and we'll help you recover your access."}
            </Text>

            {!sent ? (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Email or Username
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
                      name="mail-outline"
                      size={20}
                      color={colors.icon}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. landlord@example.com"
                      placeholderTextColor={colors.icon}
                      value={emailOrUsername}
                      onChangeText={setEmailOrUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <ScalePressable
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 },
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? "Sending..." : "Send Reset Token"}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
            ) : (
              <View style={styles.sentContainer}>
                <View
                  style={[
                    styles.successBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(16, 185, 129, 0.15)"
                        : "#ECFDF5",
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={48}
                    color="#10B981"
                  />
                  <Text style={[styles.successTitle, { color: colors.text }]}>
                    Token Ready
                  </Text>
                  <Text
                    style={[styles.successDesc, { color: colors.textSecondary }]}
                  >
                    Continue to the reset screen and enter your token along with your new password.
                  </Text>
                </View>

                <Link href="/(auth)/reset-password" asChild>
                  <ScalePressable
                    style={[
                      styles.primaryButton,
                      { backgroundColor: colors.tint },
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      Continue to Reset Password
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </ScalePressable>
                </Link>

                <Link href="/(auth)/login" asChild>
                  <ScalePressable style={styles.backButton}>
                    <Ionicons name="chevron-back" size={18} color={colors.tint} />
                    <Text style={[styles.backButtonText, { color: colors.tint }]}>
                      Return to Sign In
                    </Text>
                  </ScalePressable>
                </Link>
              </View>
            )}
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
  sentContainer: {
    gap: 20,
  },
  successBadge: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    textAlign: "center",
    gap: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  successDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});
