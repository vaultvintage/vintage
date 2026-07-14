"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, tokenStore, SESSION_EXPIRED_EVENT } from "./api";
import { useToast } from "@/components/Toast";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const stored = tokenStore.getUser<User>();
    if (stored && tokenStore.access) setUserState(stored);
    setLoading(false);
  }, []);

  // React to the API client signalling an unrecoverable 401.
  useEffect(() => {
    function onExpired() {
      setUserState((current) => {
        if (current) {
          toast.error("Session expired", "Please sign in again to continue.");
          router.replace("/login?expired=1");
        }
        return null;
      });
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [router, toast]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    tokenStore.set(res.access, res.refresh);
    tokenStore.saveUser(res.user);
    setUserState(res.user as User);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUserState(null);
    router.push("/login");
  }, [router]);

  const setUser = useCallback((u: User) => {
    tokenStore.saveUser(u);
    setUserState(u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
