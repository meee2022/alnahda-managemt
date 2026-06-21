import React, { useState } from "react";
import { View, Text } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem } from "../lib/ui";
import { colors, fonts } from "../lib/theme";
import { printTeachersSheet } from "../lib/printTemplates";

const EMPTY = {
  name: "", jobTitle: "معلم المرحلة التأسيسية أدبي", employeeNumber: "", nationality: "قطري",
  specialization: "", subject: "اللغة العربية", grade: "الأول", section: "A",
  yearsTrack: "", yearsTotal: "", followMode: "مباشر", phone: "",
  email: "", license: "", level: "",
};

export default function Teachers() {
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.teachers.create);
  const update = useMutation(api.teachers.update);
  const remove = useMutation(api.teachers.remove);
  const importExcel = useMutation(api.teachers.importFromExcel);

  const runImport = async () => {
    if (typeof window !== "undefined" && !window.confirm("تحديث ودمج بيانات المعلمات من ملف القسم الرسمي (15 معلمة)؟ سيتم تحديث الموجود وإضافة الناقص.")) return;
    const r = await importExcel({});
    if (typeof window !== "undefined") window.alert(`تم: أضيفت ${r.added} معلمة وحُدّثت ${r.updated} من إجمالي ${r.total}.`);
  };

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const reset = () => { setForm({ ...EMPTY }); setAdding(false); setEditing(null); };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) await update({ id: editing as any, ...form });
    else await create(form);
    reset();
  };

  const startEdit = (t: any) => {
    setEditing(t._id); setAdding(false);
    setForm({
      name: t.name ?? "", jobTitle: t.jobTitle ?? "", employeeNumber: t.employeeNumber ?? "",
      nationality: t.nationality ?? "", specialization: t.specialization ?? "", subject: t.subject ?? "اللغة العربية",
      grade: t.grade ?? "الأول", section: t.section ?? "A", yearsTrack: t.yearsTrack ?? "",
      yearsTotal: t.yearsTotal ?? "", followMode: t.followMode ?? "مباشر", phone: t.phone ?? "",
      email: t.email ?? "", license: t.license ?? "", level: t.level ?? "",
    });
  };

  const printList = () => printTeachersSheet(teachers ?? [], settings ?? {});

  if (teachers === undefined) return <Loading />;

  const DataRow = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <Row style={{ justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: 12.5, color: colors.textSecondary }}>{label}</Text>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.text, textAlign: "left" }}>{value}</Text>
      </Row>
    ) : null;

  return (
    <Screen>
      <PageHero
        title="المعلمات"
        desc={`${teachers.length} معلمة في القسم — البيانات تظهر تلقائياً في كل الاستمارات`}
        icon="people"
        gradient={["#5E0E24", "#9A1B3C"]}
      >
        <HeroBtn title="إضافة معلمة" icon="add" prominent onPress={() => { reset(); setAdding(true); }} />
        <HeroBtn title="تحديث من ملف القسم" icon="cloud-download" onPress={runImport} />
        <HeroBtn title="طباعة الكشف" icon="print-outline" onPress={printList} />
      </PageHero>

      {(adding || editing) && (
        <Card>
          <H2>{editing ? "تعديل بيانات معلمة" : "إضافة معلمة جديدة"}</H2>
          <Input label="الاسم الرباعي" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="الرقم الوظيفي" value={form.employeeNumber} onChangeText={(v) => setForm({ ...form, employeeNumber: v })} /></View>
            <View style={{ flex: 1 }}><Input label="الجنسية" value={form.nationality} onChangeText={(v) => setForm({ ...form, nationality: v })} /></View>
          </Row>
          <Input label="المسمى الوظيفي" value={form.jobTitle} onChangeText={(v) => setForm({ ...form, jobTitle: v })} />
          <Input label="التخصص" value={form.specialization} onChangeText={(v) => setForm({ ...form, specialization: v })} />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Select label="المادة" options={["اللغة العربية", "التربية الإسلامية"]} value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} /></View>
          </Row>
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Select label="الصف" options={["الأول", "الثاني"]} value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} /></View>
            <View style={{ flex: 1 }}><Select label="الشعبة" options={["A", "B", "C", "D", "E"]} value={form.section} onChange={(v) => setForm({ ...form, section: v })} /></View>
          </Row>
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="خبرة (مسار)" value={form.yearsTrack} onChangeText={(v) => setForm({ ...form, yearsTrack: v })} keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><Input label="خبرة (عام)" value={form.yearsTotal} onChangeText={(v) => setForm({ ...form, yearsTotal: v })} keyboardType="numeric" /></View>
          </Row>
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Select label="نمط المتابعة" options={["مباشر", "غير مباشر"]} value={form.followMode} onChange={(v) => setForm({ ...form, followMode: v })} /></View>
            <View style={{ flex: 1 }}><Input label="الهاتف" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" /></View>
          </Row>
          <Input label="الإيميل الرسمي" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Select label="حاصلة على الرخصة" options={["نعم", "لا"]} value={form.license} onChange={(v) => setForm({ ...form, license: v })} /></View>
            <View style={{ flex: 1 }}><Select label="المستوى المهني" options={["مستجد", "ممارس", "متمرس", "خبير"]} value={form.level} onChange={(v) => setForm({ ...form, level: v })} /></View>
          </Row>
          <Row>
            <Button title="حفظ" icon="checkmark" small onPress={save} />
            <Button title="إلغاء" variant="ghost" small onPress={reset} />
          </Row>
        </Card>
      )}

      {teachers.length === 0 ? (
        <Empty text="لا توجد معلمات بعد" actionTitle="إضافة معلمة" onAction={() => { reset(); setAdding(true); }} icon="people-outline" />
      ) : teachers.map((t, ti) => {
        const open = expanded === t._id;
        return (
        <AnimatedItem key={t._id} index={ti}>
        <Card style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <P style={{ color: colors.text, fontSize: 15 }}>{t.name}</P>
              <Row style={{ marginTop: 4, flexWrap: "wrap" }}>
                {t.grade ? <Badge label={`${t.grade}${t.section ? " " + t.section : ""}`} tone="primary" /> : null}
                {t.subject ? <Badge label={t.subject} tone="accent" /> : null}
                {t.employeeNumber ? <Badge label={`#${t.employeeNumber}`} tone="muted" /> : null}
              </Row>
            </View>
            <Row>
              <IconBtn name={open ? "chevron-up" : "chevron-down"} color={colors.textSecondary} onPress={() => setExpanded(open ? null : t._id)} />
              <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEdit(t)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: t._id })} />
            </Row>
          </Row>

          {open && (
            <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
              <DataRow label="المسمى الوظيفي" value={t.jobTitle} />
              <DataRow label="الرقم الوظيفي" value={t.employeeNumber} />
              <DataRow label="الجنسية" value={t.nationality} />
              <DataRow label="التخصص" value={t.specialization} />
              <DataRow label="المادة" value={t.subject} />
              <DataRow label="الصف / الشعبة" value={t.grade ? `${t.grade}${t.section ? " / " + t.section : ""}` : undefined} />
              <DataRow label="سنوات الخبرة (مسار)" value={t.yearsTrack} />
              <DataRow label="سنوات الخبرة (عام)" value={t.yearsTotal} />
              <DataRow label="نمط المتابعة" value={t.followMode} />
              <DataRow label="الهاتف" value={t.phone} />
              <DataRow label="الإيميل الرسمي" value={t.email} />
              <DataRow label="الرخصة المهنية" value={t.license} />
              <DataRow label="المستوى المهني" value={t.level} />
              {!t.employeeNumber && !t.specialization ? (
                <P muted style={{ fontSize: 12, marginTop: 6 }}>بيانات هذه المعلمة غير مكتملة — اضغطي ✎ لإكمالها.</P>
              ) : null}
            </View>
          )}
        </Card>
        </AnimatedItem>
        );
      })}
    </Screen>
  );
}
