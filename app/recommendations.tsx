import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, Chip, PageHero, HeroBtn, AnimatedItem, ExportMenu } from "../lib/ui";
import { colors } from "../lib/theme";
import { DateField, TimeField } from "../lib/pickers";
import { setExportMode } from "../lib/print";
import { printRecommendations } from "../lib/printTemplates";
import { AiSuggest } from "../lib/aiSuggest";

const STATUSES = ["الكل", "جديدة", "قيد التنفيذ", "منفذة"];
const SOURCES = ["مديرة المدرسة", "النائبة الأكاديمية", "النائبة الإدارية", "الموجه التربوي", "المنسقة", "لجنة الاعتماد"];

export default function Recommendations() {
  const [filter, setFilter] = useState("الكل");
  const items = useQuery(api.reports.listRecommendations, filter === "الكل" ? {} : { status: filter });
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.reports.createRecommendation);
  const update = useMutation(api.reports.updateRecommendation);
  const setStatus = useMutation(api.reports.setRecommendationStatus);
  const remove = useMutation(api.reports.removeRecommendation);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ source: "المنسقة", text: "", assignee: "", dueDate: "", dueTime: "", createdDate: "" });

  const reset = () => { setForm({ source: "المنسقة", text: "", assignee: "", dueDate: "", dueTime: "", createdDate: "" }); setAdding(false); setEditing(null); };
  const startEdit = (x: any) => {
    setForm({ source: x.source, text: x.text, assignee: x.assignee ?? "", dueDate: x.dueDate ?? "", dueTime: x.dueTime ?? "", createdDate: x.createdDate ?? "" });
    setEditing(x._id); setAdding(true);
  };
  const save = async () => {
    if (!form.text.trim()) return;
    if (editing) await update({ id: editing as any, source: form.source, text: form.text, assignee: form.assignee, dueDate: form.dueDate, dueTime: form.dueTime });
    else await create({ ...form, createdDate: new Date().toLocaleDateString("ar-EG") });
    reset();
  };

  return (
    <Screen>
      <PageHero
        title="متابعة التوصيات"
        desc="توصيات المديرة والنائبات والموجهين — من الرصد حتى التنفيذ"
        icon="checkmark-done"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "إضافة توصية"} icon={adding ? "close" : "add"} prominent onPress={() => adding ? reset() : setAdding(true)} />
        <ExportMenu heroTitle="تصدير التوصيات" run={(m) => { setExportMode(m, "متابعة التوصيات"); printRecommendations(items ?? [], settings ?? {}); }} />
      </PageHero>

      <Card>
        <Row style={{ flexWrap: "wrap" }}>
          {STATUSES.map((s) => <Chip key={s} label={s} active={filter === s} onPress={() => setFilter(s)} color={colors.accent} />)}
        </Row>
      </Card>

      {adding && (
        <Card>
          <H2>{editing ? "تعديل التوصية" : "توصية جديدة"}</H2>
          <Select label="المصدر" options={SOURCES} value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
          <Input label="نص التوصية" value={form.text} onChangeText={(v) => setForm({ ...form, text: v })} multiline />
          <AiSuggest prompt={`توصية تربوية رسمية موجزة من ${form.source} لقسم المسار الأدبي${form.text ? ` حول: ${form.text}` : ""}.`}
            onResult={(t) => setForm((p) => ({ ...p, text: p.text ? p.text + "\n" + t : t }))} />
          <Input label="المكلّفة بالتنفيذ" value={form.assignee} onChangeText={(v) => setForm({ ...form, assignee: v })} />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><DateField label="تاريخ الاستحقاق" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} /></View>
            <View style={{ flex: 1 }}><TimeField label="الوقت (اختياري)" value={form.dueTime} onChange={(v) => setForm({ ...form, dueTime: v })} /></View>
          </Row>
          <Row>
            <Button title={editing ? "حفظ التعديل" : "حفظ"} icon="checkmark" onPress={save} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
        </Card>
      )}

      {items === undefined ? <Loading /> : items.length === 0 ? (
        <Empty text="لا توجد توصيات بعد" hint="سجّلي توصيات الاجتماعات والزيارات هنا وتابعي تنفيذها خطوة بخطوة" actionTitle="إضافة أول توصية" onAction={() => setAdding(true)} icon="checkmark-done-outline" />
      ) : items.map((x, xi) => (
        <AnimatedItem key={x._id} index={xi}>
        <Card style={{ paddingVertical: 12 }}>
          <P style={{ color: colors.text }}>{x.text}</P>
          <Row style={{ marginTop: 6, flexWrap: "wrap" }}>
            <Badge label={x.source} tone="accent" />
            {x.assignee ? <Badge label={x.assignee} tone="muted" /> : null}
            {x.dueDate ? <Badge label={`حتى ${x.dueDate}${x.dueTime ? ` · ${x.dueTime}` : ""}`} tone="warning" /> : null}
            <Badge label={x.status} tone={x.status === "منفذة" ? "success" : x.status === "قيد التنفيذ" ? "warning" : "danger"} />
          </Row>
          <Row style={{ marginTop: 8, justifyContent: "space-between" }}>
            <Row>
              {x.status !== "قيد التنفيذ" && x.status !== "منفذة" && (
                <Button title="بدء التنفيذ" small variant="outline" onPress={() => setStatus({ id: x._id, status: "قيد التنفيذ" })} />
              )}
              {x.status !== "منفذة" && (
                <Button title="تمت ✔" small onPress={() => setStatus({ id: x._id, status: "منفذة" })} />
              )}
            </Row>
            <Row>
              <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEdit(x)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: x._id })} />
            </Row>
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
