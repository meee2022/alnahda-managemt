// هوية المنصة — عنابي + ذهبي + خلفية كريمي دافئة، بروح رسمية ناعمة وفاخرة
// (مواءمة مع هوية نظام التوجيه التربوي: عنابي #5C1523 + ذهبي #C9A96E + كريمي #FCF9F2)
export const colors = {
  // الأساسي: العنابي
  primary: "#5C1523",
  primaryDark: "#4A0F1B",
  primaryDeep: "#3B0A14",
  primaryLight: "#7A1E30",
  primarySoft: "#F2E7EA",
  primaryTint: "#FAF4F6",
  // الثانوي: عنابي أفتح للهايلايت
  accent: "#7A1E30",
  accentDark: "#5C1523",
  accentSoft: "#F6E9ED",
  // ذهبي دافئ (لمسة فخامة)
  gold: "#C9A96E",
  goldDark: "#A8853A",
  goldSoft: "#FBF6EC",
  // المحايد — خلفية كريمي/بيج دافئة
  bg: "#FCF9F2",
  card: "#FFFFFF",
  border: "#E8E1D2",
  borderStrong: "#D8CFC0",
  text: "#2A1418",
  textSecondary: "#6B5A52",
  textMuted: "#9C8E86",
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
    boxShadow: "0 1px 2px rgba(42, 20, 24, 0.04), 0 4px 12px rgba(92, 21, 35, 0.04)",
    elevation: 1,
  } as any,
  card: {
    boxShadow: "0 1px 2px rgba(42, 20, 24, 0.05), 0 10px 28px rgba(92, 21, 35, 0.06)",
    elevation: 2,
  } as any,
  raised: {
    boxShadow: "0 2px 8px rgba(92, 21, 35, 0.10), 0 22px 48px rgba(92, 21, 35, 0.13)",
    elevation: 6,
  } as any,
};

// تدرجات الهيرو الموحّدة (عنابي غامق ← عنابي)
export const gradients = {
  hero: ["#4A0F1B", "#5C1523"] as [string, string],
  heroDeep: ["#3B0A14", "#5C1523"] as [string, string],
  gold: ["#A8853A", "#DFC48E"] as [string, string],
};

export const fonts = {
  regular: "Cairo_400Regular",
  medium: "Cairo_500Medium",
  semibold: "Cairo_600SemiBold",
  bold: "Cairo_700Bold",
};
