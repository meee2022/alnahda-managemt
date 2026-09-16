import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem, ExportMenu, notify } from "../../lib/ui";
import { colors } from "../../lib/theme";
import { DateField } from "../../lib/pickers";
import { setExportMode } from "../../lib/print";
import { printTeacherExamReport } from "../../lib/printForms2026";

type Row = { section: string; subject: string; passRate: string; achievementRate: string; addedValue: string; highCount: string; midCount: string; lowCount: string; failCount: string };
const emptyRow = (): Row => ({ section: "", subject: "", passRate: "", achievementRate: "", addedValue: "", highCount: "", midCount: "", lowCount: "", failCount: "" });
const SUBJECTS = ["اللغة العربية", "التربية الإسلامية", "اللغة الإنجليزية", "الرياضيات", "العلوم"];

export default function TeacherExamReport() {
  const list = useQuery(api.forms2026.listTeacherExamReports, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const save = useMutation(api.forms2026.saveTeacherExamReport);
  const remove = useMutation(api.forms2026.removeTeacherExamReport);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState({ teacherName: "", examTitle: "", date: "", unmetStandards: "", remedialActions: "", enrichmentActions: "", coordinatorComment: "" });
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  const reset = () => {
    setF({ teacherName: "", examTitle: "", date: "", unmetStandards: "", remedialActions: "", enrichmentActions: "", coordinatorComment: "" });
    setRows([emptyRow()]); setAdding(false); setEditing(null);
  };

  const startEdit = (r: any) => {
    setF({
      teacherName: r.teacherName ?? "", examTitle: r.examTitle ?? "", date: r.date ?? "",
      unmetStandards: r.unmetStandards ?? "", remedialActions: r.remedialActions ?? "",
      enrichmentActions: r.enrichmentActions ?? "", coordinatorComment: r.coordinatorComment ?? "",
    });
    setRows((r.rows ?? []).length ? r.rows.map((x: any) => ({
      section: x.section ?? "", subject: x.subject ?? "",
      passRate: String(x.passRate ?? ""), achievementRate: String(x.achievementRate ?? ""), addedValue: String(x.addedValue ?? ""),
      highCount: String(x.highCount ?? ""), midCount: String(x.midCount ?? ""), lowCount: String(x.lowCount ?? ""), failCount: String(x.failCount ?? ""),
    })) : [emptyRow()]);
    setEditing(r._id); setAdding(true);
  };

  const submit = async () => {
    if (!f.teacherName || !f.examTitle) { notify("يرجى اختيار المعلمة وكتابة اسم الاختبار."); return; }
    const valid = rows.filter((r) => r.section.trim());
    if (!valid.length) { notify("أضيفي شعبة واحدة على الأقل بنتائجها."); return; }
    const n = (v: string) => Number(v || 0);
    await save({
      id: (editing as any) ?? undefined,
      teacherName: f.teacherName, examTitle: f.examTitle, date: f.date,
      year: settings?.academicYear ?? "2026-2027",
      rows: valid.map((r) => ({
        section: r.section.trim(), subject: r.subject || undefined,
        passRate: n(r.passRate), achievementRate: n(r.achievementRate), addedValue: n(r.addedValue),
        highCount: n(r.highCount), midCount: n(r.midCount), lowCount: n(r.lowCount), failCount: n(r.failCount),
      })),
      unmetStandards: f.unmetStandards, remedialActions: f.remedialActions,
      enrichmentActions: f.enrichmentActions, coordinatorComment: f.coordinatorComment,
    });
    notify("تم حفظ التقرير الكمي/الوصفي بنجاح", "success");
    reset();
  };

  if (list === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="التقرير الكمي/الوصفي للمعلم"
        desc="تقرير كل معلمة لنتائج اختبار شعبها — يُرفع للمنسقة بالنموذج الرسمي"
        icon="stats-chart"
        gradient={["#3B0A14", "#5C1523"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "تقرير جديد"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
      </PageHero>

      {adding && (
        <>
          <Card>
            <H2>{editing ? "تعديل التقرير" : "بيانات التقرير"}</H2>
            <Select label="اسم المعلمة" options={(teachers ?? []).map((t) => t.name)} value={f.teacherName} onChange={(v) => setF({ ...f, teacherName: v })} searchable placeholder="اختاري المعلمة…" />
            <Input label="اسم الاختبار" value={f.examTitle} onChangeText={(v) => setF({ ...f, examTitle: v })} placeholder="مثال: الاختبار التحريري الأول" />
            <DateField label="التاريخ" value={f.date} onChange={(v) => setF({ ...f, date: v })} />
            <P muted style={{ fontSize: 12 }}>المنسق: {settings?.coordinator ?? "—"} • العام: {settings?.academicYear ?? "—"}</P>
          </Card>

          <Card>
            <H2>التقرير الكمي (شعبة لكل صف)</H2>
            {rows.map((r, i) => (
              <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, marginBottom: 10 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <Badge label={`شعبة ${i + 1}`} tone="primary" />
                  {rows.length > 1 ? <IconBtn name="close-circle-outline" color={colors.danger} onPress={() => setRows(rows.filter((_, j) => j !== i))} /> : null}
                </Row>
                <Row style={{ gap: 8 }}>
                  <View style={{ flex: 1 }}><Input label="الشعبة" value={r.section} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, section: v } : x))} placeholder="الأول/أ" /></View>
                  <View style={{ flex: 1 }}><Select label="المادة" options={SUBJECTS} value={r.subject} onChange={(v) => setRows(rows.map((x, j) => j === i ? { ...x, subject: v } : x))} /></View>
                </Row>
                <Row style={{ gap: 8 }}>
                  <View style={{ flex: 1 }}><Input label="نسبة النجاح %" value={r.passRate} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, passRate: v } : x))} keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><Input label="التحصيل %" value={r.achievementRate} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, achievementRate: v } : x))} keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><Input label="القيمة المضافة" value={r.addedValue} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, addedValue: v } : x))} keyboardType="numeric" /></View>
                </Row>
                <Row style={{ gap: 8 }}>
                  <View style={{ flex: 1 }}><Input label="مرتفع" value={r.highCount} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, highCount: v } : x))} keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><Input label="متوسط" value={r.midCount} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, midCount: v } : x))} keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><Input label="متدني" value={r.lowCount} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, lowCount: v } : x))} keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><Input label="راسبين" value={r.failCount} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, failCount: v } : x))} keyboardType="numeric" /></View>
                </Row>
              </View>
            ))}
            <Button title="إضافة شعبة" icon="add" variant="outline" small style={{ alignSelf: "flex-start" }} onPress={() => setRows([...rows, emptyRow()])} />
          </Card>

          <Card>
            <H2>التقرير الوصفي</H2>
            <Input label="تحديد المعايير/المهارات غير المحققة (أسماء الطلبة وأسباب التدني)" value={f.unmetStandards} onChangeText={(v) => setF({ ...f, unmetStandards: v })} multiline />
            <Input label="الإجراءات العلاجية" value={f.remedialActions} onChangeText={(v) => setF({ ...f, remedialActions: v })} multiline />
            <Input label="الإجراءات الإثرائية" value={f.enrichmentActions} onChangeText={(v) => setF({ ...f, enrichmentActions: v })} multiline />
            <Input label="تعليق المنسق" value={f.coordinatorComment} onChangeText={(v) => setF({ ...f, coordinatorComment: v })} multiline />
            <Row>
              <Button title={editing ? "حفظ التعديل" : "حفظ التقرير"} icon="checkmark" onPress={submit} />
              <Button title="إلغاء" variant="ghost" onPress={reset} />
            </Row>
          </Card>
        </>
      )}

      {list.length === 0 ? (
        <Empty text="لا توجد تقارير بعد" actionTitle="تقرير جديد" onAction={() => setAdding(true)} icon="stats-chart-outline" />
      ) : list.map((r: any, i: number) => (
        <AnimatedItem key={r._id} index={i}>
          <Card style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <P style={{ color: colors.text, fontSize: 15 }}>{r.teacherName} — {r.examTitle}</P>
                <Row style={{ flexWrap: "wrap", marginTop: 4 }}>
                  <Badge label={`${r.rows?.length ?? 0} شعبة`} tone="primary" />
                  {r.date ? <Badge label={r.date} tone="muted" /> : null}
                </Row>
              </View>
              <Row>
                <ExportMenu run={(m) => { setExportMode(m, `تقرير ${r.teacherName} - ${r.examTitle}`); printTeacherExamReport(r, settings ?? {}); }} />
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
