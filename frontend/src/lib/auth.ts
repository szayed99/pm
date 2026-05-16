import { apiFetch } from "@/lib/api";

export type AuthUser = {
  username: string;
};

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const response = await apiFetch("/api/auth/me");
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to check session");
  }
  return response.json() as Promise<AuthUser>;
};

export const login = async (
  username: string,
  password: string
): Promise<AuthUser> => {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (response.status === 401) {
    throw new Error("Invalid credentials");
  }
  if (!response.ok) {
    throw new Error("Login failed");
  }
  return response.json() as Promise<AuthUser>;
};

export const logout = async (): Promise<void> => {
  const response = await apiFetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    throw new Error("Logout failed");
  }
};
