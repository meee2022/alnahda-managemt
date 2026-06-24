import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem, ExportMenu } from "../../lib/ui";
import { colors, fonts, radius } from "../../lib/theme";
import { setExportMode } from "../../lib/print";
import { printExamReport } from "../../lib/printTemplates";

type ExamRow = { subject: string; section: string; passRate: string; achievementRate: string; addedValue: string; highCount: string; midCount: string; lowCount: string; failCount: string };

const emptyRow = (): ExamRow => ({ subject: "اللغة العربية", section: "A", passRate: "", achievementRate: "", addedValue: "", highCount: "", midCount: "", lowCount: "", failCount: "" });

const SUBJECTS = ["اللغة العربية", "التربية الإسلامية"];
const TITLE_PRESETS = ["اختبار نهاية الفصل الأول", "اختبار منتصف الفصل الأول", "اختبار نهاية الفصل الثاني", "اختبار منتصف الفصل الثاني"];
const TITLE_OTHER = "اسم آخر (كتابة يدوية)";

export default function Exams() {
  const exams = useQuery(api.academics.listExams, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.academics.createExam);
  const update = useMutation(api.academics.updateExam);
  const remove = useMutation(api.academics.removeExam);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", grade: "الأول", riseReasons: "", declineReasons: "", unmetStandards: "", remedialActions: "", enrichmentActions: "", coordinatorRecommendations: "" });
  const [customTitle, setCustomTitle] = useState(false);
  const [rows, setRows] = useState<ExamRow[]>([emptyRow()]);

  const numOrUndef = (v: string) => (v.trim() === "" ? undefined : (parseInt(v) || 0));
  const numStr = (n: number | undefined) => (n === undefined || n === null ? "" : String(n));

  const reset = () => {
    setForm({ title: "", grade: "الأول", riseReasons: "", declineReasons: "", unmetStandards: "", remedialActions: "", enrichmentActions: "", coordinatorRecommendations: "" });
    setCustomTitle(false);
    setRows([emptyRow()]);
    setAdding(false); setEditing(null);
  };

  const startEdit = (e: any) => {
    const title = e.title ?? "";
    setForm({
      title, grade: e.grade ?? e.rows?.[0]?.grade ?? "الأول",
      riseReasons: e.riseReasons ?? "", declineReasons: e.declineReasons ?? "", unmetStandards: e.unmetStandards ?? "",
      remedialActions: e.remedialActions ?? "", enrichmentActions: e.enrichmentActions ?? "", coordinatorRecommendations: e.coordinatorRecommendations ?? "",
    });
    setCustomTitle(!!title && !TITLE_PRESETS.includes(title));
    setRows((e.rows ?? []).length === 0 ? [emptyRow()] : e.rows.map((r: any) => ({
      subject: r.subject ?? e.subject ?? "اللغة العربية", section: r.section,
      passRate: numStr(r.passRate), achievementRate: numStr(r.achievementRate), addedValue: numStr(r.addedValue),
      highCount: numStr(r.highCount), midCount: numStr(r.midCount), lowCount: numStr(r.lowCount), failCount: numStr(r.failCount),
    })));
    setEditing(e._id); setAdding(true);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    const builtRows = rows.filter((r) => r.passRate || r.achievementRate).map((r) => ({
      grade: form.grade, subject: r.subject, section: r.section,
      passRate: parseFloat(r.passRate) || 0,
      achievementRate: parseFloat(r.achievementRate) || 0,
      addedValue: parseFloat(r.addedValue) || 0,
      highCount: numOrUndef(r.highCount),
      midCount: numOrUndef(r.midCount),
      lowCount: numOrUndef(r.lowCount),
      failCount: numOrUndef(r.failCount),
    }));
    if (editing) {
      await update({
        id: editing as any,
        title: form.title,
        grade: form.grade,
        rows: builtRows,
        riseReasons: form.riseReasons,
        declineReasons: form.declineReasons,
        unmetStandards: form.unmetStandards,
        remedialActions: form.remedialActions,
        enrichmentActions: form.enrichmentActions,
        coordinatorRecommendations: form.coordinatorRecommendations,
      });
    } else {
      await create({
        ...form,
        year: settings?.academicYear ?? "2025-2026",
        rows: builtRows,
      });
    }
    reset();
  };

  const printExam = (e: any) => printExamReport(e, settings ?? {});

  if (exams === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="التحصيل الأكاديمي"
        desc="نتائج الاختبارات بالشعب — نسب النجاح والتحصيل والقيمة المضافة برسوم بيانية"
        icon="trending-up"
        gradient={["#3B0A14", "#5C1523"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "تقرير نتائج جديد"} icon={adding ? "close" : "add"} prominent onPress={() => adding ? reset() : setAdding(true)} />
      </PageHero>

      {adding && (
        <Card>
          <H2>{editing ? "تعديل تقرير النتائج" : "تقرير نتائج اختبار جديد"}</H2>
          <Select
            label="اسم التقرير"
            options={[...TITLE_PRESETS, TITLE_OTHER]}
            value={customTitle ? TITLE_OTHER : form.title}
            onChange={(v) => {
              if (v === TITLE_OTHER) { setCustomTitle(true); setForm({ ...form, title: "" }); }
              else { setCustomTitle(false); setForm({ ...form, title: v }); }
            }}
          />
          {customTitle && (
            <Input label="اكتب اسم التقرير" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
          )}
          <Select label="الصف" options={["الأول", "الثاني"]} value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} />
          <P muted style={{ fontSize: 12.5, marginTop: -2 }}>الصف الأول يمكن أن يشمل المادتين (عربي + شرعية)؛ كل شعبة لها مادتها، والجدول المطبوع يُقسّم تلقائياً.</P>

          <H2>نتائج الشعب</H2>
          {rows.map((r, idx) => (
            <Card key={idx} style={{ backgroundColor: colors.bg, marginBottom: 8 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <P muted>شعبة {idx + 1}</P>
                <Row>
                  <IconBtn name="copy-outline" color={colors.primary} onPress={() => setRows([...rows.slice(0, idx + 1), { ...r }, ...rows.slice(idx + 1)])} />
                  <IconBtn name="close-circle-outline" color={colors.danger} onPress={() => setRows(rows.filter((_, i) => i !== idx))} />
                </Row>
              </Row>
              <Row>
                <View style={{ flex: 1 }}>
                  <Select label="المادة" options={SUBJECTS} value={r.subject} onChange={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, subject: v } : x))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Select label="الشعبة" options={["A", "B", "C", "D", "E"]} value={r.section} onChange={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, section: v } : x))} />
                </View>
              </Row>
              <Row>
                <View style={{ flex: 1 }}><Input label="نسبة النجاح %" value={r.passRate} keyboardType="numeric" onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, passRate: v } : x))} /></View>
                <View style={{ flex: 1 }}><Input label="نسبة التحصيل %" value={r.achievementRate} keyboardType="numeric" onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, achievementRate: v } : x))} /></View>
                <View style={{ flex: 1 }}><Input label="القيمة المضافة %" value={r.addedValue} keyboardType="numeric" onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, addedValue: v } : x))} /></View>
              </Row>
              <P muted style={{ fontSize: 12, marginTop: 2 }}>أعداد الطلبة حسب المستوى</P>
              <Row>
                <View style={{ flex: 1 }}><Input label="مرتفع" value={r.highCount} keyboardType="numeric" onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, highCount: v } : x))} /></View>
                <View style={{ flex: 1 }}><Input label="متوسط" value={r.midCount} keyboardType="numeric" onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, midCount: v } : x))} /></View>
                <View style={{ flex: 1 }}><Input label="متدني" value={r.lowCount} keyboardType="numeric" onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, lowCount: v } : x))} /></View>
                <View style={{ flex: 1 }}><Input label="راسبين" value={r.failCount} keyboardType="numeric" onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, failCount: v } : x))} /></View>
              </Row>
            </Card>
          ))}
          <Button title="إضافة شعبة" icon="add" variant="outline" small onPress={() => setRows([...rows, emptyRow()])} style={{ marginBottom: 12 }} />

          <H2>التقرير الوصفي</H2>
          <Input label="أسباب ارتفاع النتائج" value={form.riseReasons} onChangeText={(v) => setForm({ ...form, riseReasons: v })} multiline />
          <Input label="أسباب انخفاض النتائج" value={form.declineReasons} onChangeText={(v) => setForm({ ...form, declineReasons: v })} multiline />
          <Input label="المعايير/المهارات المشتركة غير المحققة وأسباب التدني" value={form.unmetStandards} onChangeText={(v) => setForm({ ...form, unmetStandards: v })} multiline />
          <Input label="الإجراءات العلاجية المشتركة" value={form.remedialActions} onChangeText={(v) => setForm({ ...form, remedialActions: v })} multiline />
          <Input label="الإجراءات الإثرائية المشتركة" value={form.enrichmentActions} onChangeText={(v) => setForm({ ...form, enrichmentActions: v })} multiline />
          <Input label="توصيات المنسق" value={form.coordinatorRecommendations} onChangeText={(v) => setForm({ ...form, coordinatorRecommendations: v })} multiline />
          <Row>
            <Button title={editing ? "حفظ التعديل" : "حفظ التقرير"} icon="checkmark" onPress={save} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
        </Card>
      )}

      {exams.length === 0 ? (
        <Empty text="لا توجد تقارير نتائج بعد" actionTitle="تقرير جديد" onAction={() => setAdding(true)} icon="trending-up-outline" />
      ) : exams.map((e, eIdx) => {
        const maxAch = Math.max(...e.rows.map((r: any) => r.achievementRate), 0);
        return (
          <AnimatedItem key={e._id} index={eIdx}>
          <Card>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <H2>{e.title}</H2>
                <Row>
                  <Badge label={`الصف ${e.grade ?? e.rows?.[0]?.grade ?? ""}`} tone="primary" />
                  {Array.from(new Set(e.rows.map((r: any) => r.subject ?? e.subject).filter(Boolean))).map((s: any) => (
                    <Badge key={s} label={s} tone="muted" />
                  ))}
                </Row>
              </View>
              <Row>
                <ExportMenu run={(m) => { setExportMode(m, `تقرير نتائج - ${e.title ?? ""}`); printExam(e); }} />
                <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEdit(e)} />
                <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: e._id })} />
              </Row>
            </Row>
            {/* رسم بياني بسيط بالأعمدة */}
            <View style={{ marginTop: 12 }}>
              {e.rows.map((r: any, i: number) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Text style={st.barLabel}>{r.subject ? `${r.subject} — ` : ""}{r.section}</Text>
                    <Text style={st.barValue}>{r.achievementRate}% {r.addedValue !== 0 ? `(${r.addedValue > 0 ? "+" : ""}${r.addedValue}%)` : ""}</Text>
                  </Row>
                  <View style={st.barTrack}>
                    <View style={[st.barFill, {
                      width: `${Math.min(r.achievementRate, 100)}%` as any,
                      backgroundColor: r.achievementRate === maxAch ? colors.success : colors.primary,
                    }]} />
                  </View>
                </View>
              ))}
            </View>
          </Card>
          </AnimatedItem>
        );
      })}
    </Screen>
  );
}

const st = StyleSheet.create({
  barLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  barValue: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textSecondary },
  barTrack: { height: 10, backgroundColor: colors.bg, borderRadius: radius.sm, overflow: "hidden", marginTop: 4 },
  barFill: { height: "100%", borderRadius: radius.sm },
});
