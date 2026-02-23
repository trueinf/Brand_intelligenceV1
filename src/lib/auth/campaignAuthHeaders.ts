/**
 * Client-side: returns headers to send with campaign API requests.
 * Replace with your auth provider (session, JWT). For dev, uses localStorage or default.
 */

const USER_ID_STORAGE_KEY = "userId";

export function getUserId(): string {
  if (typeof window === "undefined") return "dev-user";
  return localStorage.getItem(USER_ID_STORAGE_KEY)?.trim() || "dev-user";
}

export function getCampaignAuthHeaders(): Record<string, string> {
  return { "x-user-id": getUserId() };
}
