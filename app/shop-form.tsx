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
import { useShops } from "@/contexts/ShopContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ShopFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getShop, addShop, updateShop, deleteShop } = useShops();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const isEditing = !!id;
  const existing = id ? getShop(id) : undefined;

  const [shopNumber, setShopNumber] = useState("");
  const [shopName, setShopName] = useState("");
  const [floor, setFloor] = useState("");
  const [rentPrice, setRentPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [waterFee, setWaterFee] = useState("");
  const [electricityFee, setElectricityFee] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"occupied" | "vacant">("vacant");
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    if (existing) {
      setShopNumber(existing.shopNumber);
      setShopName(existing.shopName);
      setFloor(existing.floor);
      setRentPrice(existing.rentPrice.toString());
      setDeposit(existing.deposit.toString());
      setWaterFee(existing.waterFee.toString());
      setElectricityFee(existing.electricityFee.toString());
      setDescription(existing.description);
      setStatus(existing.status);
      setTenantName(existing.tenantName);
    }
  }, [existing]);

  async function handleSave() {
    if (!shopNumber.trim() || !shopName.trim()) {
      Alert.alert("Required", "Shop Number and Shop Name are required.");
      return;
    }
    const rent = Number(rentPrice) || 0;
    const dep = Number(deposit) || 0;
    const water = Number(waterFee) || 0;
    const elec = Number(electricityFee) || 0;

    if (isEditing && id) {
      await updateShop(id, {
        shopNumber: shopNumber.trim(),
        shopName: shopName.trim(),
        floor: floor.trim(),
        rentPrice: rent,
        deposit: dep,
        waterFee: water,
        electricityFee: elec,
        description: description.trim(),
        status,
        tenantName: tenantName.trim(),
      });
      router.back();
    } else {
      await addShop({
        shopNumber: shopNumber.trim(),
        shopName: shopName.trim(),
        floor: floor.trim(),
        rentPrice: rent,
        deposit: dep,
        waterFee: water,
        electricityFee: elec,
        description: description.trim(),
        status,
        tenantName: tenantName.trim(),
      });
      router.back();
    }
  }

  function toggleStatus() {
    setStatus((s) => (s === "occupied" ? "vacant" : "occupied"));
    if (status === "vacant") {
      setTenantName("");
    }
  }

  function handleDelete() {
    if (!id) return;
    Alert.alert(
      "Delete Shop",
      `Are you sure you want to delete shop ${shopNumber}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteShop(id);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{ title: isEditing ? "Edit Shop" : "Add Shop" }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.half}>
                <ThemedText style={styles.label}>Shop Number</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.icon,
                      backgroundColor:
                        colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                    },
                  ]}
                  placeholder="e.g. A101"
                  placeholderTextColor={colors.icon}
                  value={shopNumber}
                  onChangeText={setShopNumber}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.half}>
                <ThemedText style={styles.label}>Floor</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.icon,
                      backgroundColor:
                        colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                    },
                  ]}
                  placeholder="e.g. Ground, 1st"
                  placeholderTextColor={colors.icon}
                  value={floor}
                  onChangeText={setFloor}
                />
              </View>
            </View>

            <View>
              <ThemedText style={styles.label}>Shop Name</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.icon,
                    backgroundColor:
                      colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                  },
                ]}
                placeholder="e.g. Corner Store"
                placeholderTextColor={colors.icon}
                value={shopName}
                onChangeText={setShopName}
              />
            </View>

            <View>
              <ThemedText style={styles.label}>Monthly Rent (ETB)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.icon,
                    backgroundColor:
                      colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.icon}
                value={rentPrice}
                onChangeText={setRentPrice}
                keyboardType="numeric"
              />
            </View>

            <View>
              <ThemedText style={styles.label}>Deposit (ETB)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.icon,
                    backgroundColor:
                      colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.icon}
                value={deposit}
                onChangeText={setDeposit}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <ThemedText style={styles.label}>
                  Water Fee (ETB)
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.icon,
                      backgroundColor:
                        colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  value={waterFee}
                  onChangeText={setWaterFee}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.half}>
                <ThemedText style={styles.label}>
                  Electricity Fee (ETB)
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.icon,
                      backgroundColor:
                        colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  value={electricityFee}
                  onChangeText={setElectricityFee}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View>
              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: colors.text,
                    borderColor: colors.icon,
                    backgroundColor:
                      colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                  },
                ]}
                placeholder="Optional notes about this shop..."
                placeholderTextColor={colors.icon}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View>
              <ThemedText style={styles.label}>Status</ThemedText>
              <Pressable
                style={[
                  styles.statusToggle,
                  {
                    backgroundColor:
                      status === "occupied" ? "#4CAF50" : "#9E9E9E",
                  },
                ]}
                onPress={toggleStatus}
              >
                <ThemedText style={styles.statusToggleText}>
                  {status === "occupied" ? "Occupied" : "Vacant"}
                </ThemedText>
              </Pressable>
            </View>

            {status === "occupied" && (
              <View>
                <ThemedText style={styles.label}>Tenant Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.icon,
                      backgroundColor:
                        colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                    },
                  ]}
                  placeholder="Tenant name"
                  placeholderTextColor={colors.icon}
                  value={tenantName}
                  onChangeText={setTenantName}
                />
              </View>
            )}

            <Pressable
              style={[styles.saveButton, { backgroundColor: colors.tint }]}
              onPress={handleSave}
            >
              <ThemedText style={styles.saveButtonText}>
                {isEditing ? "Update Shop" : "Add Shop"}
              </ThemedText>
            </Pressable>

            {isEditing && (
              <Pressable
                style={[styles.deleteButton]}
                onPress={handleDelete}
              >
                <ThemedText style={styles.deleteButtonText}>
                  Delete Shop
                </ThemedText>
              </Pressable>
            )}
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
    padding: 20,
    paddingBottom: 40,
  },
  form: {
    gap: 18,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
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
  statusToggle: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusToggleText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
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
  deleteButton: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E53935",
  },
  deleteButtonText: {
    color: "#E53935",
    fontSize: 17,
    fontWeight: "600",
  },
});
