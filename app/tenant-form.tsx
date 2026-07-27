import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useTenants } from "@/contexts/TenantContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TenantFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getTenant, addTenant, updateTenant } = useTenants();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const isEditing = !!id;
  const existing = id ? getTenant(id) : undefined;

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [email, setEmail] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [shopNumber, setShopNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [depositPaid, setDepositPaid] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (existing) {
      setFullName(existing.fullName);
      setPhoneNumber(existing.phoneNumber);
      setTelegramUsername(existing.telegramUsername);
      setEmail(existing.email);
      setNationalId(existing.nationalId);
      setBusinessType(existing.businessType);
      setShopNumber(existing.shopNumber);
      setStartDate(existing.startDate);
      setEndDate(existing.endDate);
      setDepositPaid(existing.depositPaid.toString());
      setEmergencyContact(existing.emergencyContact);
      setAddress(existing.address);
      setNotes(existing.notes);
      setRentAmount(existing.rentAmount.toString());
      setDueDate(existing.dueDate);
    }
  }, [existing]);

  async function handleSave() {
    if (!fullName.trim() || !shopNumber.trim()) {
      Alert.alert("Required", "Full Name and Shop Number are required.");
      return;
    }

    const base = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      telegramUsername: telegramUsername.trim(),
      email: email.trim(),
      nationalId: nationalId.trim(),
      businessType: businessType.trim(),
      shopNumber: shopNumber.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      depositPaid: Number(depositPaid) || 0,
      emergencyContact: emergencyContact.trim(),
      address: address.trim(),
      notes: notes.trim(),
      rentAmount: Number(rentAmount) || 0,
      dueDate: dueDate.trim(),
      paid: existing?.paid ?? false,
      lastPaymentDate: existing?.lastPaymentDate ?? null,
      notificationId: existing?.notificationId ?? null,
      history: existing?.history ?? [],
    };

    if (isEditing && id) {
      await updateTenant(id, base);
    } else {
      await addTenant(base);
    }
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{ title: isEditing ? "Edit Tenant" : "Add Tenant" }}
      />
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
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Personal Information
            </ThemedText>
            <InputField
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Tenant full name"
              colors={colors}
              colorScheme={colorScheme}
            />
            <InputField
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+251 9X XXX XXXX"
              colors={colors}
              colorScheme={colorScheme}
              keyboardType="phone-pad"
            />
            <InputField
              label="Telegram Username (optional)"
              value={telegramUsername}
              onChangeText={setTelegramUsername}
              placeholder="@username"
              colors={colors}
              colorScheme={colorScheme}
              autoCapitalize="none"
            />
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              colors={colors}
              colorScheme={colorScheme}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              label="National ID"
              value={nationalId}
              onChangeText={setNationalId}
              placeholder="ID number"
              colors={colors}
              colorScheme={colorScheme}
            />
            <InputField
              label="Business Type"
              value={businessType}
              onChangeText={setBusinessType}
              placeholder="e.g. Retail, Café, Salon"
              colors={colors}
              colorScheme={colorScheme}
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Shop & Rent</ThemedText>
            <InputField
              label="Shop Number"
              value={shopNumber}
              onChangeText={setShopNumber}
              placeholder="e.g. A101"
              colors={colors}
              colorScheme={colorScheme}
            />
            <InputField
              label="Monthly Rent (ETB)"
              value={rentAmount}
              onChangeText={setRentAmount}
              placeholder="0.00"
              colors={colors}
              colorScheme={colorScheme}
              keyboardType="numeric"
            />
            <InputField
              label="Due Date (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="e.g. 2026-07-10"
              colors={colors}
              colorScheme={colorScheme}
              autoCapitalize="none"
            />
            <InputField
              label="Deposit Paid (ETB)"
              value={depositPaid}
              onChangeText={setDepositPaid}
              placeholder="0.00"
              colors={colors}
              colorScheme={colorScheme}
              keyboardType="numeric"
            />
            <InputField
              label="Start Date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="e.g. 2026-01-01"
              colors={colors}
              colorScheme={colorScheme}
              autoCapitalize="none"
            />
            <InputField
              label="End Date (YYYY-MM-DD)"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="e.g. 2027-01-01"
              colors={colors}
              colorScheme={colorScheme}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Additional Information
            </ThemedText>
            <InputField
              label="Emergency Contact"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="Name and phone"
              colors={colors}
              colorScheme={colorScheme}
            />
            <InputField
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Physical address"
              colors={colors}
              colorScheme={colorScheme}
            />
            <InputField
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              colors={colors}
              colorScheme={colorScheme}
              multiline
            />
          </View>

          <Pressable
            style={[styles.saveButton, { backgroundColor: colors.tint }]}
            onPress={handleSave}
          >
            <ThemedText style={styles.saveButtonText}>
              {isEditing ? "Update Tenant" : "Add Tenant"}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  colorScheme,
  keyboardType,
  autoCapitalize,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  colors: any;
  colorScheme: string | null | undefined;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
}) {
  return (
    <View style={fieldStyles.group}>
      <ThemedText style={fieldStyles.label}>{label}</ThemedText>
      <TextInput
        style={[
          fieldStyles.input,
          multiline && fieldStyles.textArea,
          {
            color: colors.text,
            borderColor: colors.icon,
            backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
