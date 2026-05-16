"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

type AuthGateProps = {
  children: (props: { onLogout: () => Promise<void> }) => ReactNode;
};

export const AuthGate = ({ children }: AuthGateProps) => {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    "loading"
  );

  const checkSession = useCallback(async () => {
    const user = await fetchCurrentUser();
    setStatus(user ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLogin = async (username: string, password: string) => {
    await apiLogin(username, password);
    setStatus("authenticated");
  };

  const handleLogout = async () => {
    await apiLogout();
    setStatus("unauthenticated");
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--gray-text)]">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <LoginForm onLogin={handleLogin} onSuccess={() => setStatus("authenticated")} />;
  }

  return <>{children({ onLogout: handleLogout })}</>;
};
