import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem, ExportMenu } from "../../lib/ui";
import { colors } from "../../lib/theme";
import { setExportMode } from "../../lib/print";
import { printGuidePlan } from "../../lib/printTemplates";
import { DateField } from "../../lib/pickers";

type PlanRow = { guideName: string; visitDate: string; domain: string; actions: string; period: string; followDate: string; indicators: string };
const emptyRow = (): PlanRow => ({ guideName: "", visitDate: "", domain: "", actions: "", period: "", followDate: "", indicators: "" });

export default function GuidePlan() {
  const plans = useQuery(api.guidePlans.list, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.guidePlans.create);
  const update = useMutation(api.guidePlans.update);
  const remove = useMutation(api.guidePlans.remove);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ teacherName: "", grade: "الأول", section: "A", date: "", notes: "" });
  const [rows, setRows] = useState<PlanRow[]>([emptyRow()]);

  const pickTeacher = (name: string) => {
    const t = (teachers ?? []).find((x) => x.name === name);
    setForm((p) => ({ ...p, teacherName: name, grade: t?.grade || p.grade, section: t?.section || p.section }));
  };

  const reset = () => {
    setAdding(false);
    setEditing(null);
    setForm({ teacherName: "", grade: "الأول", section: "A", date: "", notes: "" });
    setRows([emptyRow()]);
  };

  const startEdit = (p: any) => {
    setForm({ teacherName: p.teacherName ?? "", grade: p.grade ?? "الأول", section: p.section ?? "A", date: p.date ?? "", notes: p.notes ?? "" });
    setRows((p.rows ?? []).length ? p.rows.map((r: any) => ({ ...r })) : [emptyRow()]);
    setEditing(p._id);
    setAdding(true);
  };

  const save = async () => {
    if (!form.teacherName) return;
    const cleanRows = rows.filter((r) => r.domain || r.actions || r.guideName);
    if (editing) await update({ id: editing as any, ...form, rows: cleanRows });
    else await create({ ...form, rows: cleanRows });
    reset();
  };

  const print = (p: any) => printGuidePlan(p, settings ?? {});

  return (
    <Screen>
      <PageHero
        title="خطة متابعة توصيات الموجه"
        desc="تُستخدم عند تكرار مؤشرات لم تتوفر لها أدلة في الزيارات الصفية"
        icon="git-network"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "خطة جديدة"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
      </PageHero>

      {adding && (
        <Card>
          <H2>{editing ? "تعديل خطة المتابعة" : "خطة متابعة جديدة"}</H2>
          <Select label="المعلمة" options={(teachers ?? []).map((t) => t.name)} value={form.teacherName} onChange={pickTeacher} />
          <Row>
            <View style={{ flex: 1 }}><Select label="الصف" options={["الأول", "الثاني"]} value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} /></View>
            <View style={{ flex: 1 }}><Select label="الشعبة" options={["A", "B", "C", "D", "E"]} value={form.section} onChange={(v) => setForm({ ...form, section: v })} /></View>
          </Row>
          <DateField label="تاريخ الخطة" value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} />

          <H2>بنود المتابعة</H2>
          {rows.map((r, idx) => (
            <Card key={idx} style={{ backgroundColor: colors.bg, marginBottom: 8 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <P muted>بند {idx + 1}</P>
                {rows.length > 1 ? <IconBtn name="close-circle-outline" color={colors.danger} onPress={() => setRows(rows.filter((_, i) => i !== idx))} /> : null}
              </Row>
              <Input label="اسم الموجه التربوي" value={r.guideName} onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, guideName: v } : x))} />
              <Row>
                <View style={{ flex: 1 }}><Input label="تاريخ الزيارة / المادة" value={r.visitDate} onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, visitDate: v } : x))} /></View>
                <View style={{ flex: 1 }}><Input label="الفترة الزمنية" value={r.period} onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, period: v } : x))} /></View>
              </Row>
              <Input label="المجال / المؤشر" value={r.domain} onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, domain: v } : x))} multiline />
              <Input label="الإجراءات (حضور صفّي، حلقة نقاشية، اجتماع، جلسات تحضير جماعي...)" value={r.actions} onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, actions: v } : x))} multiline />
              <DateField label="تاريخ المتابعة من المنسق" value={r.followDate} onChange={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, followDate: v } : x))} />
              <Input label="مؤشرات تحقق الأداء" value={r.indicators} onChangeText={(v) => setRows(rows.map((x, i) => i === idx ? { ...x, indicators: v } : x))} multiline />
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
        <Empty text="لا توجد خطط متابعة بعد" actionTitle="خطة جديدة" onAction={() => setAdding(true)} icon="git-network-outline" />
      ) : plans.map((p, pi) => (
        <AnimatedItem key={p._id} index={pi}>
        <Card style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <P style={{ color: colors.text, fontSize: 15 }}>{p.teacherName}{p.grade ? ` — ${p.grade} / ${p.section}` : ""}</P>
              <Row style={{ marginTop: 4 }}>
                <Badge label={`${p.rows.length} بند`} tone="primary" />
                {p.date ? <Badge label={p.date} tone="muted" /> : null}
              </Row>
            </View>
            <Row>
              <ExportMenu run={(m) => { setExportMode(m, `خطة متابعة الموجه - ${p.teacherName ?? ""}`); print(p); }} />
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
