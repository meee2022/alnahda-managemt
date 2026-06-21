import React, { useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, Chip, PageHero, HeroBtn, AnimatedItem } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { DateField } from "../../lib/pickers";
import { printCoverRegister, printCoverPolicy } from "../../lib/printTemplates";

type Entry = {
  teacherName: string; reason: string; grade: string; section: string;
  period: string; coverTeacher: string; planType: string; notify: string; notes: string;
};

const REASONS = ["غياب", "تبديل", "إشرافية فقط"];
const PLAN_TYPES = ["مراجعة", "درس", "متابعة واجبات", "تبديل درس"];
const NOTIFY = ["تم إبلاغي قبل الحصة بوقت كافٍ", "تم إبلاغي قبل الحصة مباشرة", "تم الرفض"];

const emptyEntry = (): Entry => ({ teacherName: "", reason: "غياب", grade: "", section: "", period: "", coverTeacher: "", planType: "مراجعة", notify: NOTIFY[0], notes: "" });

export default function CoverRegister() {
  const list = useQuery(api.registers.listCover, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.registers.createCover);
  const remove = useMutation(api.registers.removeCover);

  // تعبئة مسبقة عند التحويل من سجل الاستئذان (غياب)
  const params = useLocalSearchParams<{ from?: string; day?: string; absentees?: string }>();
  const prefillNames = (params.absentees ?? "").split("|").map((x) => x.trim()).filter(Boolean);

  const [adding, setAdding] = useState(prefillNames.length > 0);
  const [date, setDate] = useState(params.from ?? "");
  const [day, setDay] = useState(params.day ?? "");
  const [entries, setEntries] = useState<Entry[]>(
    prefillNames.length ? prefillNames.map((n) => ({ ...emptyEntry(), teacherName: n, reason: "غياب" })) : [emptyEntry()]
  );

  const teacherNames = (teachers ?? []).map((t) => t.name);
  const setEntry = (i: number, patch: Partial<Entry>) => setEntries((p) => p.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const reset = () => { setAdding(false); setDate(""); setDay(""); setEntries([emptyEntry()]); };

  const save = async () => {
    const valid = entries.filter((e) => e.teacherName.trim() && e.coverTeacher.trim());
    if (!date.trim() || valid.length === 0) return;
    await create({ date, day, department: settings?.department, entries: valid });
    reset();
  };

  if (list === undefined) return <Loading />;

  const FieldChips = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary, textAlign: "right", marginBottom: 6 }}>{label}</Text>
      <Row style={{ flexWrap: "wrap" }}>
        {options.map((o) => <Chip key={o} label={o} active={value === o} onPress={() => onChange(o)} />)}
      </Row>
    </View>
  );

  return (
    <Screen>
      <PageHero
        title="سجل الاحتياط الأكاديمي"
        desc="تسجيل حصص الاحتياط وطباعتها بنفس النموذج الرسمي المعتمد"
        icon="swap-horizontal"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title={adding ? "إغلاق" : "سجل جديد"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
        <HeroBtn title="طباعة السياسة والتواقيع" icon="document-text-outline" onPress={() => printCoverPolicy(teachers ?? [], settings ?? {})} />
      </PageHero>

      {adding && (
        <>
          <Card>
            <H2>بيانات السجل</H2>
            <DateField label="التاريخ" value={date} onChange={(v) => setDate(v)} onDay={(d) => setDay(d)} />
            <Input label="اليوم" value={day} onChangeText={setDay} placeholder="يُملأ تلقائياً من التاريخ" />
            {(list ?? []).length > 0 ? (
              <Button title="نسخ حصص آخر سجل" icon="copy-outline" variant="outline" small style={{ alignSelf: "flex-start", marginTop: 4 }}
                onPress={() => { const last = list[0]; if (last?.entries?.length) setEntries(last.entries.map((e: any) => ({ ...emptyEntry(), teacherName: e.teacherName, reason: e.reason ?? "غياب", grade: e.grade ?? "", section: e.section ?? "", coverTeacher: e.coverTeacher ?? "", planType: e.planType ?? "مراجعة" }))); }} />
            ) : null}
          </Card>

          {entries.map((e, i) => (
            <Card key={i} style={{ backgroundColor: colors.primaryTint }}>
              <Row style={{ justifyContent: "space-between" }}>
                <H2>حصة احتياط {i + 1}</H2>
                {entries.length > 1 && <IconBtn name="close-circle-outline" color={colors.danger} onPress={() => setEntries(entries.filter((_, j) => j !== i))} />}
              </Row>
              <Select label="اسم المعلمة (الغائبة/صاحبة الحصة)" options={teacherNames} value={e.teacherName} onChange={(v) => setEntry(i, { teacherName: v })} />
              <FieldChips label="السبب" options={REASONS} value={e.reason} onChange={(v) => setEntry(i, { reason: v })} />
              <Row style={{ gap: 10 }}>
                <View style={{ flex: 1 }}><Select label="الصف" options={["الأول", "الثاني"]} value={e.grade} onChange={(v) => setEntry(i, { grade: v })} /></View>
                <View style={{ flex: 1 }}><Select label="الشعبة" options={["A", "B", "C", "D", "E"]} value={e.section} onChange={(v) => setEntry(i, { section: v })} /></View>
                <View style={{ flex: 1 }}><Input label="الحصة" value={e.period} onChangeText={(v) => setEntry(i, { period: v })} /></View>
              </Row>
              <Select label="معلمة الاحتياط" options={teacherNames} value={e.coverTeacher} onChange={(v) => setEntry(i, { coverTeacher: v })} />
              <FieldChips label="طبيعة الخطة المنفذة" options={PLAN_TYPES} value={e.planType} onChange={(v) => setEntry(i, { planType: v })} />
              <FieldChips label="الملاحظات" options={NOTIFY} value={e.notify} onChange={(v) => setEntry(i, { notify: v })} />
              <Input label="ملاحظات إضافية" value={e.notes} onChangeText={(v) => setEntry(i, { notes: v })} multiline />
            </Card>
          ))}

          <Button title="إضافة حصة احتياط أخرى" icon="add" variant="outline" small style={{ alignSelf: "flex-start" }}
            onPress={() => setEntries([...entries, emptyEntry()])} />
          <Button title="حفظ السجل" icon="checkmark" onPress={save} />
        </>
      )}

      {list.length === 0 ? (
        <Empty text="لا توجد سجلات احتياط بعد" actionTitle="سجل جديد" onAction={() => setAdding(true)} icon="swap-horizontal-outline" />
      ) : list.map((r, ri) => (
        <AnimatedItem key={r._id} index={ri}>
          <Card style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <P style={{ color: colors.text, fontSize: 15 }}>{r.day || "سجل احتياط"} • {r.date}</P>
                <Badge label={`${r.entries?.length ?? 0} حصة`} tone="primary" />
              </View>
              <Row>
                <IconBtn name="print-outline" color={colors.primary} onPress={() => printCoverRegister(r, settings ?? {})} />
                <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: r._id })} />
              </Row>
            </Row>
          </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
