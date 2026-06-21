import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { ANNUAL_INDICATORS, annualLevel } from "../../lib/forms";
import { printAnnualEvaluation } from "../../lib/printTemplates";

export default function AnnualEvaluations() {
  const evals = useQuery(api.evaluations.listAnnual, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.evaluations.createAnnual);
  const remove = useMutation(api.evaluations.removeAnnual);

  const [adding, setAdding] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [personalNo, setPersonalNo] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [penalties, setPenalties] = useState<{ type: string; reason: string; date: string }[]>([]);
  const [courses, setCourses] = useState<{ name: string; place: string; duration: string; date: string }[]>([]);

  const total = ANNUAL_INDICATORS.reduce((sum, ind) => sum + (scores[ind.code] ?? ind.maxScore), 0);
  const maxTotal = ANNUAL_INDICATORS.reduce((s, i) => s + i.maxScore, 0);
  const pct = Math.round((total / maxTotal) * 100);

  const save = async () => {
    if (!teacherName) return;
    await create({
      teacherName, personalNo, appointmentDate,
      year: settings?.academicYear ?? "2025-2026",
      penalties: penalties.filter((p) => p.type.trim()),
      courses: courses.filter((c) => c.name.trim()),
      indicators: ANNUAL_INDICATORS.map((i) => ({ domain: i.domain, indicator: i.indicator, code: i.code, maxScore: i.maxScore, score: scores[i.code] ?? i.maxScore })),
      total: pct,
      levelLabel: annualLevel(pct),
      notes,
    });
    setAdding(false); setScores({}); setNotes(""); setPenalties([]); setCourses([]); setPersonalNo(""); setAppointmentDate("");
  };

  const printEval = (e: any) => printAnnualEvaluation(e, settings ?? {});

  if (evals === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="تقييم الأداء السنوي"
        desc="استمارة الوزارة الرسمية — 34 مؤشراً والدرجة تُحسب تلقائياً من 100"
        icon="ribbon"
        gradient={["#B0883A", "#D4B05C"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "تقييم سنوي جديد"} icon={adding ? "close" : "add"} prominent onPress={() => setAdding(!adding)} />
      </PageHero>

      {adding && (
        <Card>
          <H2>تقييم أداء سنوي جديد</H2>
          <Select label="المعلمة" options={(teachers ?? []).map((t) => t.name)} value={teacherName} onChange={setTeacherName} />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="الرقم الشخصي" value={personalNo} onChangeText={setPersonalNo} /></View>
            <View style={{ flex: 1 }}><Input label="تاريخ التعيين" value={appointmentDate} onChangeText={setAppointmentDate} placeholder="مثال: 2020-09-01" /></View>
          </Row>

          <H2>الجزاءات التأديبية التي وقعت على الموظف خلال سنة التقييم</H2>
          {penalties.map((p, i) => (
            <Card key={i} style={{ backgroundColor: colors.primarySoft, marginBottom: 8 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <P muted>جزاء {i + 1}</P>
                <IconBtn name="close-circle-outline" color={colors.danger} onPress={() => setPenalties(penalties.filter((_, j) => j !== i))} />
              </Row>
              <Input label="نوع الجزاء" value={p.type} onChangeText={(v) => setPenalties(penalties.map((x, j) => j === i ? { ...x, type: v } : x))} />
              <Input label="سبب الجزاء" value={p.reason} onChangeText={(v) => setPenalties(penalties.map((x, j) => j === i ? { ...x, reason: v } : x))} />
              <Input label="تاريخ الجزاء" value={p.date} onChangeText={(v) => setPenalties(penalties.map((x, j) => j === i ? { ...x, date: v } : x))} />
            </Card>
          ))}
          <Button title="إضافة جزاء" icon="add" variant="outline" small onPress={() => setPenalties([...penalties, { type: "", reason: "", date: "" }])} style={{ marginBottom: 12, alignSelf: "flex-start" }} />

          <H2>الدورات التدريبية التي حصل عليها الموظف خلال سنة التقييم</H2>
          {courses.map((c, i) => (
            <Card key={i} style={{ backgroundColor: colors.primarySoft, marginBottom: 8 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <P muted>دورة {i + 1}</P>
                <IconBtn name="close-circle-outline" color={colors.danger} onPress={() => setCourses(courses.filter((_, j) => j !== i))} />
              </Row>
              <Input label="اسم الدورة" value={c.name} onChangeText={(v) => setCourses(courses.map((x, j) => j === i ? { ...x, name: v } : x))} />
              <Input label="مكان الانعقاد" value={c.place} onChangeText={(v) => setCourses(courses.map((x, j) => j === i ? { ...x, place: v } : x))} />
              <Row style={{ gap: 10 }}>
                <View style={{ flex: 1 }}><Input label="المدة" value={c.duration} onChangeText={(v) => setCourses(courses.map((x, j) => j === i ? { ...x, duration: v } : x))} /></View>
                <View style={{ flex: 1 }}><Input label="التاريخ" value={c.date} onChangeText={(v) => setCourses(courses.map((x, j) => j === i ? { ...x, date: v } : x))} /></View>
              </Row>
            </Card>
          ))}
          <Button title="إضافة دورة" icon="add" variant="outline" small onPress={() => setCourses([...courses, { name: "", place: "", duration: "", date: "" }])} style={{ marginBottom: 12, alignSelf: "flex-start" }} />

          <H2>مؤشرات الأداء</H2>
          {ANNUAL_INDICATORS.map((ind) => (
            <Row key={ind.code} style={{ justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <P style={{ flex: 1, fontSize: 13 }}>{ind.code} — {ind.indicator}</P>
              <Row>
                {Array.from({ length: ind.maxScore + 1 }, (_, n) => (
                  <Pressable key={n} onPress={() => setScores({ ...scores, [ind.code]: n })}
                    style={[styles.scoreBtn, (scores[ind.code] ?? ind.maxScore) === n && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Text style={[styles.scoreText, (scores[ind.code] ?? ind.maxScore) === n && { color: colors.white }]}>{n}</Text>
                  </Pressable>
                ))}
              </Row>
            </Row>
          ))}
          <Card style={{ backgroundColor: colors.primarySoft, marginTop: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <H2>النتيجة: {pct} / 100</H2>
              <Badge label={annualLevel(pct)} tone={pct >= 90 ? "success" : pct >= 76 ? "primary" : "warning"} />
            </Row>
          </Card>
          <Input label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
          <Button title="حفظ التقييم" icon="checkmark" onPress={save} />
        </Card>
      )}

      {evals.length === 0 ? (
        <Empty text="لا توجد تقييمات سنوية بعد" actionTitle="تقييم جديد" onAction={() => setAdding(true)} icon="ribbon-outline" />
      ) : evals.map((e, ei) => (
        <AnimatedItem key={e._id} index={ei}>
        <Card style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <P style={{ color: colors.text, fontSize: 15 }}>{e.teacherName}</P>
              <Row style={{ marginTop: 4 }}>
                <Badge label={`${e.total}%`} tone={e.total >= 90 ? "success" : "primary"} />
                <Badge label={e.levelLabel ?? ""} tone="accent" />
                <Badge label={e.year} tone="muted" />
              </Row>
            </View>
            <Row>
              <IconBtn name="print-outline" color={colors.primary} onPress={() => printEval(e)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: e._id })} />
            </Row>
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scoreBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginHorizontal: 1.5 },
  scoreText: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: 13 },
});
