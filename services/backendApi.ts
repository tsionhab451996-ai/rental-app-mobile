/**
 * API client for connecting the React Native app to the Telegram bot backend.
 *
 * Usage:
 *   import { syncShop } from "@/services/backendApi";
 *
 *   await syncShop({
 *     shopNumber: "A101",
 *     rentAmount: 3500,
 *     dueDate: "2026-07-10",
 *     shopName: "Corner Store",
 *     floor: "Ground",
 *   });
 */

const API_BASE = "http://localhost:3000/api";

export type BackendShop = {
  shopNumber: string;
  rentAmount: number;
  dueDate: string;
  shopName?: string;
  floor?: string;
};

export async function syncShop(shop: BackendShop): Promise<any> {
  const response = await fetch(`${API_BASE}/shops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(shop),
  });
  if (!response.ok) {
    throw new Error(`Failed to sync shop: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAllShops(): Promise<any> {
  const response = await fetch(`${API_BASE}/shops`);
  if (!response.ok) {
    throw new Error(`Failed to fetch shops: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchShopByNumber(
  shopNumber: string,
): Promise<any> {
  const response = await fetch(`${API_BASE}/shops/${encodeURIComponent(shopNumber)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch shop: ${response.statusText}`);
  }
  return response.json();
}

export function setApiBaseUrl(url: string) {
  (module as any).API_BASE = url;
}
