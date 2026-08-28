import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

type AuthCtx = {
  loggedIn: boolean;
  ready: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({ loggedIn: false, ready: false, login: () => false, logout: () => {} });

const KEY = "lt-platform-auth";

type StoredSession = { authenticated: true; savedAt: string };

function readStored(): boolean {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      const value = localStorage.getItem(KEY);
      if (value === "1") return true; // ترحيل الجلسات القديمة دون إخراج المستخدم
      if (!value) return false;
      return (JSON.parse(value) as StoredSession).authenticated === true;
    } catch {
      return false;
    }
  }
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLoggedIn(readStored());
    setReady(true);
  }, []);

  const login = (user: string, pass: string) => {
    const ok = user.trim() === "admin" && pass === "admin123";
    if (ok) {
      setLoggedIn(true);
      if (Platform.OS === "web" && typeof localStorage !== "undefined") {
        try {
          const session: StoredSession = { authenticated: true, savedAt: new Date().toISOString() };
          localStorage.setItem(KEY, JSON.stringify(session));
        } catch {}
      }
    }
    return ok;
  };

  const logout = () => {
    setLoggedIn(false);
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      try { localStorage.removeItem(KEY); } catch {}
    }
  };

  return <Ctx.Provider value={{ loggedIn, ready, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
