import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Chip, PageHero, HeroBtn, ExportMenu, AnimatedItem, notify } from "../../lib/ui";
import { colors } from "../../lib/theme";
import { printAgenda } from "../../lib/printTemplates";
import { setExportMode } from "../../lib/print";
import { AGENDA_PRESET_TERM1 } from "../../lib/forms";

const TERMS = ["الفصل الدراسي الأول", "الفصل الدراسي الثاني"];

export default function Agenda() {
  const [term, setTerm] = useState(TERMS[0]);
  const entries = useQuery(api.plans.listAgenda, { term });
  const settings = useQuery(api.admin.getSettings, {});
  const upsert = useMutation(api.plans.upsertAgenda);
  const remove = useMutation(api.plans.removeAgenda);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ period: "", meetings: "", visitsCol: "", reportsCol: "", events: "", notes: "" });

  const reset = () => { setForm({ period: "", meetings: "", visitsCol: "", reportsCol: "", events: "", notes: "" }); setAdding(false); setEditing(null); };

  // تعبئة فترات الفصل الأول من جدول الأعمال الرسمي — تُضاف للموجود وتعدّلينها
  const loadPreset = async () => {
    if (typeof window !== "undefined" && !window.confirm(`إضافة ${AGENDA_PRESET_TERM1.length} فترات جاهزة من جدول الأعمال الرسمي للفصل الأول؟ تعدّلينها وتكمّلينها.`)) return;
    const base = entries?.length ?? 0;
    const year = settings?.academicYear ?? "2025-2026";
    for (let i = 0; i < AGENDA_PRESET_TERM1.length; i++) {
      await upsert({ year, term, order: base + i + 1, ...AGENDA_PRESET_TERM1[i] });
    }
  };

  const save = async () => {
    if (!form.period.trim()) { notify("يرجى إدخال الفترة الزمنية قبل الحفظ."); return; }
    await upsert({
      id: (editing as any) ?? undefined,
      year: settings?.academicYear ?? "2025-2026",
      term,
      order: editing ? (entries?.find((e) => e._id === editing)?.order ?? 0) : (entries?.length ?? 0) + 1,
      ...form,
    });
    reset();
  };

  if (entries === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="جدول أعمال المنسقة"
        desc="الفترات الزمنية: الاجتماعات والزيارات والتقارير وفعاليات المدرسة"
        icon="briefcase"
        gradient={["#A8853A", "#DFC48E"]}
      >
        <HeroBtn title={adding || editing ? "إغلاق النموذج" : "إضافة فترة"} icon={adding || editing ? "close" : "add"} prominent onPress={() => (adding || editing ? reset() : setAdding(true))} />
        {term === TERMS[0] ? <HeroBtn title="تعبئة من الجدول الرسمي" icon="sparkles" onPress={loadPreset} /> : null}
        <ExportMenu heroTitle="تصدير الجدول" run={(m) => { setExportMode(m, "جدول الأعمال"); printAgenda(entries, term, settings ?? {}); }} />
      </PageHero>

      <Card>
        <Row>
          {TERMS.map((t) => <Chip key={t} label={t} active={term === t} onPress={() => setTerm(t)} color={colors.gold} />)}
        </Row>
      </Card>

      {(adding || editing) && (
        <Card>
          <H2>{editing ? "تعديل فترة" : `فترة جديدة — ${term}`}</H2>
          <Input label="الفترة الزمنية (مثال: 1-9-2025 إلى 30-9-2025)" value={form.period} onChangeText={(v) => setForm({ ...form, period: v })} />
          <Input label="الاجتماعات + التطوير + الحضور الصفي" value={form.meetings} onChangeText={(v) => setForm({ ...form, meetings: v })} multiline />
          <Input label="الزيارات" value={form.visitsCol} onChangeText={(v) => setForm({ ...form, visitsCol: v })} multiline />
          <Input label="التقارير" value={form.reportsCol} onChangeText={(v) => setForm({ ...form, reportsCol: v })} multiline />
          <Input label="فعاليات المدرسة" value={form.events} onChangeText={(v) => setForm({ ...form, events: v })} multiline />
          <Input label="الملاحظات" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
          <Button title="حفظ" icon="checkmark" onPress={save} />
        </Card>
      )}

      {entries.length === 0 ? (
        <Empty text={`لا توجد فترات في ${term}`} actionTitle="إضافة فترة" onAction={() => setAdding(true)} icon="briefcase-outline" />
      ) : entries.map((e, i) => (
        <AnimatedItem key={e._id} index={i}>
          <Card>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Badge label={e.period} tone="gold" />
                {e.meetings ? <P style={{ fontSize: 13, marginTop: 6 }}>📋 {e.meetings.length > 140 ? e.meetings.slice(0, 140) + "…" : e.meetings}</P> : null}
                {e.events ? <P style={{ fontSize: 13 }}>🎉 {e.events.length > 140 ? e.events.slice(0, 140) + "…" : e.events}</P> : null}
              </View>
              <Row>
                <IconBtn name="pencil-outline" color={colors.primary} onPress={() => {
                  setEditing(e._id); setAdding(false);
                  setForm({ period: e.period, meetings: e.meetings ?? "", visitsCol: e.visitsCol ?? "", reportsCol: e.reportsCol ?? "", events: e.events ?? "", notes: e.notes ?? "" });
                }} />
                <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: e._id })} />
              </Row>
            </Row>
          </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
