import { Link, Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function LoginScreen() {
  const { login, rememberedEmail } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  const [emailOrUsername, setEmailOrUsername] = useState(rememberedEmail ?? "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(!!rememberedEmail);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!emailOrUsername.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(emailOrUsername.trim(), password, rememberMe);
    } catch (e: unknown) {
      Alert.alert("Login Failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      borderColor: colors.border,
      backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={isDark ? ["#1E3A5F", "#0F172A"] : ["#2563EB", "#1D4ED8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroSection}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <ThemedText style={styles.logoText}>R</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.heroTitle}>RentalApp</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Manage your rentals with ease
            </ThemedText>
          </LinearGradient>

          <View style={styles.formSection}>
            <ThemedText style={styles.welcomeTitle}>Welcome back</ThemedText>
            <ThemedText style={styles.welcomeSubtitle}>
              Sign in to your account
            </ThemedText>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email or Username</ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="Enter email or username"
                  placeholderTextColor={colors.icon}
                  value={emailOrUsername}
                  onChangeText={setEmailOrUsername}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="Enter password"
                  placeholderTextColor={colors.icon}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.optionsRow}>
                <Pressable
                  style={styles.rememberMeRow}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: colors.tint,
                        backgroundColor: rememberMe ? colors.tint : "transparent",
                      },
                    ]}
                  >
                    {rememberMe && (
                      <ThemedText style={styles.checkmark}>✓</ThemedText>
                    )}
                  </View>
                  <ThemedText style={styles.rememberMeText}>Remember me</ThemedText>
                </Pressable>

                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable>
                    <ThemedText style={styles.forgotText}>Forgot password?</ThemedText>
                  </Pressable>
                </Link>
              </View>

              <Pressable
                style={[styles.button, { backgroundColor: colors.tint }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.buttonText}>Sign In</ThemedText>
                )}
              </Pressable>
            </View>

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>
                {"Don't have an account? "}
              </ThemedText>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <ThemedText style={styles.footerLink}>Sign Up</ThemedText>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
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
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  logoText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
  },
  formSection: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
    opacity: 0.5,
    marginBottom: 28,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  rememberMeText: {
    fontSize: 14,
    opacity: 0.7,
  },
  forgotText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    opacity: 0.5,
    fontSize: 15,
  },
  footerLink: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "700",
  },
});
