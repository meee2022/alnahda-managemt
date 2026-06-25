import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem, ExportMenu, notify } from "../lib/ui";
import { colors } from "../lib/theme";
import { setExportMode } from "../lib/print";
import { printDevPlan } from "../lib/printTemplates";
import { DateField } from "../lib/pickers";
import { TEACHER_CATEGORIES } from "../lib/forms";

type PlanRow = { action: string; mechanism: string; period: string; indicator: string };
const emptyRow = (): PlanRow => ({ action: "", mechanism: "", period: "", indicator: "" });
const CAT_LABEL = (key: string) => TEACHER_CATEGORIES.find((c) => c.key === key)?.label ?? key;

export default function DevelopmentPlan() {
  const plans = useQuery(api.devPlans.list, {});
  const teachers = useQuery(api.teachers.list, {});
  const classifications = useQuery(api.classVisits.listClassifications, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.devPlans.create);
  const update = useMutation(api.devPlans.update);
  const remove = useMutation(api.devPlans.remove);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ teacherName: "", category: "تطوير ذاتي", grade: "الأول", section: "A", date: "", criteria: "", notes: "" });
  const [rows, setRows] = useState<PlanRow[]>([emptyRow()]);

  const pickTeacher = (name: string) => {
    const t = (teachers ?? []).find((x) => x.name === name);
    const cat = (classifications ?? []).find((c) => c.teacherName === name)?.category;
    setForm((p) => ({ ...p, teacherName: name, grade: t?.grade || p.grade, section: t?.section || p.section, category: cat || p.category }));
  };

  // تعبئة بنود الفئة الرسمية تلقائياً (المعايير + الإجراءات كبنود قابلة للتعديل)
  const loadCategoryItems = () => {
    const cat = TEACHER_CATEGORIES.find((c) => c.key === form.category);
    if (!cat) return;
    setForm((p) => ({ ...p, criteria: cat.criteria }));
    setRows(cat.actions.map((a) => ({ action: a, mechanism: "", period: "", indicator: "" })));
  };

  const reset = () => {
    setAdding(false); setEditing(null);
    setForm({ teacherName: "", category: "تطوير ذاتي", grade: "الأول", section: "A", date: "", criteria: "", notes: "" });
    setRows([emptyRow()]);
  };

  const startEdit = (p: any) => {
    setForm({ teacherName: p.teacherName ?? "", category: p.category ?? "تطوير ذاتي", grade: p.grade ?? "الأول", section: p.section ?? "A", date: p.date ?? "", criteria: p.criteria ?? "", notes: p.notes ?? "" });
    setRows((p.rows ?? []).length ? p.rows.map((r: any) => ({ action: r.action ?? "", mechanism: r.mechanism ?? "", period: r.period ?? "", indicator: r.indicator ?? "" })) : [emptyRow()]);
    setEditing(p._id); setAdding(true);
  };

  const save = async () => {
    if (!form.teacherName) { notify("يرجى اختيار المعلمة قبل الحفظ."); return; }
    const cleanRows = rows.filter((r) => r.action || r.mechanism || r.indicator);
    if (editing) await update({ id: editing as any, ...form, rows: cleanRows });
    else await create({ ...form, rows: cleanRows });
    reset();
  };

  const print = (p: any) => printDevPlan(p, settings ?? {});

  return (
    <Screen>
      <PageHero
        title="خطة تطوير المعلمة"
        desc="تُملأ بنود الفئة الرسمية تلقائياً (تطوير ذاتي / دعم) — تعدّلين وتكملين"
        icon="trail-sign"
        gradient={["#3B0A14", "#5C1523"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "خطة جديدة"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
      </PageHero>

      {adding && (
        <Card>
          <H2>{editing ? "تعديل خطة التطوير" : "خطة تطوير جديدة"}</H2>
          <Select label="المعلمة" options={(teachers ?? []).map((t) => t.name)} value={form.teacherName} onChange={pickTeacher} />
          <Row>
            <View style={{ flex: 1 }}><Select label="الصف" options={["الأول", "الثاني"]} value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} /></View>
            <View style={{ flex: 1 }}><Select label="الشعبة" options={["A", "B", "C", "D", "E"]} value={form.section} onChange={(v) => setForm({ ...form, section: v })} /></View>
          </Row>
          <Select label="فئة الأداء" options={TEACHER_CATEGORIES.map((c) => c.key)} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <DateField label="تاريخ الخطة" value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} />

          <Button title="تعبئة بنود الفئة تلقائياً" icon="sparkles" variant="outline" small onPress={loadCategoryItems} style={{ marginVertical: 6 }} />
          <P muted style={{ fontSize: 12.5 }}>يملأ المعايير والإجراءات الرسمية لفئة «{CAT_LABEL(form.category)}» كبنود تعدّلين عليها.</P>

          <Input label="معايير الفئة" value={form.criteria} onChangeText={(v) => setForm({ ...form, criteria: v })} multiline />

          <H2>بنود الخطة</H2>
          {rows.map((r, idx) => (
            <Card key={idx} style={{ backgroundColor: colors.bg, marginBottom: 8 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <P muted>بند {idx + 1}</P>
                <Row>
                  <IconBtn name="copy-outline" color={colors.primary} onPress={() => setRows([...rows.slice(0, idx + 1), { ...r }, ...rows.slice(idx + 1)])} />
                  {rows.length > 1 ? <IconBtn name="close-circle-outline" color={colors.danger} onPress={() => setRows(rows.filter((_, i) => i !== idx))} /> : null}
                </Row>
              </Row>
              <Input label="الإجراء / البند" value={r.action} onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, action: v } : x))} multiline />
              <Input label="آلية التنفيذ" value={r.mechanism} onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, mechanism: v } : x))} multiline />
              <Row>
                <View style={{ flex: 1 }}><Input label="الفترة الزمنية" value={r.period} onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, period: v } : x))} /></View>
              </Row>
              <Input label="مؤشر الأداء / الأثر" value={r.indicator} onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, indicator: v } : x))} multiline />
            </Card>
          ))}
          <Button title="إضافة بند" icon="add" variant="outline" small onPress={() => setRows([...rows, emptyRow()])} style={{ marginBottom: 12 }} />

          <Input label="ملاحظات" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
          <Row>
            <Button title={editing ? "حفظ التعديل" : "حفظ الخطة"} icon="checkmark" onPress={save} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
        </Card>
      )}

      {plans === undefined ? <Loading /> : plans.length === 0 ? (
        <Empty text="لا توجد خطط تطوير بعد" actionTitle="خطة جديدة" onAction={() => setAdding(true)} icon="trail-sign-outline" />
      ) : plans.map((p, pi) => (
        <AnimatedItem key={p._id} index={pi}>
        <Card style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <P style={{ color: colors.text, fontSize: 15 }}>{p.teacherName}{p.grade ? ` — ${p.grade} / ${p.section}` : ""}</P>
              <Row style={{ marginTop: 4 }}>
                {p.category ? <Badge label={CAT_LABEL(p.category)} tone="primary" /> : null}
                <Badge label={`${p.rows.length} بند`} tone="muted" />
                {p.date ? <Badge label={p.date} tone="muted" /> : null}
              </Row>
            </View>
            <Row>
              <ExportMenu run={(m) => { setExportMode(m, `خطة تطوير - ${p.teacherName ?? ""}`); print(p); }} />
              <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEdit(p)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: p._id })} />
            </Row>
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
