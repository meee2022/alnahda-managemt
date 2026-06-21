import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, Chip, PageHero, HeroBtn, AnimatedItem } from "../lib/ui";
import { colors } from "../lib/theme";
import { printVisitsSchedule } from "../lib/printTemplates";
import { VISIT_PURPOSES } from "../lib/forms";
import { DateField } from "../lib/pickers";

const MONTHS = ["سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر", "يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو"];

export default function Visits() {
  const [month, setMonth] = useState("مايو");
  const visits = useQuery(api.visits.list, { month });
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.visits.create);
  const update = useMutation(api.visits.update);
  const remove = useMutation(api.visits.remove);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    teacherName: "", grade: "الأول", section: "A", date: "", subject: "اللغة العربية",
    lesson: "", purpose: "متابعة أداء الطلبة", attendanceType: "كلي", status: "مخطط", notes: "",
  });

  const save = async () => {
    if (!form.teacherName || !form.date) return;
    await create({ ...form, month });
    setAdding(false);
    setForm({ ...form, teacherName: "", date: "", lesson: "", notes: "" });
  };

  const printSchedule = () => printVisitsSchedule(visits ?? [], month, settings ?? {});

  return (
    <Screen>
      <PageHero
        title="جدول الزيارات الشهري"
        desc={`تخطيط زيارات المنسقة (بدون تقييم) — شهر ${month}`}
        icon="footsteps"
        gradient={["#B0883A", "#D4B05C"]}
      >
        <HeroBtn title="إضافة زيارة" icon="add" prominent onPress={() => setAdding(!adding)} />
        <HeroBtn title="طباعة الجدول" icon="print-outline" onPress={printSchedule} />
      </PageHero>

      <Card>
        <Row style={{ flexWrap: "wrap" }}>
          {MONTHS.map((m) => <Chip key={m} label={m} active={month === m} onPress={() => setMonth(m)} color={colors.gold} />)}
        </Row>
      </Card>

      {adding && (
        <Card>
          <H2>زيارة صفية جديدة — {month}</H2>
          <Select label="المعلمة" options={(teachers ?? []).map((t) => t.name)} value={form.teacherName} onChange={(v) => setForm({ ...form, teacherName: v })} />
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
          <Button title="حفظ الزيارة" icon="checkmark" onPress={save} />
        </Card>
      )}

      {visits === undefined ? <Loading /> : visits.length === 0 ? (
        <Empty text={`لا توجد زيارات في ${month}`} actionTitle="إضافة زيارة" onAction={() => setAdding(true)} icon="footsteps-outline" />
      ) : visits.map((x, xi) => (
        <AnimatedItem key={x._id} index={xi}>
        <Card style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <P style={{ color: colors.text, fontSize: 15 }}>{x.teacherName} — {x.grade} / {x.section}</P>
              <P muted>{x.subject}{x.lesson ? ` • ${x.lesson}` : ""} • {x.date}</P>
              <Row style={{ marginTop: 4 }}>
                <Badge label={x.status} tone={x.status === "تم" ? "success" : "warning"} />
                {x.attendanceType ? <Badge label={x.attendanceType} tone="muted" /> : null}
              </Row>
            </View>
            <Row>
              {x.status !== "تم" && (
                <IconBtn name="checkmark-circle-outline" color={colors.success} onPress={() => update({ id: x._id, status: "تم" })} />
              )}
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: x._id })} />
            </Row>
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
