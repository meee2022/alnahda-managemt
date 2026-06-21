// هوية المنصة — عنابي قطري (Maroon) + ذهبي + خلفية كريمي دافئة، بروح رسمية ناعمة وفاخرة
export const colors = {
  // الأساسي: العنابي القطري
  primary: "#8A1538",
  primaryDark: "#6E1029",
  primaryDeep: "#5A0C22",
  primaryLight: "#A8324F",
  primarySoft: "#F6E7EC",
  primaryTint: "#FBF1F4",
  // الثانوي: عنابي أفتح للهايلايت
  accent: "#A11D3A",
  accentDark: "#7C1230",
  accentSoft: "#F8E9ED",
  // ذهبي دافئ (لمسة فخامة)
  gold: "#C9A24B",
  goldDark: "#B0883A",
  goldSoft: "#FBF4E4",
  // المحايد — خلفية كريمي/بيج دافئة
  bg: "#F7F2E9",
  card: "#FFFFFF",
  border: "#E8DFD0",
  borderStrong: "#D8CDB8",
  text: "#2A1A1F",
  textSecondary: "#6B5A5E",
  textMuted: "#9C8E90",
  white: "#FFFFFF",
  success: "#1E9E6A",
  successSoft: "#E7F6EF",
  warning: "#C0871A",
  warningSoft: "#FBF1DF",
  danger: "#C0392B",
  dangerSoft: "#FBEAE7",
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28 };

// ظلال ناعمة دافئة متعددة الطبقات (ظل تلامس دقيق + ظل محيط ناعم) — إحساس فاخر
export const shadow = {
  soft: {
    boxShadow: "0 1px 2px rgba(42, 26, 31, 0.04), 0 4px 12px rgba(90, 12, 34, 0.04)",
    elevation: 1,
  } as any,
  card: {
    boxShadow: "0 1px 2px rgba(42, 26, 31, 0.05), 0 10px 28px rgba(90, 12, 34, 0.06)",
    elevation: 2,
  } as any,
  raised: {
    boxShadow: "0 2px 8px rgba(90, 12, 34, 0.10), 0 22px 48px rgba(90, 12, 34, 0.13)",
    elevation: 6,
  } as any,
};

// تدرجات الهيرو الموحّدة (عنابي غامق ← عنابي نبيذي)
export const gradients = {
  hero: ["#5E0E24", "#9A1B3C"] as [string, string],
  heroDeep: ["#5A0C22", "#8A1538"] as [string, string],
  gold: ["#B0883A", "#D4B05C"] as [string, string],
};

export const fonts = {
  regular: "Cairo_400Regular",
  medium: "Cairo_500Medium",
  semibold: "Cairo_600SemiBold",
  bold: "Cairo_700Bold",
};
