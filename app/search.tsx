import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, P, Input, Loading, Row, PageHero } from "../lib/ui";
import { colors, fonts, radius } from "../lib/theme";

// أقسام التطبيق للبحث السريع
const SECTIONS: { label: string; icon: keyof typeof Ionicons.glyphMap; href: string }[] = [
  { label: "الاجتماعات", icon: "chatbubbles", href: "/meetings" },
  { label: "جدول الزيارات الشهري", icon: "footsteps", href: "/visits" },
  { label: "استمارة تقييم الزيارة", icon: "eye", href: "/evaluations/class-visit" },
  { label: "متابعة الأداء", icon: "document-attach", href: "/evaluations/performance" },
  { label: "التقرير الدوري", icon: "clipboard", href: "/evaluations/periodic" },
  { label: "التقييم السنوي", icon: "ribbon", href: "/evaluations/annual" },
  { label: "تصنيف الأداء", icon: "git-branch", href: "/evaluations/classification" },
  { label: "المعلمات", icon: "people", href: "/teachers" },
  { label: "الطالبات", icon: "school", href: "/students" },
  { label: "سجل الاستئذان", icon: "exit", href: "/registers/leave" },
  { label: "سجل الاحتياط", icon: "swap-horizontal", href: "/registers/cover" },
  { label: "الإحصائيات والتقارير", icon: "stats-chart", href: "/reports/stats" },
  { label: "المساعد الذكي (محادثة)", icon: "chatbubbles", href: "/chat" },
  { label: "رفع وتحليل استمارة", icon: "cloud-upload", href: "/import" },
  { label: "التقرير الشهري", icon: "document-text", href: "/reports/monthly" },
  { label: "الخطة السنوية", icon: "map", href: "/plans/annual" },
  { label: "متابعة التوصيات", icon: "checkmark-done", href: "/recommendations" },
  { label: "لوحة التحكم", icon: "options", href: "/admin" },
];

const norm = (s: string) => (s ?? "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").toLowerCase();

export default function SearchScreen() {
  const teachers = useQuery(api.teachers.list, {});
  const [q, setQ] = useState("");
  const nq = norm(q.trim());

  const matchedTeachers = nq.length >= 1 ? (teachers ?? []).filter((t) => norm(t.name).includes(nq) || norm(t.employeeNumber ?? "").includes(nq)) : [];
  const matchedSections = nq.length >= 1 ? SECTIONS.filter((s) => norm(s.label).includes(nq)) : SECTIONS;

  const Item = ({ icon, title, sub, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub?: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={({ hovered }: any) => [
      { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.md },
      hovered && { backgroundColor: colors.bg },
    ]}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text, textAlign: "right" }}>{title}</Text>
        {sub ? <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, textAlign: "right" }}>{sub}</Text> : null}
      </View>
      <Ionicons name="arrow-back" size={14} color={colors.textMuted} />
    </Pressable>
  );

  if (teachers === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero title="بحث سريع" desc="ابحثي عن معلمة أو قسم وانتقلي إليه بضغطة" icon="search" gradient={["#5E0E24", "#9A1B3C"]} />
      <Card>
        <Input placeholder="اكتبي اسم معلمة أو قسم…" value={q} onChangeText={setQ} autoFocus />
      </Card>

      {matchedTeachers.length > 0 && (
        <Card>
          <P muted style={{ fontSize: 12, marginBottom: 4 }}>المعلمات ({matchedTeachers.length})</P>
          {matchedTeachers.map((t) => (
            <Item key={t._id} icon="person" title={t.name}
              sub={[t.grade && `${t.grade}${t.section ? " " + t.section : ""}`, t.employeeNumber && `#${t.employeeNumber}`].filter(Boolean).join(" · ")}
              onPress={() => router.push({ pathname: "/reports/teacher", params: { id: t._id } })} />
          ))}
        </Card>
      )}

      <Card>
        <P muted style={{ fontSize: 12, marginBottom: 4 }}>الأقسام</P>
        {matchedSections.length === 0 ? <P muted style={{ fontSize: 12.5 }}>لا نتائج.</P> :
          matchedSections.map((s) => <Item key={s.href} icon={s.icon} title={s.label} onPress={() => router.push(s.href as any)} />)}
      </Card>
    </Screen>
  );
}
