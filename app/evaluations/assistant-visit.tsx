import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem, ExportMenu, notify } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { DateField } from "../../lib/pickers";
import { setExportMode } from "../../lib/print";
import { printAssistantVisit } from "../../lib/printForms2026";
import { ASSISTANT_VISIT_INDICATORS, ASSISTANT_VISIT_SCALE } from "../../lib/forms2026";
import { isAssistant } from "../../lib/forms";

type Score = { indicator: string; score: number | null; recommendation: string };
const blank = (): Score[] => ASSISTANT_VISIT_INDICATORS.map((i) => ({ indicator: i, score: null, recommendation: "" }));
const GRADES = ["الأول", "الثاني"];
const SECTIONS = ["أ", "ب", "ج", "د", "هـ"];
const PERIODS = ["1", "2", "3", "4", "5", "6", "7"];

export default function AssistantVisit() {
  const list = useQuery(api.forms2026.listAssistantVisits, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const save = useMutation(api.forms2026.saveAssistantVisit);
  const remove = useMutation(api.forms2026.removeAssistantVisit);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState({ assistantName: "", jobNumber: "", date: "", day: "", grade: "الأول", section: "أ", period: "1", subject: "", guide: "", notes: "" });
  const [scores, setScores] = useState<Score[]>(blank());

  // المساعدات أولاً، مع إتاحة بقية الأسماء عند الحاجة
  const assistants = (teachers ?? []).filter((t) => isAssistant(t.jobTitle)).map((t) => t.name);
  const names = assistants.length ? assistants : (teachers ?? []).map((t) => t.name);

  const measured = scores.filter((s) => s.score != null && s.score >= 0);
  const avg = measured.length ? Math.round((measured.reduce((a, s) => a + (s.score ?? 0), 0) / measured.length) * 10) / 10 : null;

  const reset = () => {
    setF({ assistantName: "", jobNumber: "", date: "", day: "", grade: "الأول", section: "أ", period: "1", subject: "", guide: "", notes: "" });
    setScores(blank()); setAdding(false); setEditing(null);
  };

  const startEdit = (r: any) => {
    setF({
      assistantName: r.assistantName ?? "", jobNumber: r.jobNumber ?? "", date: r.date ?? "", day: r.day ?? "",
      grade: r.grade ?? "الأول", section: r.section ?? "أ", period: r.period ?? "1",
      subject: r.subject ?? "", guide: r.guide ?? "", notes: r.notes ?? "",
    });
    const saved: Score[] = (r.scores ?? []).map((s: any) => ({ indicator: s.indicator, score: s.score ?? null, recommendation: s.recommendation ?? "" }));
    setScores(blank().map((b) => saved.find((s) => s.indicator === b.indicator) ?? b));
    setEditing(r._id); setAdding(true);
  };

  const submit = async () => {
    if (!f.assistantName) { notify("يرجى اختيار اسم مساعد المعلم."); return; }
    if (!measured.length) { notify("قيّمي مؤشراً واحداً على الأقل."); return; }
    await save({
      id: (editing as any) ?? undefined,
      assistantName: f.assistantName, jobNumber: f.jobNumber, date: f.date, day: f.day,
      grade: f.grade, section: f.section, period: f.period, subject: f.subject, guide: f.guide,
      scores: scores.map((s) => ({ indicator: s.indicator, score: s.score ?? undefined, recommendation: s.recommendation })),
      domainScore: avg ?? undefined,
      notes: f.notes,
    });
    notify("تم حفظ استمارة الزيارة بنجاح", "success");
    reset();
  };

  if (list === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="زيارة مساعد المعلم"
        desc="استمارة زيارة المنسق الصفية لمساعد معلم — 11 مؤشراً بمقياس 0 إلى 3"
        icon="clipboard"
        gradient={["#3B0A14", "#5C1523"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "زيارة جديدة"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
      </PageHero>

      {adding && (
        <>
          <Card>
            <H2>{editing ? "تعديل الزيارة" : "المعلومات الأساسية"}</H2>
            <Select label="اسم مساعد المعلم" options={names} value={f.assistantName} onChange={(v) => setF({ ...f, assistantName: v })} searchable placeholder="اختاري…" />
            <Row style={{ gap: 8 }}>
              <View style={{ flex: 1 }}><Input label="الرقم الوظيفي" value={f.jobNumber} onChangeText={(v) => setF({ ...f, jobNumber: v })} /></View>
              <View style={{ flex: 1 }}><DateField label="التاريخ" value={f.date} onChange={(v) => setF({ ...f, date: v })} onDay={(d) => setF((p) => ({ ...p, day: d }))} /></View>
            </Row>
            <Row style={{ gap: 8 }}>
              <View style={{ flex: 1 }}><Select label="الصف" options={GRADES} value={f.grade} onChange={(v) => setF({ ...f, grade: v })} /></View>
              <View style={{ flex: 1 }}><Select label="الشعبة" options={SECTIONS} value={f.section} onChange={(v) => setF({ ...f, section: v })} /></View>
              <View style={{ flex: 1 }}><Select label="الحصة" options={PERIODS} value={f.period} onChange={(v) => setF({ ...f, period: v })} /></View>
            </Row>
            <Row style={{ gap: 8 }}>
              <View style={{ flex: 1 }}><Input label="المادة" value={f.subject} onChangeText={(v) => setF({ ...f, subject: v })} /></View>
              <View style={{ flex: 1 }}><Input label="الموجّه التربوي" value={f.guide} onChangeText={(v) => setF({ ...f, guide: v })} /></View>
            </Row>
          </Card>

          <Card>
            <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
              <H2 style={{ marginBottom: 0 }}>المؤشرات</H2>
              <Badge label={avg != null ? `تقييم المجال: ${avg}` : `${measured.length}/${scores.length}`} tone={avg != null ? "success" : "muted"} />
            </Row>
            <P muted style={{ fontSize: 11.5, marginTop: 4 }}>
              3 الأدلة مستكملة وفاعلة · 2 تتوفر معظم الأدلة · 1 تتوفر بعض الأدلة · 0 غير متوفرة أو محدودة · — لم يتم قياسه
            </P>
            {scores.map((s, i) => (
              <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, marginBottom: 10, marginTop: 8 }}>
                <Text style={ss.ind}>{s.indicator}</Text>
                <Row style={{ flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {ASSISTANT_VISIT_SCALE.map((opt) => {
                    const on = s.score === opt.score || (opt.score === -1 && s.score === -1);
                    return (
                      <Pressable
                        key={opt.score}
                        accessibilityRole="button"
                        accessibilityLabel={`${s.indicator}: ${opt.label}`}
                        onPress={() => setScores(scores.map((x, j) => j === i ? { ...x, score: on ? null : opt.score } : x))}
                        style={[ss.chip, on && ss.chipOn]}
                      >
                        <Text style={[ss.chipTxt, on && ss.chipTxtOn]}>{opt.score < 0 ? "—" : opt.score}</Text>
                      </Pressable>
                    );
                  })}
                </Row>
                <Input placeholder="التوصيات" value={s.recommendation} onChangeText={(v) => setScores(scores.map((x, j) => j === i ? { ...x, recommendation: v } : x))} multiline />
              </View>
            ))}
            <Input label="ملاحظات" value={f.notes} onChangeText={(v) => setF({ ...f, notes: v })} multiline />
            <Row>
              <Button title={editing ? "حفظ التعديل" : "حفظ الاستمارة"} icon="checkmark" onPress={submit} />
              <Button title="إلغاء" variant="ghost" onPress={reset} />
            </Row>
          </Card>
        </>
      )}

      {list.length === 0 ? (
        <Empty text="لا توجد زيارات مسجّلة بعد" actionTitle="زيارة جديدة" onAction={() => setAdding(true)} icon="clipboard-outline" />
      ) : list.map((r: any, i: number) => (
        <AnimatedItem key={r._id} index={i}>
          <Card style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <P style={{ color: colors.text, fontSize: 15 }}>{r.assistantName}</P>
                <Row style={{ flexWrap: "wrap", marginTop: 4 }}>
                  {r.date ? <Badge label={r.date} tone="muted" /> : null}
                  <Badge label={`${r.grade ?? ""}/${r.section ?? ""} · ح${r.period ?? ""}`} tone="primary" />
                  {r.domainScore != null ? <Badge label={`تقييم المجال ${r.domainScore}`} tone="success" /> : null}
                </Row>
              </View>
              <Row>
                <ExportMenu run={(m) => { setExportMode(m, `زيارة مساعد - ${r.assistantName}`); printAssistantVisit(r, settings ?? {}); }} />
                <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEdit(r)} />
                <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: r._id })} />
              </Row>
            </Row>
          </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}

const ss = StyleSheet.create({
  ind: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text, textAlign: "right", lineHeight: 21 },
  chip: { minWidth: 44, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: "#fff", alignItems: "center" },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { fontFamily: fonts.bold, fontSize: 14, color: colors.textSecondary },
  chipTxtOn: { color: "#fff" },
});
