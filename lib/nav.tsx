import React, { createContext, useContext, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, useWindowDimensions } from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { SlideInRight, SlideOutRight, FadeIn, FadeOut } from "react-native-reanimated";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "./auth";
import { colors, fonts, radius, shadow } from "./theme";

// ===== حالة الدرج الجانبي (متاحة من أي شاشة) =====
const DrawerCtx = createContext<{ open: () => void; close: () => void; isOpen: boolean }>({
  open: () => {}, close: () => {}, isOpen: false,
});
export const useDrawer = () => useContext(DrawerCtx);

type Item = { label: string; icon: keyof typeof Ionicons.glyphMap; href: string };
type Group = { label?: string; items: Item[] };

export const NAV: Group[] = [
  { items: [{ label: "الرئيسية", icon: "home", href: "/" }, { label: "بحث سريع", icon: "search", href: "/search" }] },
  {
    label: "الإدارة اليومية",
    items: [
      { label: "الاجتماعات", icon: "chatbubbles", href: "/meetings" },
      { label: "جدول الزيارات الشهري", icon: "footsteps", href: "/visits" },
      { label: "متابعة التوصيات", icon: "checkmark-done", href: "/recommendations" },
      { label: "خطة متابعة الموجه", icon: "git-network", href: "/registers/guide-plan" },
    ],
  },
  {
    label: "المعلمات والطالبات",
    items: [
      { label: "المعلمات", icon: "people", href: "/teachers" },
      { label: "الطالبات", icon: "school", href: "/students" },
      { label: "التقرير الدوري", icon: "clipboard", href: "/evaluations/periodic" },
      { label: "التقييم السنوي", icon: "ribbon", href: "/evaluations/annual" },
      { label: "استمارة تقييم الزيارة", icon: "eye", href: "/evaluations/class-visit" },
      { label: "متابعة الأداء", icon: "document-attach", href: "/evaluations/performance" },
      { label: "تصنيف الأداء", icon: "git-branch", href: "/evaluations/classification" },
    ],
  },
  {
    label: "الأكاديمي",
    items: [
      { label: "التحصيل الأكاديمي", icon: "trending-up", href: "/academics/exams" },
      { label: "الخطة الفصلية", icon: "calendar", href: "/academics/curriculum" },
      { label: "الأعمال الكتابية", icon: "create", href: "/academics/written-work" },
    ],
  },
  {
    label: "الخطط والتنظيم",
    items: [
      { label: "الخطة السنوية", icon: "map", href: "/plans/annual" },
      { label: "خطة التحصيل", icon: "rocket", href: "/plans/achievement" },
      { label: "جدول أعمال المنسقة", icon: "briefcase", href: "/plans/agenda" },
    ],
  },
  {
    label: "التطوير والتقارير",
    items: [
      { label: "الإحصائيات والتقارير", icon: "stats-chart", href: "/reports/stats" },
      { label: "المساعد الذكي (محادثة)", icon: "chatbubbles", href: "/chat" },
      { label: "مساعد التوصيات", icon: "sparkles", href: "/assistant" },
      { label: "رفع وتحليل استمارة", icon: "cloud-upload", href: "/import" },
      { label: "التطوير المهني", icon: "library", href: "/development" },
      { label: "خطة تطوير المعلمة", icon: "trail-sign", href: "/development-plan" },
      { label: "التقرير الشهري", icon: "document-text", href: "/reports/monthly" },
      { label: "الإنجازات", icon: "trophy", href: "/reports/achievements" },
      { label: "لوحة التحكم", icon: "options", href: "/admin" },
    ],
  },
];

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <DrawerCtx.Provider value={{ open: () => setOpen(true), close: () => setOpen(false), isOpen }}>
      {children}
      {isOpen ? <DrawerOverlay onClose={() => setOpen(false)} /> : null}
    </DrawerCtx.Provider>
  );
}

