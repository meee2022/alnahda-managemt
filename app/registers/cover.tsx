import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, Chip, PageHero, HeroBtn, AnimatedItem, ExportMenu } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { DateField } from "../../lib/pickers";
import { setExportMode } from "../../lib/print";
import { printCoverRegister, printCoverPolicy } from "../../lib/printTemplates";

type Entry = {
  teacherName: string; reason: string; grade: string; section: string;
  period: string; coverTeacher: string; planType: string; notify: string; notes: string;
};

const REASONS = ["غياب", "تبديل"];
const PLAN_TYPES = ["مراجعة", "درس", "متابعة واجبات", "إشرافية فقط"];
const NOTIFY = ["تم إبلاغي قبل الحصة بوقت كافٍ", "تم إبلاغي قبل الحصة مباشرة", "تم الرفض"];

const emptyEntry = (): Entry => ({
  teacherName: "", reason: "غياب", grade: "", section: "",
  period: "", coverTeacher: "", planType: "مراجعة", notify: NOTIFY[0], notes: "",
});

function FieldChips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary, textAlign: "right", marginBottom: 6 }}>{label}</Text>
      <Row style={{ flexWrap: "wrap" }}>
        {options.map((o) => <Chip key={o} label={o} active={value === o} onPress={() => onChange(o)} />)}
      </Row>
    </View>
  );
}

type EntryFormProps = {
  e: Entry;
  i: number;
  teacherNames: string[];
  day: string;
  daySchedule: any[] | undefined;
  canRemove: boolean;
  onRemove: () => void;
  onPatch: (patch: Partial<Entry>) => void;
  onSelectTeacher: (name: string) => void;
};

