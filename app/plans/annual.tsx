import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, PageHero, HeroBtn, ExportMenu, AnimatedItem, notify } from "../../lib/ui";
import { colors } from "../../lib/theme";
import { DateField } from "../../lib/pickers";
import { printAnnualPlan } from "../../lib/printTemplates";
import { setExportMode } from "../../lib/print";
import { ANNUAL_PLAN_PRESET } from "../../lib/forms";

export default function AnnualPlan() {
  const rows = useQuery(api.plans.listAnnual, {});
  const settings = useQuery(api.admin.getSettings, {});
  const upsert = useMutation(api.plans.upsertAnnual);
  const remove = useMutation(api.plans.removeAnnual);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ domain: "", actions: "", executor: "المنسق", deadline: "", evidence: "", followup: "", followupDate: "" });

  const reset = () => { setForm({ domain: "", actions: "", executor: "المنسق", deadline: "", evidence: "", followup: "", followupDate: "" }); setAdding(false); setEditing(null); };

  // تعبئة الخطة بالمجالات والبنود الرسمية من الخطة التشغيلية — تُضاف للموجود، وتعدّلينها كما تشائين
  const loadPreset = async () => {
    if (typeof window !== "undefined" && !window.confirm(`إضافة ${ANNUAL_PLAN_PRESET.length} مجالات رسمية من الخطة التشغيلية؟ ستُضاف كبنود جاهزة تعدّلينها وتكمّلينها.`)) return;
    const base = rows?.length ?? 0;
    const year = settings?.academicYear ?? "2025-2026";
    for (let i = 0; i < ANNUAL_PLAN_PRESET.length; i++) {
      const p = ANNUAL_PLAN_PRESET[i];
      await upsert({ year, order: base + i + 1, followup: "", followupDate: "", ...p });
    }
  };

  const save = async () => {
    if (!form.domain.trim() || !form.actions.trim()) { notify("يرجى إدخال المجال والإجراءات قبل الحفظ."); return; }
    await upsert({
      id: (editing as any) ?? undefined,
      year: settings?.academicYear ?? "2025-2026",
      order: editing ? (rows?.find((r) => r._id === editing)?.order ?? 0) : (rows?.length ?? 0) + 1,
      ...form,
    });
    reset();
  };

  if (rows === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="الخطة السنوية للقسم"
        desc="المجالات والإجراءات والأنشطة الإشرافية — من الخطة التشغيلية"
        icon="map"
        gradient={["#4A0F1B", "#5C1523"]}
      >
        <HeroBtn title={adding || editing ? "إغلاق النموذج" : "إضافة مجال"} icon={adding || editing ? "close" : "add"} prominent onPress={() => (adding || editing ? reset() : setAdding(true))} />
        <HeroBtn title="تعبئة من النموذج الرسمي" icon="sparkles" onPress={loadPreset} />
        <ExportMenu heroTitle="تصدير الخطة" run={(m) => { setExportMode(m, "الخطة السنوية"); printAnnualPlan(rows, settings ?? {}); }} />
      </PageHero>

      {(adding || editing) && (
        <Card>
          <H2>{editing ? "تعديل مجال" : "مجال جديد في الخطة"}</H2>
          <Input label="المجال" value={form.domain} onChangeText={(v) => setForm({ ...form, domain: v })} multiline />
          <Input label="الإجراءات والأنشطة الإشرافية والبرامج" value={form.actions} onChangeText={(v) => setForm({ ...form, actions: v })} multiline />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="المنفّذ" value={form.executor} onChangeText={(v) => setForm({ ...form, executor: v })} /></View>
            <View style={{ flex: 1 }}><Input label="موعد الانتهاء" value={form.deadline} onChangeText={(v) => setForm({ ...form, deadline: v })} /></View>
          </Row>
          <Input label="أدلة التنفيذ" value={form.evidence} onChangeText={(v) => setForm({ ...form, evidence: v })} multiline />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="المتابعة" value={form.followup} onChangeText={(v) => setForm({ ...form, followup: v })} /></View>
            <View style={{ flex: 1 }}><DateField label="تاريخ المتابعة" value={form.followupDate} onChange={(v) => setForm({ ...form, followupDate: v })} /></View>
          </Row>
          <Button title="حفظ" icon="checkmark" onPress={save} />
        </Card>
      )}

      {rows.length === 0 ? (
        <Empty text="لا توجد مجالات في الخطة بعد" actionTitle="إضافة مجال" onAction={() => setAdding(true)} icon="map-outline" />
      ) : rows.map((r, i) => (
        <AnimatedItem key={r._id} index={i}>
          <Card>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <H2>{r.domain}</H2>
                <P style={{ fontSize: 13 }}>{r.actions.length > 220 ? r.actions.slice(0, 220) + "…" : r.actions}</P>
                <Row style={{ marginTop: 6, flexWrap: "wrap" }}>
                  {r.executor ? <Badge label={`المنفذ: ${r.executor}`} tone="primary" /> : null}
                  {r.deadline ? <Badge label={r.deadline} tone="muted" /> : null}
                </Row>
              </View>
              <Row>
                <IconBtn name="pencil-outline" color={colors.primary} onPress={() => {
                  setEditing(r._id); setAdding(false);
                  setForm({ domain: r.domain, actions: r.actions, executor: r.executor ?? "", deadline: r.deadline ?? "", evidence: r.evidence ?? "", followup: r.followup ?? "", followupDate: r.followupDate ?? "" });
                }} />
                <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: r._id })} />
              </Row>
            </Row>
          </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