function DrawerOverlay({ onClose }: { onClose: () => void }) {
  const { loggedIn, logout } = useAuth();
  const settings = useQuery(api.admin.getSettings, loggedIn ? {} : "skip");
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  const panelWidth = Math.min(300, Math.max(248, width * 0.72));

  const coordinator = settings?.coordinator ?? "المنسقة";
  const initial = coordinator.trim().charAt(0) || "م";

  const go = (href: string) => {
    onClose();
    if (pathname !== href) router.replace(href as any);
  };

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <View style={StyleSheet.absoluteFill as any}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.backdropWrap}>
        <Pressable style={StyleSheet.absoluteFill as any} onPress={onClose} />
      </Animated.View>

      <Animated.View
        entering={SlideInRight.duration(240)}
        exiting={SlideOutRight.duration(200)}
        style={[styles.panel, { width: panelWidth, height }]}
      >
        {/* رأس البروفايل */}
        <LinearGradient colors={[colors.primaryDeep, colors.primary]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.profile}>
          <View style={[styles.profilePattern, { pointerEvents: "none" }]}>
            {[0, 1].map((i) => <View key={i} style={[styles.ring, { width: 150 + i * 90, height: 150 + i * 90 }]} />)}
          </View>
          <View style={styles.avatarLg}><Text style={styles.avatarLgText}>{initial}</Text></View>
          <Text style={styles.profileName}>أ. {coordinator}</Text>
          <Text style={styles.profileRole}>رئيسة قسم المسار الأدبي</Text>
          <View style={styles.yearPill}>
            <Text style={styles.yearText}>{settings?.academicYear ?? "2025-2026"}</Text>
          </View>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }}>
          {NAV.map((g, gi) => (
            <View key={gi} style={{ marginBottom: 4 }}>
              {g.label ? <Text style={styles.groupLabel}>{g.label}</Text> : null}
              {g.items.map((it) => {
                const on = active(it.href);
                return (
                  <Pressable
                    key={it.href}
                    onPress={() => go(it.href)}
                    style={({ hovered }: any) => [
                      styles.item,
                      on && styles.itemActive,
                      hovered && !on && { backgroundColor: colors.bg },
                    ]}
                  >
                    {on ? <View style={styles.activeBar} /> : null}
                    <Ionicons name={it.icon} size={19} color={on ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.itemText, on && { color: colors.primary, fontFamily: fonts.semibold }]}>{it.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Pressable
            onPress={() => { onClose(); logout(); router.replace("/login"); }}
            style={({ hovered }: any) => [styles.item, { marginTop: 6 }, hovered && { backgroundColor: colors.dangerSoft }]}
          >
            <Ionicons name="log-out-outline" size={19} color={colors.danger} />
            <Text style={[styles.itemText, { color: colors.danger }]}>تسجيل الخروج</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// زر القائمة (هامبرغر) للشريط العلوي
export function MenuButton() {
  const { open } = useDrawer();
  return (
    <Pressable
      onPress={open}
      hitSlop={10}
      style={({ hovered, pressed }: any) => [styles.menuBtn, hovered && { backgroundColor: colors.primarySoft }, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name="menu" size={22} color={colors.primary} />
    </Pressable>
  );
}

// أفاتار الشريط العلوي — يفتح الدرج أيضاً
export function HeaderAvatar() {
  const { open } = useDrawer();
  const { loggedIn } = useAuth();
  const settings = useQuery(api.admin.getSettings, loggedIn ? {} : "skip");
  const initial = (settings?.coordinator ?? "م").trim().charAt(0) || "م";
  return (
    <Pressable onPress={open} hitSlop={8} style={({ pressed }: any) => [{ marginHorizontal: 10, opacity: pressed ? 0.7 : 1 }]}>
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.avatarSm}>
        <Text style={styles.avatarSmText}>{initial}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdropWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(7,32,31,0.45)" },
  panel: {
    position: "absolute", top: 0, right: 0, backgroundColor: colors.card,
    borderTopLeftRadius: 22, borderBottomLeftRadius: 22, overflow: "hidden", ...shadow.raised,
  },
  profile: { paddingTop: 18, paddingBottom: 15, paddingHorizontal: 18, overflow: "hidden" },
  profilePattern: { position: "absolute", right: -50, top: -40, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  avatarLg: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 9,
  },
  avatarLgText: { fontFamily: fonts.bold, fontSize: 22, color: "#fff" },
  profileName: { fontFamily: fonts.bold, fontSize: 16, color: "#fff", textAlign: "right" },
  profileRole: { fontFamily: fonts.regular, fontSize: 12.5, color: "rgba(255,255,255,0.78)", textAlign: "right", marginTop: 2 },
  yearPill: { alignSelf: "flex-end", marginTop: 10, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 3 },
  yearText: { fontFamily: fonts.medium, fontSize: 11.5, color: "#fff" },
  groupLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted, textAlign: "right", paddingHorizontal: 18, marginTop: 12, marginBottom: 4 },
  item: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 12,
    paddingVertical: 11, paddingHorizontal: 18,
    ...(Platform.OS === "web" ? { transitionDuration: "120ms" as any, cursor: "pointer" as any } : {}),
  },
  itemActive: { backgroundColor: colors.primarySoft },
  activeBar: { position: "absolute", right: 0, top: 8, bottom: 8, width: 3.5, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, backgroundColor: colors.primary },
  itemText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, textAlign: "right" },
  menuBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginHorizontal: 10 },
  avatarSm: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  avatarSmText: { fontFamily: fonts.bold, fontSize: 15, color: "#fff" },
});
