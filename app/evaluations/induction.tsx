import React, { useState } from "react";
import { View, Text } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem, ExportMenu, notify } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { DateField } from "../../lib/pickers";
import { setExportMode } from "../../lib/print";
import { printInductionPlan } from "../../lib/printForms2026";
import { INDUCTION_ASPECTS } from "../../lib/forms2026";

type Row = { aspect: string; actions: string; owner: string; timeframe: string; evidence: string };
const blank = (): Row[] => INDUCTION_ASPECTS.map((a) => ({ aspect: a, actions: "", owner: "", timeframe: "", evidence: "" }));

export default function InductionPlan() {
  const list = useQuery(api.forms2026.listInductionPlans, {});
  const teachers = useQuery(api.teachers.list, {});
  const classifications = useQuery(api.classVisits.listClassifications, {});
  const settings = useQuery(api.admin.getSettings, {});
  const save = useMutation(api.forms2026.saveInductionPlan);
  const remove = useMutation(api.forms2026.removeInductionPlan);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState({ teacherName: "", subjectDept: "", date: "", notes: "" });
  const [rows, setRows] = useState<Row[]>(blank());

  // المعلمات المصنّفات «مستجد» أولاً — الخطة مخصّصة لهنّ
  const newTeachers = (classifications ?? []).filter((c: any) => c.category === "مستجد").map((c: any) => c.teacherName);
  const names = Array.from(new Set([...newTeachers, ...(teachers ?? []).map((t) => t.name)]));
  const filled = rows.filter((r) => r.actions.trim()).length;

  const reset = () => { setF({ teacherName: "", subjectDept: "", date: "", notes: "" }); setRows(blank()); setAdding(false); setEditing(null); };

  const startEdit = (r: any) => {
    setF({ teacherName: r.teacherName ?? "", subjectDept: r.subjectDept ?? "", date: r.date ?? "", notes: r.notes ?? "" });
    const saved: Row[] = (r.rows ?? []).map((x: any) => ({ aspect: x.aspect, actions: x.actions ?? "", owner: x.owner ?? "", timeframe: x.timeframe ?? "", evidence: x.evidence ?? "" }));
    setRows(blank().map((b) => saved.find((s) => s.aspect === b.aspect) ?? b));
    setEditing(r._id); setAdding(true);
  };

  const submit = async () => {
    if (!f.teacherName) { notify("يرجى اختيار المعلمة المستجدة."); return; }
    if (!filled) { notify("املئي إجراءات جانب واحد على الأقل."); return; }
    await save({
      id: (editing as any) ?? undefined,
      teacherName: f.teacherName, subjectDept: f.subjectDept, date: f.date,
      year: settings?.academicYear ?? "2026-2027",
      rows: rows.map((r) => ({ aspect: r.aspect, actions: r.actions, owner: r.owner, timeframe: r.timeframe, evidence: r.evidence })),
      notes: f.notes,
    });
    notify("تم حفظ خطة التهيئة بنجاح", "success");
    reset();
  };

  if (list === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="خطة تهيئة معلم مستجد"
        desc="خطة التهيئة للمعلمات المستجدات — 7 جوانب بالنموذج الرسمي"
        icon="school"
        gradient={["#3B0A14", "#5C1523"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "خطة جديدة"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
      </PageHero>

      {adding && (
        <>
          <Card>
            <H2>{editing ? "تعديل الخطة" : "بيانات الخطة"}</H2>
            <Select label="اسم المعلمة" options={names} value={f.teacherName} onChange={(v) => setF({ ...f, teacherName: v })} searchable placeholder="اختاري…" />
            {newTeachers.length ? <P muted style={{ fontSize: 11.5 }}>المصنّفات «مستجد»: {newTeachers.join("، ")}</P> : null}
            <Row style={{ gap: 8 }}>
              <View style={{ flex: 1 }}><Input label="المادة / القسم" value={f.subjectDept} onChangeText={(v) => setF({ ...f, subjectDept: v })} placeholder={settings?.department ?? ""} /></View>
              <View style={{ flex: 1 }}><DateField label="التاريخ" value={f.date} onChange={(v) => setF({ ...f, date: v })} /></View>
            </Row>
            <P muted style={{ fontSize: 12 }}>المنسقة: {settings?.coordinator ?? "—"} • النائبة الأكاديمية: {settings?.academicDeputy ?? "—"}</P>
          </Card>

          <Card>
            <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
              <H2 style={{ marginBottom: 0 }}>جوانب الخطة</H2>
              <Badge label={`${filled} / ${rows.length}`} tone={filled ? "success" : "muted"} />
            </Row>
            {rows.map((r, i) => (
              <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, marginBottom: 10, marginTop: 8 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 12.5, color: colors.primary, textAlign: "right", lineHeight: 21 }}>{r.aspect}</Text>
                <Input placeholder="الإجراءات" value={r.actions} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, actions: v } : x))} multiline />
                <Row style={{ gap: 8 }}>
                  <View style={{ flex: 1 }}><Input placeholder="المسؤول عن التنفيذ" value={r.owner} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, owner: v } : x))} /></View>
                  <View style={{ flex: 1 }}><Input placeholder="الإطار الزمني" value={r.timeframe} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, timeframe: v } : x))} /></View>
                </Row>
                <Input placeholder="مؤشرات التنفيذ (الأدلة)" value={r.evidence} onChangeText={(v) => setRows(rows.map((x, j) => j === i ? { ...x, evidence: v } : x))} />
              </View>
            ))}
            <Input label="ملاحظات" value={f.notes} onChangeText={(v) => setF({ ...f, notes: v })} multiline />
            <Row>
              <Button title={editing ? "حفظ التعديل" : "حفظ الخطة"} icon="checkmark" onPress={submit} />
              <Button title="إلغاء" variant="ghost" onPress={reset} />
            </Row>
          </Card>
        </>
      )}

      {list.length === 0 ? (
        <Empty text="لا توجد خطط تهيئة بعد" actionTitle="خطة جديدة" onAction={() => setAdding(true)} icon="school-outline" />
      ) : list.map((r: any, i: number) => (
        <AnimatedItem key={r._id} index={i}>
          <Card style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <P style={{ color: colors.text, fontSize: 15 }}>{r.teacherName}</P>
                <Row style={{ flexWrap: "wrap", marginTop: 4 }}>
                  <Badge label={`${(r.rows ?? []).filter((x: any) => x.actions).length} جانب معبّأ`} tone="primary" />
                  {r.date ? <Badge label={r.date} tone="muted" /> : null}
                </Row>
              </View>
              <Row>
                <ExportMenu run={(m) => { setExportMode(m, `خطة تهيئة - ${r.teacherName}`); printInductionPlan(r, settings ?? {}); }} />
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
