export type AuthUser = {
  username: string;
};

const jsonFetch = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return response;
};

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const response = await jsonFetch("/api/auth/me");
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
  const response = await jsonFetch("/api/auth/login", {
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
  const response = await jsonFetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    throw new Error("Logout failed");
  }
};
