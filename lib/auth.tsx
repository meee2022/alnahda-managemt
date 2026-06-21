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

function readStored(): boolean {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    return localStorage.getItem(KEY) === "1";
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
      if (Platform.OS === "web" && typeof localStorage !== "undefined") localStorage.setItem(KEY, "1");
    }
    return ok;
  };

  const logout = () => {
    setLoggedIn(false);
    if (Platform.OS === "web" && typeof localStorage !== "undefined") localStorage.removeItem(KEY);
  };

  return <Ctx.Provider value={{ loggedIn, ready, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
