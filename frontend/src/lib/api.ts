export const apiFetch = async (url: string, init?: RequestInit) => {
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
};