function EntryForm({ e, i, teacherNames, day, daySchedule, canRemove, onRemove, onPatch, onSelectTeacher }: EntryFormProps) {
  const freeTeachersFor = (period: string) => {
    if (!daySchedule) return teacherNames;
    const busy = new Set(daySchedule.filter((x) => x.period === period).map((x) => x.teacherName));
    busy.add(e.teacherName);
    return teacherNames.filter((n) => !busy.has(n));
  };

  const hasClass = !!(e.grade || e.period);

  return (
    <Card style={{ backgroundColor: colors.primaryTint }}>
      <Row style={{ justifyContent: "space-between" }}>
        <H2>حصة احتياط {i + 1}</H2>
        {canRemove && <IconBtn name="close-circle-outline" color={colors.danger} onPress={onRemove} />}
      </Row>

      <Select label="اسم المعلمة (الغائبة/صاحبة الحصة)" options={teacherNames} value={e.teacherName} onChange={onSelectTeacher} />
      <FieldChips label="السبب" options={REASONS} value={e.reason} onChange={(v) => onPatch({ reason: v })} />

      {/* الصف والحصة (يُملأ تلقائياً من جدول المعلمة) */}
      {hasClass ? (
        <View style={ss.classBanner}>
          <Text style={ss.classBannerTxt}>
            الحصة {e.period || "—"} · {e.grade}{e.section ? `/${e.section}` : ""}
          </Text>
          <Text style={ss.classBannerHint}>تلقائياً من جدول {e.teacherName}</Text>
        </View>
      ) : e.teacherName && day && daySchedule !== undefined ? (
        <View style={ss.scheduleEmpty}>
          <Text style={ss.scheduleEmptyTxt}>لا يوجد جدول مدخل لـ {e.teacherName} يوم {day}. </Text>
          <Pressable onPress={() => router.push("/registers/timetable")}>
            <Text style={ss.scheduleLink}>أدخل الجدول ←</Text>
          </Pressable>
        </View>
      ) : null}

      <Row style={{ gap: 10 }}>
        <View style={{ flex: 1 }}><Input label="الصف" value={e.grade} onChangeText={(v) => onPatch({ grade: v })} /></View>
        <View style={{ flex: 1 }}><Input label="الشعبة" value={e.section} onChangeText={(v) => onPatch({ section: v })} /></View>
        <View style={{ flex: 1 }}><Input label="الحصة" value={e.period} onChangeText={(v) => onPatch({ period: v })} /></View>
      </Row>

      {/* اقتراح معلمات الاحتياط — المتاحات فقط */}
      {e.period && day && daySchedule !== undefined ? (
        <View style={ss.suggBox}>
          <Text style={ss.suggTitle}>✅ المعلمات المتاحات للحصة {e.period} (اختاري من يغطّي)</Text>
          <Row style={{ flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {freeTeachersFor(e.period).length === 0 ? (
              <Text style={ss.noSugg}>لا توجد معلمات متاحات في هذه الحصة</Text>
            ) : (
              freeTeachersFor(e.period).map((name) => (
                <Pressable
                  key={name}
                  style={[ss.suggChip, e.coverTeacher === name && ss.suggChipSel]}
                  onPress={() => onPatch({ coverTeacher: name })}
                >
                  <Text style={[ss.suggChipTxt, e.coverTeacher === name && ss.suggChipTxtSel]}>{name}</Text>
                </Pressable>
              ))
            )}
          </Row>
        </View>
      ) : null}

      <Select label="معلمة الاحتياط" options={teacherNames} value={e.coverTeacher} onChange={(v) => onPatch({ coverTeacher: v })} />
      <FieldChips label="طبيعة الخطة المنفذة" options={PLAN_TYPES} value={e.planType} onChange={(v) => onPatch({ planType: v })} />
      <FieldChips label="الملاحظات" options={NOTIFY} value={e.notify} onChange={(v) => onPatch({ notify: v })} />
      <Input label="ملاحظات إضافية" value={e.notes} onChangeText={(v) => onPatch({ notes: v })} multiline />
    </Card>
  );
}

export default function CoverRegister() {
  const list = useQuery(api.registers.listCover, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.registers.createCover);
  const update = useMutation(api.registers.updateCover);
  const remove = useMutation(api.registers.removeCover);

  const params = useLocalSearchParams<{ from?: string; day?: string; absentees?: string }>();
  const prefillNames = (params.absentees ?? "").split("|").map((x) => x.trim()).filter(Boolean);

  const [adding, setAdding] = useState(prefillNames.length > 0);
  const [editing, setEditing] = useState<string | null>(null);
  const [date, setDate] = useState(params.from ?? "");
  const [day, setDay] = useState(params.day ?? "");
  const [entries, setEntries] = useState<Entry[]>(
    prefillNames.length ? prefillNames.map((n) => ({ ...emptyEntry(), teacherName: n, reason: "غياب" })) : [emptyEntry()]
  );

  const teacherNames = (teachers ?? []).map((t) => t.name);
  const daySchedule = useQuery(api.timetable.byDay, day ? { day } : { day: "" });

  const setEntry = (i: number, patch: Partial<Entry>) =>
    setEntries((p) => p.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  // عند اختيار المعلمة الغائبة: تظهر كل حصصها لهذا اليوم تلقائياً كصفوف، يتبقى فقط اختيار من يغطّي
  const handleSelectTeacher = (i: number, name: string) => {
    const slots = (daySchedule ?? [])
      .filter((x) => x.teacherName === name)
      .sort((a, b) => Number(a.period) - Number(b.period));

    if (!name || slots.length === 0) {
      // لا يوجد جدول: عبّئي الاسم فقط
      setEntry(i, { teacherName: name, period: "", grade: "", section: "" });
      return;
    }

    const base = entries[i];
    const rows: Entry[] = slots.map((slot) => {
      const parts = String(slot.className).split("/");
      return {
        ...emptyEntry(),
        teacherName: name,
        reason: base.reason,
        period: slot.period,
        grade: (parts[0] ?? "").trim(),
        section: (parts[1] ?? "").trim(),
      };
    });

    // استبدلي الصف الحالي بكل حصص المعلمة
    setEntries((p) => [...p.slice(0, i), ...rows, ...p.slice(i + 1)]);
  };

  const reset = () => { setAdding(false); setEditing(null); setDate(""); setDay(""); setEntries([emptyEntry()]); };

  const startEdit = (r: any) => {
    setDate(r.date ?? "");
    setDay(r.day ?? "");
    setEntries((r.entries ?? []).length
      ? r.entries.map((e: any) => ({ ...emptyEntry(), ...e }))
      : [emptyEntry()]);
    setEditing(r._id);
    setAdding(true);
  };

  const save = async () => {
    const valid = entries.filter((e) => e.teacherName.trim() && e.coverTeacher.trim());
    if (!date.trim() || valid.length === 0) return;
    if (editing) await update({ id: editing as any, date, day, department: settings?.department, entries: valid });
    else await create({ date, day, department: settings?.department, entries: valid });
    reset();
  };

  if (list === undefined) return <Loading />;

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
        <HeroBtn title="جدول الحصص" icon="grid-outline" onPress={() => router.push("/registers/timetable")} />
      </PageHero>

      {adding && (
        <>
          <Card>
            <H2>{editing ? "تعديل السجل" : "بيانات السجل"}</H2>
            <DateField label="التاريخ" value={date} onChange={(v) => setDate(v)} onDay={(d) => setDay(d)} />
            <Input label="اليوم" value={day} onChangeText={setDay} placeholder="يُملأ تلقائياً من التاريخ" />
            {(list ?? []).length > 0 && (
              <Button title="نسخ حصص آخر سجل" icon="copy-outline" variant="outline" small style={{ alignSelf: "flex-start", marginTop: 4 }}
                onPress={() => {
                  const last = list[0];
                  if (last?.entries?.length) setEntries(last.entries.map((e: any) => ({ ...emptyEntry(), teacherName: e.teacherName, reason: e.reason ?? "غياب", grade: e.grade ?? "", section: e.section ?? "", coverTeacher: e.coverTeacher ?? "", planType: e.planType ?? "مراجعة" })));
                }} />
            )}
          </Card>

          {entries.map((e, i) => (
            <EntryForm
              key={i}
              e={e}
              i={i}
              teacherNames={teacherNames}
              day={day}
              daySchedule={daySchedule}
              canRemove={entries.length > 1}
              onRemove={() => setEntries(entries.filter((_, j) => j !== i))}
              onPatch={(patch) => setEntry(i, patch)}
              onSelectTeacher={(name) => handleSelectTeacher(i, name)}
            />
          ))}

          <Button title="إضافة حصة احتياط أخرى" icon="add" variant="outline" small style={{ alignSelf: "flex-start" }}
            onPress={() => setEntries([...entries, emptyEntry()])} />
          <Row>
            <Button title={editing ? "حفظ التعديل" : "حفظ السجل"} icon="checkmark" onPress={save} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
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
                <ExportMenu run={(m) => { setExportMode(m, `سجل احتياط - ${r.date ?? ""}`); printCoverRegister(r, settings ?? {}); }} />
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

const ss = StyleSheet.create({
  classBanner: {
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#a5d6a7",
    alignItems: "center",
  },
  classBannerTxt: { fontFamily: fonts.bold, fontSize: 15, color: "#1b5e20" },
  classBannerHint: { fontFamily: fonts.regular, fontSize: 11, color: "#66bb6a", marginTop: 2 },
  scheduleBox: {
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#90caf9",
  },
  scheduleTitle: { fontFamily: fonts.bold, fontSize: 13, color: "#1565c0", marginBottom: 8, textAlign: "right" },
  slotBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#1565c0",
    padding: 8,
    alignItems: "center",
    minWidth: 80,
  },
  slotPeriod: { fontFamily: fonts.bold, fontSize: 12, color: "#1565c0" },
  slotClass: { fontFamily: fonts.bold, fontSize: 13, color: "#0d47a1", marginTop: 2 },
  slotSubject: { fontFamily: fonts.regular, fontSize: 11, color: "#1976d2" },
  slotHint: { fontFamily: fonts.regular, fontSize: 10, color: "#90caf9", marginTop: 2 },
  scheduleEmpty: {
    backgroundColor: "#fff8e1",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ffe082",
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  scheduleEmptyTxt: { fontFamily: fonts.regular, fontSize: 12, color: "#f57f17" },
  scheduleLink: { fontFamily: fonts.bold, fontSize: 12, color: "#e65100", textDecorationLine: "underline" },
  suggBox: {
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#a5d6a7",
  },
  suggTitle: { fontFamily: fonts.bold, fontSize: 13, color: "#2e7d32", textAlign: "right" },
  noSugg: { fontFamily: fonts.regular, fontSize: 12, color: "#c62828" },
  suggChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#a5d6a7",
    backgroundColor: "#fff",
  },
  suggChipSel: { backgroundColor: "#2e7d32", borderColor: "#2e7d32" },
  suggChipTxt: { fontFamily: fonts.medium, fontSize: 12, color: "#2e7d32" },
  suggChipTxtSel: { color: "#fff" },
});
