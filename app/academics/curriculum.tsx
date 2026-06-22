import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, Chip, PageHero, HeroBtn, ExportMenu, AnimatedItem } from "../../lib/ui";
import { colors } from "../../lib/theme";
import { printCurriculumPlan } from "../../lib/printTemplates";
import { setExportMode } from "../../lib/print";

export default function Curriculum() {
  const [grade, setGrade] = useState("الثاني");
  const [term, setTerm] = useState("الفصل الثاني");
  const weeks = useQuery(api.academics.listWeeks, { grade, term });
  const settings = useQuery(api.admin.getSettings, {});
  const upsert = useMutation(api.academics.upsertWeek);
  const remove = useMutation(api.academics.removeWeek);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ weekNumber: "", unit: "", arabicLessons: "", islamicLessons: "" });

  const reset = () => {
    setForm({ weekNumber: "", unit: "", arabicLessons: "", islamicLessons: "" });
    setAdding(false);
    setEditing(null);
  };

  const startEdit = (w: any) => {
    setForm({ weekNumber: String(w.weekNumber), unit: w.unit ?? "", arabicLessons: w.arabicLessons ?? "", islamicLessons: w.islamicLessons ?? "" });
    setEditing(w._id);
    setAdding(true);
  };

  const save = async () => {
    const n = parseInt(form.weekNumber);
    if (!n) return;
    if (editing) {
      await upsert({ id: editing as any, grade, term, weekNumber: n, unit: form.unit, arabicLessons: form.arabicLessons, islamicLessons: form.islamicLessons });
    } else {
      await upsert({ grade, term, weekNumber: n, unit: form.unit, arabicLessons: form.arabicLessons, islamicLessons: form.islamicLessons, arabicDone: false, islamicDone: false });
    }
    reset();
  };

  const printPlan = () => printCurriculumPlan(weeks ?? [], grade, term, settings ?? {});

  return (
    <Screen>
      <PageHero
        title="الخطة الفصلية"
        desc={`متابعة تنفيذ دروس اللغة العربية والتربية الإسلامية — الصف ${grade} / ${term}`}
        icon="calendar"
        gradient={["#5E0E24", "#9A1B3C"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "إضافة أسبوع"} icon={adding ? "close" : "add"} prominent onPress={() => adding ? reset() : setAdding(true)} />
        <ExportMenu heroTitle="تصدير الخطة" run={(m) => { setExportMode(m, "الخطة الفصلية"); printPlan(); }} />
      </PageHero>

      <Card>
        <Row style={{ flexWrap: "wrap" }}>
          {["الأول", "الثاني"].map((g) => <Chip key={g} label={`الصف ${g}`} active={grade === g} onPress={() => setGrade(g)} />)}
          <View style={{ width: 12 }} />
          {["الفصل الأول", "الفصل الثاني"].map((t) => <Chip key={t} label={t} active={term === t} onPress={() => setTerm(t)} color={colors.accent} />)}
        </Row>
      </Card>

      {adding && (
        <Card>
          <H2>{editing ? "تعديل الأسبوع" : "أسبوع جديد"}</H2>
          <Input label="رقم الأسبوع" value={form.weekNumber} keyboardType="numeric" onChangeText={(v) => setForm({ ...form, weekNumber: v })} />
          <Input label="الوحدة" value={form.unit} onChangeText={(v) => setForm({ ...form, unit: v })} />
          <Input label="دروس اللغة العربية" value={form.arabicLessons} onChangeText={(v) => setForm({ ...form, arabicLessons: v })} multiline />
          <Input label="دروس التربية الإسلامية" value={form.islamicLessons} onChangeText={(v) => setForm({ ...form, islamicLessons: v })} multiline />
          <Row>
            <Button title={editing ? "حفظ التعديل" : "حفظ"} icon="checkmark" onPress={save} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
        </Card>
      )}

      {weeks === undefined ? <Loading /> : weeks.length === 0 ? (
        <Empty text="لا توجد أسابيع مسجلة بعد" actionTitle="إضافة أسبوع" onAction={() => setAdding(true)} icon="calendar-outline" />
      ) : weeks.map((w, wi) => (
        <AnimatedItem key={w._id} index={wi}>
        <Card>
          <Row style={{ justifyContent: "space-between" }}>
            <H2>الأسبوع {w.weekNumber} {w.unit ? `— ${w.unit}` : ""}</H2>
            <Row>
              <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEdit(w)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: w._id })} />
            </Row>
          </Row>
          <Row style={{ alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Badge label="اللغة العربية" tone="primary" />
                <Chip label={w.arabicDone ? "تم ✔" : "لم يتم"} active={!!w.arabicDone}
                  onPress={() => upsert({ id: w._id, grade, term, weekNumber: w.weekNumber, arabicDone: !w.arabicDone })} color={colors.success} />
              </Row>
              <P style={{ fontSize: 13, marginTop: 6 }}>{w.arabicLessons ?? "—"}</P>
            </View>
            <View style={{ flex: 1 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Badge label="التربية الإسلامية" tone="accent" />
                <Chip label={w.islamicDone ? "تم ✔" : "لم يتم"} active={!!w.islamicDone}
                  onPress={() => upsert({ id: w._id, grade, term, weekNumber: w.weekNumber, islamicDone: !w.islamicDone })} color={colors.success} />
              </Row>
              <P style={{ fontSize: 13, marginTop: 6 }}>{w.islamicLessons ?? "—"}</P>
            </View>
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
