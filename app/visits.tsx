import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, Chip, PageHero, HeroBtn, ExportMenu, AnimatedItem } from "../lib/ui";
import { colors } from "../lib/theme";
import { printVisitsSchedule } from "../lib/printTemplates";
import { setExportMode } from "../lib/print";
import { VISIT_PURPOSES } from "../lib/forms";
import { DateField, arabicMonthName } from "../lib/pickers";

const MONTHS = ["سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر", "يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو"];
const normType = (t?: string) => (t === "كلية" ? "كلي" : t === "جزئية" ? "جزئي" : t ?? "");

export default function Visits() {
  const [month, setMonth] = useState("مايو");
  const visits = useQuery(api.visits.list, { month });
  const classVisits = useQuery(api.classVisits.list, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.visits.create);
  const update = useMutation(api.visits.update);
  const remove = useMutation(api.visits.remove);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    teacherName: "", grade: "الأول", section: "A", date: "", subject: "اللغة العربية",
    lesson: "", purpose: "متابعة أداء الطلبة", attendanceType: "كلي", status: "مخطط", notes: "",
  });

  const reset = () => {
    setForm({
      teacherName: "", grade: "الأول", section: "A", date: "", subject: "اللغة العربية",
      lesson: "", purpose: "متابعة أداء الطلبة", attendanceType: "كلي", status: "مخطط", notes: "",
    });
    setAdding(false); setEditing(null);
  };
  const startEdit = (x: any) => {
    setForm({
      teacherName: x.teacherName, grade: x.grade, section: x.section, date: x.date ?? "",
      subject: x.subject, lesson: x.lesson ?? "", purpose: x.purpose ?? "متابعة أداء الطلبة",
      attendanceType: x.attendanceType ?? "كلي", status: x.status, notes: x.notes ?? "",
    });
    setEditing(x._id); setAdding(true);
  };

  const save = async () => {
    if (!form.teacherName || !form.date) return;
    if (editing) await update({ id: editing as any, ...form, month });
    else await create({ ...form, month });
    reset();
  };

  // صفوف تلقائية من الزيارات الصفية المقيّمة لنفس الشهر (تُعبّأ ذاتياً دون إدخال يدوي)
  const planned = visits ?? [];
  const derived = (classVisits ?? [])
    .filter((cv: any) => arabicMonthName(cv.date) === month)
    .filter((cv: any) => !planned.some((p: any) => p.teacherName === cv.teacherName && p.date === cv.date))
    .map((cv: any) => ({
      _id: "cv_" + cv._id, _derived: true,
      teacherName: cv.teacherName, grade: cv.grade, section: cv.section, date: cv.date,
      subject: cv.subject, lesson: cv.lessonTopic ?? "", purpose: "زيارة صفية مقيّمة",
      attendanceType: normType(cv.visitType), status: "تم",
    }));
  const combined = [...planned, ...derived];

  const printSchedule = () => printVisitsSchedule(combined, month, settings ?? {});

  return (
    <Screen>
      <PageHero
        title="جدول الزيارات الشهري"
        desc={`تخطيط زيارات المنسقة (بدون تقييم) — شهر ${month}`}
        icon="footsteps"
        gradient={["#B0883A", "#D4B05C"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "إضافة زيارة"} icon={adding ? "close" : "add"} prominent onPress={() => adding ? reset() : setAdding(true)} />
        <ExportMenu heroTitle="تصدير الجدول" run={(m) => { setExportMode(m, `جدول الزيارات - ${month}`); printSchedule(); }} />
      </PageHero>

      <Card>
        <Row style={{ flexWrap: "wrap" }}>
          {MONTHS.map((m) => <Chip key={m} label={m} active={month === m} onPress={() => setMonth(m)} color={colors.gold} />)}
        </Row>
      </Card>

      {adding && (
        <Card>
          <H2>{editing ? `تعديل الزيارة — ${month}` : `زيارة صفية جديدة — ${month}`}</H2>
          <Select label="المعلمة" options={(teachers ?? []).map((t) => t.name)} value={form.teacherName}
            onChange={(v) => {
              const t = (teachers ?? []).find((x) => x.name === v) as any;
              setForm((p) => ({ ...p, teacherName: v, grade: t?.grade ?? p.grade, section: t?.section ?? p.section, subject: t?.subject ?? p.subject }));
            }} />
          <Row>
            <View style={{ flex: 1 }}>
              <Select label="الصف" options={["الأول", "الثاني"]} value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} />
            </View>
          </Row>
          <Select label="الشعبة" options={["A", "B", "C", "D", "E"]} value={form.section} onChange={(v) => setForm({ ...form, section: v })} />
          <DateField label="التاريخ" value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} />
          <Select label="المادة" options={["اللغة العربية", "التربية الإسلامية"]} value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
          <Input label="عنوان الدرس / المهارة" value={form.lesson} onChangeText={(v) => setForm({ ...form, lesson: v })} />
          <Select label="هدف الزيارة" options={VISIT_PURPOSES} value={form.purpose} onChange={(v) => setForm({ ...form, purpose: v })} />
          <Select label="نوع الحضور" options={["كلي", "جزئي"]} value={form.attendanceType} onChange={(v) => setForm({ ...form, attendanceType: v })} />
          <Input label="ملاحظات" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
          <Row>
            <Button title={editing ? "حفظ التعديل" : "حفظ الزيارة"} icon="checkmark" onPress={save} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
        </Card>
      )}

      {visits === undefined ? <Loading /> : combined.length === 0 ? (
        <Empty text={`لا توجد زيارات في ${month}`} actionTitle="إضافة زيارة" onAction={() => setAdding(true)} icon="footsteps-outline" />
      ) : combined.map((x: any, xi: number) => (
        <AnimatedItem key={x._id} index={xi}>
        <Card style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <P style={{ color: colors.text, fontSize: 15 }}>{x.teacherName} — {x.grade} / {x.section}</P>
              <P muted>{x.subject}{x.lesson ? ` • ${x.lesson}` : ""} • {x.date}</P>
              <Row style={{ marginTop: 4, flexWrap: "wrap" }}>
                <Badge label={x.status} tone={x.status === "تم" ? "success" : "warning"} />
                {x.attendanceType ? <Badge label={x.attendanceType} tone="muted" /> : null}
                {x._derived ? <Badge label="تلقائي من تقييم الزيارة" tone="accent" /> : null}
              </Row>
            </View>
            {x._derived ? null : (
            <Row>
              {x.status !== "تم" && (
                <IconBtn name="checkmark-circle-outline" color={colors.success} onPress={() => update({ id: x._id, status: "تم" })} />
              )}
              <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEdit(x)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: x._id })} />
            </Row>
            )}
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
