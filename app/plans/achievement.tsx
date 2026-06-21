import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem } from "../../lib/ui";
import { colors } from "../../lib/theme";
import { printAchievementPlan } from "../../lib/printTemplates";

const STAGES = [
  "المرحلة الأولى: مرحلة التخطيط وجمع البيانات",
  "المرحلة الثانية: التطبيق",
  "المرحلة الثالثة: التقييم والتقويم من أجل تحسين وتطوير الأداء",
];

export default function AchievementPlan() {
  const rows = useQuery(api.plans.listAchievement, {});
  const settings = useQuery(api.admin.getSettings, {});
  const upsert = useMutation(api.plans.upsertAchievement);
  const remove = useMutation(api.plans.removeAchievement);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ stage: STAGES[0], goal: "", actions: "", responsible: "منسقة المسار الأدبي", timeframe: "", indicators: "", execution: "" });

  const reset = () => { setForm({ stage: STAGES[0], goal: "", actions: "", responsible: "منسقة المسار الأدبي", timeframe: "", indicators: "", execution: "" }); setAdding(false); setEditing(null); };

  const save = async () => {
    if (!form.goal.trim()) return;
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
        title="خطة التحصيل الأكاديمي"
        desc="ثلاث مراحل: التخطيط وجمع البيانات → التطبيق → التقييم والتقويم"
        icon="rocket"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title={adding || editing ? "إغلاق النموذج" : "إضافة هدف"} icon={adding || editing ? "close" : "add"} prominent onPress={() => (adding || editing ? reset() : setAdding(true))} />
        <HeroBtn title="طباعة الخطة" icon="print-outline" onPress={() => printAchievementPlan(rows, settings ?? {})} />
      </PageHero>

      {(adding || editing) && (
        <Card>
          <H2>{editing ? "تعديل هدف" : "هدف جديد في الخطة"}</H2>
          <Select label="المرحلة" options={STAGES} value={form.stage} onChange={(v) => setForm({ ...form, stage: v })} />
          <Input label="الهدف" value={form.goal} onChangeText={(v) => setForm({ ...form, goal: v })} multiline />
          <Input label="الإجراءات" value={form.actions} onChangeText={(v) => setForm({ ...form, actions: v })} multiline />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="مسؤول التنفيذ" value={form.responsible} onChangeText={(v) => setForm({ ...form, responsible: v })} /></View>
            <View style={{ flex: 1 }}><Input label="الإطار الزمني" value={form.timeframe} onChangeText={(v) => setForm({ ...form, timeframe: v })} /></View>
          </Row>
          <Input label="المؤشرات والأدلة" value={form.indicators} onChangeText={(v) => setForm({ ...form, indicators: v })} multiline />
          <Input label="التنفيذ" value={form.execution} onChangeText={(v) => setForm({ ...form, execution: v })} />
          <Button title="حفظ" icon="checkmark" onPress={save} />
        </Card>
      )}

      {rows.length === 0 ? (
        <Empty text="لا توجد أهداف في الخطة بعد" actionTitle="إضافة هدف" onAction={() => setAdding(true)} icon="rocket-outline" />
      ) : STAGES.map((stage) => {
        const stageRows = rows.filter((r) => r.stage === stage);
        if (!stageRows.length) return null;
        return (
          <View key={stage} style={{ marginBottom: 8 }}>
            <Card style={{ backgroundColor: colors.accentSoft, paddingVertical: 10 }}>
              <H2>{stage}</H2>
            </Card>
            {stageRows.map((r, i) => (
              <AnimatedItem key={r._id} index={i}>
                <Card>
                  <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <P style={{ color: colors.text, fontSize: 14.5 }}>{r.goal}</P>
                      <P style={{ fontSize: 13, marginTop: 4 }}>{r.actions.length > 200 ? r.actions.slice(0, 200) + "…" : r.actions}</P>
                      <Row style={{ marginTop: 6, flexWrap: "wrap" }}>
                        {r.responsible ? <Badge label={r.responsible} tone="accent" /> : null}
                        {r.timeframe ? <Badge label={r.timeframe} tone="muted" /> : null}
                      </Row>
                    </View>
                    <Row>
                      <IconBtn name="pencil-outline" color={colors.primary} onPress={() => {
                        setEditing(r._id); setAdding(false);
                        setForm({ stage: r.stage, goal: r.goal, actions: r.actions, responsible: r.responsible ?? "", timeframe: r.timeframe ?? "", indicators: r.indicators ?? "", execution: r.execution ?? "" });
                      }} />
                      <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: r._id })} />
                    </Row>
                  </Row>
                </Card>
              </AnimatedItem>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
