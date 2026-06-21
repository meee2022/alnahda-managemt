import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem } from "../../lib/ui";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../../lib/theme";
import { DateField, TimeField, weekdayOf, prevWeekSameDay, prevDay, monthKeyOf, minutesBetween } from "../../lib/pickers";
import { printLeaveRegister, printLeavePolicy } from "../../lib/printTemplates";

type Entry = { teacherName: string; reason: string; fromTime: string; toTime: string; deputyOpinion: string };

export default function LeaveRegister() {
  const list = useQuery(api.registers.listLeave, {});
  const covers = useQuery(api.registers.listCover, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.registers.createLeave);
  const remove = useMutation(api.registers.removeLeave);

  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState("");
  const [day, setDay] = useState("");
  const [entries, setEntries] = useState<Entry[]>([{ teacherName: "", reason: "", fromTime: "", toTime: "", deputyOpinion: "" }]);

  const teacherNames = (teachers ?? []).map((t) => t.name);
  const setEntry = (i: number, patch: Partial<Entry>) => setEntries((p) => p.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  const nameMatch = (a: string, b: string) => !!a && !!b && (a === b || a.includes(b) || b.includes(a));

  // فحص سياسة الاستئذان: تنبيه إذا استأذنت المعلمة نفس اليوم من الأسبوع الماضي
  const policyWarning = (teacherName: string): string | null => {
    if (!teacherName || !date) return null;
    const prev = prevWeekSameDay(date);
    const wd = weekdayOf(date);
    if (!prev) return null;
    const had = (list ?? []).some((r) => r.date === prev && (r.entries ?? []).some((e: any) => nameMatch(e.teacherName, teacherName)));
    if (had) return `استأذنت يوم ${wd} من الأسبوع الماضي (${prev}). سياسة القسم تمنع تكرار الاستئذان في نفس اليوم أسبوعين متتاليين — راجعي قبل الموافقة.`;
    return null;
  };

  // عدد استئذانات المعلمة هذا الشهر (معلومة مساعِدة)
  const monthCount = (teacherName: string): number => {
    if (!teacherName || !date) return 0;
    const mk = monthKeyOf(date);
    let c = 0;
    for (const r of list ?? []) if (monthKeyOf(r.date) === mk) for (const e of r.entries ?? []) if (nameMatch(e.teacherName, teacherName)) c++;
    return c;
  };

  // فحص «غياب أمس»: هل كانت المعلمة غائبة في اليوم السابق (من سجل الاحتياط)؟
  const absentYesterday = (teacherName: string): string | null => {
    if (!teacherName || !date) return null;
    const prev = prevDay(date);
    if (!prev) return null;
    const was = (covers ?? []).some((r: any) => r.date === prev && (r.entries ?? []).some((e: any) => nameMatch(e.teacherName, teacherName)));
    if (was) return `كانت غائبة أمس (${prev}). السياسة تمنع الاستئذان في اليوم التالي للغياب إلا للضرورة وبموافقة الإدارة.`;
    return null;
  };

  // مجموع دقائق استئذان المعلمة في هذا اليوم (من بنود النموذج الحالي)
  const dayMinutes = (teacherName: string): number =>
    entries.filter((e) => nameMatch(e.teacherName, teacherName)).reduce((s, e) => s + minutesBetween(e.fromTime, e.toTime), 0);
  const fmtDur = (min: number) => {
    const h = Math.floor(min / 60), m = min % 60;
    return `${h ? `${h} ساعة` : ""}${h && m ? " و" : ""}${m ? `${m} دقيقة` : ""}` || "٠";
  };

  const reset = () => { setAdding(false); setDate(""); setDay(""); setEntries([{ teacherName: "", reason: "", fromTime: "", toTime: "", deputyOpinion: "" }]); };

  const save = async () => {
    const valid = entries.filter((e) => e.teacherName.trim());
    if (!date.trim() || valid.length === 0) return;
    await create({ date, day, department: settings?.department, term: settings?.term, entries: valid });
    reset();
  };

  if (list === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="سجل الاستئذان الأكاديمي"
        desc="تسجيل استئذانات المعلمات وطباعتها بنفس النموذج الرسمي المعتمد"
        icon="exit"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title={adding ? "إغلاق" : "سجل جديد"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
        <HeroBtn title="طباعة السياسة والتواقيع" icon="document-text-outline" onPress={() => printLeavePolicy(teachers ?? [], settings ?? {})} />
      </PageHero>

      {adding && (
        <>
          <Card>
            <H2>بيانات السجل</H2>
            <DateField label="التاريخ" value={date} onChange={(v) => setDate(v)} onDay={(d) => setDay(d)} />
            <Input label="اليوم" value={day} onChangeText={setDay} placeholder="يُملأ تلقائياً من التاريخ" />
            {(list ?? []).length > 0 ? (
              <Button title="نسخ معلمات آخر سجل" icon="copy-outline" variant="outline" small style={{ alignSelf: "flex-start", marginTop: 4 }}
                onPress={() => { const last = list[0]; if (last?.entries?.length) setEntries(last.entries.map((e: any) => ({ teacherName: e.teacherName, reason: e.reason ?? "", fromTime: "", toTime: "", deputyOpinion: "" }))); }} />
            ) : null}
          </Card>

          {entries.map((e, i) => (
            <Card key={i} style={{ backgroundColor: colors.primaryTint }}>
              <Row style={{ justifyContent: "space-between" }}>
                <H2>استئذان {i + 1}</H2>
                {entries.length > 1 && <IconBtn name="close-circle-outline" color={colors.danger} onPress={() => setEntries(entries.filter((_, j) => j !== i))} />}
              </Row>
              <Select label="اسم المعلمة" options={teacherNames} value={e.teacherName} onChange={(v) => setEntry(i, { teacherName: v })} />
              {(() => {
                const warns = [policyWarning(e.teacherName), absentYesterday(e.teacherName)].filter(Boolean) as string[];
                const mc = monthCount(e.teacherName);
                return (
                  <>
                    {warns.map((w, k) => (
                      <View key={k} style={{ flexDirection: "row", alignItems: "flex-start", gap: 7, backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 10, marginBottom: 8 }}>
                        <Ionicons name="warning" size={18} color={colors.danger} style={{ marginTop: 1 }} />
                        <Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.danger, textAlign: "right", lineHeight: 20 }}>{w}</Text>
                      </View>
                    ))}
                    {mc > 0 ? (
                      <Text style={{ fontFamily: fonts.medium, fontSize: 11.5, color: colors.textMuted, textAlign: "right", marginBottom: 6 }}>
                        ℹ️ استأذنت {mc} {mc === 1 ? "مرة" : "مرات"} هذا الشهر.
                      </Text>
                    ) : null}
                  </>
                );
              })()}
              <Input label="السبب" value={e.reason} onChangeText={(v) => setEntry(i, { reason: v })} multiline />
              <Row style={{ gap: 10 }}>
                <View style={{ flex: 1 }}><TimeField label="من" value={e.fromTime} onChange={(v) => setEntry(i, { fromTime: v })} /></View>
                <View style={{ flex: 1 }}><TimeField label="إلى" value={e.toTime} onChange={(v) => setEntry(i, { toTime: v })} /></View>
              </Row>
              {(() => {
                const min = minutesBetween(e.fromTime, e.toTime);
                if (!min) return null;
                const dayMin = dayMinutes(e.teacherName);
                const over = dayMin > 180; // أكثر من 3 ساعات في اليوم
                return (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 11.5, color: over ? colors.danger : colors.textSecondary, textAlign: "right" }}>
                      مدة هذا الاستئذان: {fmtDur(min)}{dayMin !== min ? ` • إجمالي اليوم: ${fmtDur(dayMin)}` : ""}
                    </Text>
                    {over ? (
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 7, backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 10, marginTop: 6 }}>
                        <Ionicons name="alert-circle" size={18} color={colors.danger} style={{ marginTop: 1 }} />
                        <Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.danger, textAlign: "right", lineHeight: 20 }}>
                          تجاوز إجمالي ساعات الاستئذان لهذه المعلمة اليوم 3 ساعات ({fmtDur(dayMin)}) — وهو الحد الأقصى المسموح في السياسة.
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })()}
              <Input label="رأي النائبة الأكاديمية" value={e.deputyOpinion} onChangeText={(v) => setEntry(i, { deputyOpinion: v })} multiline />
            </Card>
          ))}

          <Button title="إضافة استئذان آخر" icon="add" variant="outline" small style={{ alignSelf: "flex-start" }}
            onPress={() => setEntries([...entries, { teacherName: "", reason: "", fromTime: "", toTime: "", deputyOpinion: "" }])} />
          <Button title="حفظ السجل" icon="checkmark" onPress={save} />
        </>
      )}

      {list.length === 0 ? (
        <Empty text="لا توجد سجلات استئذان بعد" actionTitle="سجل جديد" onAction={() => setAdding(true)} icon="exit-outline" />
      ) : list.map((r, ri) => (
        <AnimatedItem key={r._id} index={ri}>
          <Card style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <P style={{ color: colors.text, fontSize: 15 }}>{r.day || "سجل استئذان"} • {r.date}</P>
                <Badge label={`${r.entries?.length ?? 0} استئذان`} tone="primary" />
              </View>
              <Row>
                <IconBtn name="swap-horizontal-outline" color={colors.gold} onPress={() => router.push({ pathname: "/registers/cover", params: { from: r.date, day: r.day ?? "", absentees: (r.entries ?? []).map((e: any) => e.teacherName).join("|") } })} />
                <IconBtn name="print-outline" color={colors.primary} onPress={() => printLeaveRegister(r, settings ?? {})} />
                <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: r._id })} />
              </Row>
            </Row>
          </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
