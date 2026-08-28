import React from "react";
import { Platform } from "react-native";
import { notify } from "./ui";

type BuildMeta = { version?: string };

const CHECK_EVERY_MS = 5 * 60 * 1000;
const RELOAD_GUARD_KEY = "lt-platform-last-reload";

function currentVersion() {
  if (typeof document === "undefined") return "";
  return document.querySelector<HTMLMetaElement>('meta[name="app-build"]')?.content ?? "";
}

async function fetchLatestVersion() {
  const response = await fetch(`/build-meta.json?t=${Date.now()}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
  });
  if (!response.ok) return "";
  return ((await response.json()) as BuildMeta).version ?? "";
}

// حارس ضد تكرار إعادة التحميل. sessionStorage قد يرمي استثناءً (تصفح خاص/حظر التخزين)،
// وفي تلك الحالة نُعيد التحميل مرة واحدة بلا حارس بدل تعطيل التحديث كلياً.
function reloadOnce(version: string) {
  try {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY) === version) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, version);
  } catch {}
  window.location.reload();
}

export function UpdateManager() {
  React.useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    let stopped = false;
    const check = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const latest = await fetchLatestVersion();
        const loaded = currentVersion();
        if (!stopped && latest && loaded && latest !== loaded) {
          notify("تم نشر تحديث جديد، جارٍ تحميله مع الاحتفاظ بجلستك ومسوداتك.", "success");
          window.setTimeout(() => reloadOnce(latest), 700);
        }
      } catch {
        // انقطاع الشبكة لا يوقف النسخة المفتوحة. ستُعاد المحاولة عند عودة التبويب.
      }
    };

    const onVisible = () => { if (document.visibilityState === "visible") void check(); };
    const onError = (event: PromiseRejectionEvent | ErrorEvent) => {
      const message = "reason" in event ? String(event.reason) : event.message;
      if (/ChunkLoadError|Loading chunk|dynamically imported module/i.test(message)) {
        void fetchLatestVersion().then((version) => version && reloadOnce(version));
      }
    };

    const timer = window.setInterval(check, CHECK_EVERY_MS);
    const initialCheck = window.setTimeout(check, 1000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.clearTimeout(initialCheck);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, []);

  return null;
}
