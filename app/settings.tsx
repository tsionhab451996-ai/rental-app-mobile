import { Stack, useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { File, Paths } from "expo-file-system";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTenants } from "@/contexts/TenantContext";

function SectionHeader({ title }: { title: string }) {
  return <ThemedText style={styles.sectionHeader}>{title}</ThemedText>;
}

function SettingRow({
  label,
  value,
  onPress,
  colors,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  colors: any;
}) {
  return (
    <Pressable
      style={[
        styles.settingRow,
        { borderBottomColor: colors.icon + "20" },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      <View style={styles.settingRight}>
        {value && (
          <ThemedText style={[styles.settingValue, { color: colors.icon }]}>
            {value}
          </ThemedText>
        )}
        {onPress && <ThemedText style={styles.chevron}>›</ThemedText>}
      </View>
    </Pressable>
  );
}

function SettingToggle({
  label,
  description,
  value,
  onValueChange,
  colors,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: any;
}) {
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.icon + "20" }]}>
      <View style={styles.toggleTextContainer}>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
        {description && (
          <ThemedText style={[styles.settingDescription, { color: colors.icon }]}>
            {description}
          </ThemedText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#767577", true: "#0a7ea4" }}
        thumbColor="#fff"
      />
    </View>
  );
}

function InlineEditRow({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: any;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={[styles.editRow, { borderBottomColor: colors.icon + "20" }]}>
      <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      <TextInput
        style={[
          styles.inlineInput,
          {
            color: colors.text,
            borderColor: colors.icon + "30",
            backgroundColor: colors.icon + "10",
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const {
    settings,
    updateProfile,
    updateNotifications,
    updateNotificationDays,
    updateSecurity,
    updateAppearance,
    setPin,
    removePin,
  } = useSettings();
  const { tenants } = useTenants();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [ownerName, setOwnerName] = useState(settings.profile.ownerName);
  const [marketplaceName, setMarketplaceName] = useState(settings.profile.marketplaceName);
  const [phone, setPhone] = useState(settings.profile.phone);
  const [profileEmail, setProfileEmail] = useState(settings.profile.email || user?.email || "");
  const [telegramBotToken, setTelegramBotToken] = useState(settings.notifications.telegramBotToken || "");
  const [telegramBotUsername, setTelegramBotUsername] = useState(settings.notifications.telegramBotUsername || "");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [hasBiometric, setHasBiometric] = useState(false);

  useEffect(() => {
    setOwnerName(settings.profile.ownerName);
    setMarketplaceName(settings.profile.marketplaceName);
    setPhone(settings.profile.phone);
    setProfileEmail(settings.profile.email || user?.email || "");
    setTelegramBotToken(settings.notifications.telegramBotToken || "");
    setTelegramBotUsername(settings.notifications.telegramBotUsername || "");
  }, [settings.profile, settings.notifications, user]);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  async function checkBiometricSupport() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometric(compatible && enrolled);
    } catch {
      setHasBiometric(false);
    }
  }

  const saveProfile = useCallback(async () => {
    await updateProfile({
      ownerName,
      marketplaceName,
      phone,
      email: profileEmail,
    });
  }, [ownerName, marketplaceName, phone, profileEmail, updateProfile]);

  const saveTelegramConfig = useCallback(async () => {
    await updateNotifications({
      telegramBotToken,
      telegramBotUsername,
    });
  }, [telegramBotToken, telegramBotUsername, updateNotifications]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (
        ownerName !== settings.profile.ownerName ||
        marketplaceName !== settings.profile.marketplaceName ||
        phone !== settings.profile.phone ||
        profileEmail !== (settings.profile.email || user?.email || "")
      ) {
        saveProfile();
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [ownerName, marketplaceName, phone, profileEmail]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (
        telegramBotToken !== (settings.notifications.telegramBotToken || "") ||
        telegramBotUsername !== (settings.notifications.telegramBotUsername || "")
      ) {
        saveTelegramConfig();
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [telegramBotToken, telegramBotUsername]);

  const handleTestTelegramBot = async () => {
    const token = telegramBotToken.trim();
    if (!token) {
      Alert.alert("Error", "Please enter your Telegram Bot Token from @BotFather.");
      return;
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();
      if (data.ok && data.result) {
        const botUsername = `@${data.result.username}`;
        if (!telegramBotUsername.trim()) {
          setTelegramBotUsername(botUsername);
          await updateNotifications({ telegramBotUsername: botUsername, telegramBotToken: token });
        } else {
          await updateNotifications({ telegramBotToken: token });
        }
        Alert.alert(
          "Success!",
          `Telegram Bot Connected!\n\nBot Name: ${data.result.first_name}\nUsername: ${botUsername}\n\nRenters can start your bot at:\nhttps://t.me/${data.result.username}`
        );
      } else {
        Alert.alert("Invalid Token", data.description || "Telegram API rejected this bot token.");
      }
    } catch (e: any) {
      Alert.alert("Connection Error", e.message || "Failed to contact Telegram servers.");
    }
  };

  async function handleFingerprintToggle(value: boolean) {
    if (value) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to enable fingerprint login",
          cancelLabel: "Cancel",
        });
        if (result.success) {
          await updateSecurity({ fingerprintEnabled: true });
        }
      } catch {
        Alert.alert("Error", "Fingerprint authentication is not available on this device.");
      }
    } else {
      await updateSecurity({ fingerprintEnabled: false });
    }
  }

  function handlePinSetup() {
    setPinInput("");
    setConfirmPinInput("");
    setShowPinModal(true);
  }

  function confirmPinSetup() {
    if (pinInput.length < 4) {
      Alert.alert("Error", "PIN must be at least 4 digits.");
      return;
    }
    if (pinInput !== confirmPinInput) {
      Alert.alert("Error", "PINs do not match.");
      return;
    }
    setPin(pinInput);
    setShowPinModal(false);
    Alert.alert("Success", "PIN lock has been set up.");
  }

  async function handleRemovePin() {
    Alert.alert("Remove PIN", "Are you sure you want to remove PIN lock?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removePin();
          Alert.alert("Done", "PIN lock has been removed.");
        },
      },
    ]);
  }

  async function handleDarkModeToggle(value: boolean) {
    await updateAppearance({ darkMode: value });
  }

  async function handleLanguageChange() {
    const languages = ["English", "Amharic", "Afaan Oromoo"];
    Alert.alert("Select Language", "Choose your preferred language", [
      ...languages.map((lang) => ({
        text: lang,
        onPress: async () => await updateAppearance({ language: lang }),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  async function handleCloudBackup() {
    try {
      const data = {
        settings,
        tenants,
        backupDate: new Date().toISOString(),
        version: "1.0.0",
      };
      const json = JSON.stringify(data, null, 2);
      const fileName = `rentalapp-backup-${Date.now()}.json`;
      const file = new File(Paths.document, fileName);
      file.write(json);
      Alert.alert("Backup Complete", `Backup saved to app documents.\n\nFile: ${fileName}`);
    } catch (e) {
      Alert.alert("Backup Failed", (e as Error).message);
    }
  }

  async function handleRestoreBackup() {
    Alert.alert(
      "Restore Backup",
      "This will replace all current data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            Alert.alert("Info", "Please place your backup file in the app documents directory and restart the app to restore.");
          },
        },
      ]
    );
  }

  function handleReminderTimePress() {
    const times = ["08:00", "09:00", "10:00", "12:00", "17:00", "20:00"];
    Alert.alert(
      "Reminder Time",
      "Select when to send daily reminders",
      [
        ...times.map((t) => ({
          text: t,
          onPress: async () => await updateNotifications({ reminderTime: t }),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Settings" }} />

      {showPinModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {settings.security.pinEnabled ? "Change PIN" : "Set Up PIN"}
            </ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  borderColor: colors.icon + "30",
                  backgroundColor: colors.icon + "10",
                },
              ]}
              placeholder="Enter PIN"
              placeholderTextColor={colors.icon}
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  borderColor: colors.icon + "30",
                  backgroundColor: colors.icon + "10",
                },
              ]}
              placeholder="Confirm PIN"
              placeholderTextColor={colors.icon}
              value={confirmPinInput}
              onChangeText={setConfirmPinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.icon + "20" }]}
                onPress={() => setShowPinModal(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={confirmPinSetup}
              >
                <ThemedText style={{ color: "#fff" }}>Save</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        style={styles.flex}
      >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <SectionHeader title="Profile" />
        <View style={[styles.card, { backgroundColor: colors.icon + "10" }]}>
          <InlineEditRow
            label="Owner Name"
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Enter your name"
            colors={colors}
          />
          <InlineEditRow
            label="Marketplace Name"
            value={marketplaceName}
            onChangeText={setMarketplaceName}
            placeholder="Enter marketplace name"
            colors={colors}
          />
          <InlineEditRow
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            colors={colors}
            keyboardType="phone-pad"
          />
          <InlineEditRow
            label="Email"
            value={profileEmail}
            onChangeText={setProfileEmail}
            placeholder="Enter email"
            colors={colors}
            keyboardType="email-address"
          />
        </View>

        <SectionHeader title="Notification Settings" />
        <View style={[styles.card, { backgroundColor: colors.icon + "10" }]}>
          <SettingToggle
            label="Enable Telegram"
            description="Send automated due reminders via Telegram"
            value={settings.notifications.enableTelegram}
            onValueChange={(v) => updateNotifications({ enableTelegram: v })}
            colors={colors}
          />
          <InlineEditRow
            label="Bot Token"
            value={telegramBotToken}
            onChangeText={setTelegramBotToken}
            placeholder="e.g. 123456:ABC..."
            colors={colors}
          />
          <InlineEditRow
            label="Bot Username"
            value={telegramBotUsername}
            onChangeText={setTelegramBotUsername}
            placeholder="@MyRentalBot"
            colors={colors}
          />
          <SettingRow
            label="Test Telegram Bot"
            value="Verify Token"
            onPress={handleTestTelegramBot}
            colors={colors}
          />
          <SettingToggle
            label="Enable SMS"
            description="Receive notifications via SMS"
            value={settings.notifications.enableSMS}
            onValueChange={(v) => updateNotifications({ enableSMS: v })}
            colors={colors}
          />
          <SettingRow
            label="Reminder Time"
            value={settings.notifications.reminderTime}
            onPress={handleReminderTimePress}
            colors={colors}
          />
        </View>

        <SectionHeader title="Reminder Days" />
        <View style={[styles.card, { backgroundColor: colors.icon + "10" }]}>
          <SettingToggle
            label="7 Days Before"
            value={settings.notifications.reminderDays.sevenDaysBefore}
            onValueChange={(v) => updateNotificationDays({ sevenDaysBefore: v })}
            colors={colors}
          />
          <SettingToggle
            label="3 Days Before"
            value={settings.notifications.reminderDays.threeDaysBefore}
            onValueChange={(v) => updateNotificationDays({ threeDaysBefore: v })}
            colors={colors}
          />
          <SettingToggle
            label="1 Day Before"
            value={settings.notifications.reminderDays.oneDayBefore}
            onValueChange={(v) => updateNotificationDays({ oneDayBefore: v })}
            colors={colors}
          />
          <SettingToggle
            label="Due Date"
            value={settings.notifications.reminderDays.dueDate}
            onValueChange={(v) => updateNotificationDays({ dueDate: v })}
            colors={colors}
          />
          <SettingToggle
            label="Every Day After Due Date"
            description="Send daily reminders for overdue payments"
            value={settings.notifications.reminderDays.everyDayAfterDue}
            onValueChange={(v) => updateNotificationDays({ everyDayAfterDue: v })}
            colors={colors}
          />
        </View>

        <SectionHeader title="Security" />
        <View style={[styles.card, { backgroundColor: colors.icon + "10" }]}>
          <Pressable
            style={[styles.settingRow, { borderBottomColor: colors.icon + "20" }]}
            onPress={() => router.push("/change-password")}
          >
            <ThemedText style={styles.settingLabel}>Change Password</ThemedText>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </Pressable>

          <SettingToggle
            label="PIN Lock"
            description={settings.security.pinEnabled ? "PIN is set" : "Protect app with a PIN code"}
            value={settings.security.pinEnabled}
            onValueChange={settings.security.pinEnabled ? handleRemovePin : () => handlePinSetup()}
            colors={colors}
          />

          {hasBiometric && (
            <SettingToggle
              label="Fingerprint Login"
              description="Use fingerprint to unlock the app"
              value={settings.security.fingerprintEnabled}
              onValueChange={handleFingerprintToggle}
              colors={colors}
            />
          )}
        </View>

        <SectionHeader title="Appearance" />
        <View style={[styles.card, { backgroundColor: colors.icon + "10" }]}>
          <SettingToggle
            label="Dark Mode"
            description="Switch between light and dark theme"
            value={
              settings.appearance.darkMode === null
                ? colorScheme === "dark"
                : settings.appearance.darkMode
            }
            onValueChange={handleDarkModeToggle}
            colors={colors}
          />
          <SettingRow
            label="Language"
            value={settings.appearance.language}
            onPress={handleLanguageChange}
            colors={colors}
          />
        </View>

        <SectionHeader title="Backup" />
        <View style={[styles.card, { backgroundColor: colors.icon + "10" }]}>
          <SettingRow
            label="Cloud Backup"
            value="Export data"
            onPress={handleCloudBackup}
            colors={colors}
          />
          <SettingRow
            label="Restore Backup"
            value="Import data"
            onPress={handleRestoreBackup}
            colors={colors}
          />
        </View>

        <SectionHeader title="About" />
        <View style={[styles.card, { backgroundColor: colors.icon + "10" }]}>
          <SettingRow
            label="App Version"
            value="1.0.0"
            colors={colors}
          />
          <SettingRow
            label="Contact Developer"
            value="support@rentalapp.com"
            onPress={() => Alert.alert("Contact", "Email: support@rentalapp.com")}
            colors={colors}
          />
          <SettingRow
            label="Privacy Policy"
            onPress={() =>
              Alert.alert(
                "Privacy Policy",
                "RentalApp Mobile respects your privacy. All data is stored locally on your device and is never shared with third parties without your consent."
              )
            }
            colors={colors}
          />
        </View>

        <View style={styles.bottomSpacer} />
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
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    opacity: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 15,
    marginRight: 4,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    opacity: 0.4,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  editRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inlineInput: {
    flex: 1,
    marginLeft: 16,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    textAlign: "right",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  modalContent: {
    width: "85%",
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 8,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSpacer: {
    height: 20,
  },
});
