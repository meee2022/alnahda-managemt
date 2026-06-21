import { useState } from "react";
import { Platform } from "react-native";

// حفظ مسودة الاستمارة تلقائياً في متصفح المنسقة (آمن: استعادة اختيارية، تُمسح بعد الحفظ)
const ok = () => Platform.OS === "web" && typeof localStorage !== "undefined";

export function useDraft<T>(key: string) {
  const [saved, setSaved] = useState<T | null>(() => {
    if (!ok()) return null;
    try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T) : null; } catch { return null; }
  });
  const save = (v: T) => { if (ok()) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} } };
  const clear = () => { if (ok()) { try { localStorage.removeItem(key); } catch {} } setSaved(null); };
  return { saved, save, clear };
}
