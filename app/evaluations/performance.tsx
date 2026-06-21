import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useDraft } from "../../lib/useDraft";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem } from "../../lib/ui";
import { colors, fonts, radius } from "../../lib/theme";
import { PERF_DOMAINS, PERF_ALL_CODES, SCORE_OPTIONS } from "../../lib/forms";
import { Chip } from "../../lib/ui";
import { DateField, TimeField, Stepper } from "../../lib/pickers";
import { printPerformanceVisit } from "../../lib/printTemplates";
import { SourceFileBtn } from "../../lib/sourceFile";

export default function Performance() {
  const visits = useQuery(api.performance.list, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const bank = useQuery(api.performance.listBank, {});
  const create = useMutation(api.performance.create);
  const remove = useMutation(api.performance.remove);
  const addBank = useMutation(api.performance.addBank);
  const removeBank = useMutation(api.performance.removeBank);

  const [adding, setAdding] = useState(false);
  const [info, setInfo] = useState({
    date: "", day: "", subject: "اللغة العربية", unit: "", lessonTitle: "", visitType: "كلي",
    visitNumber: "", startTime: "", endTime: "", followMode: "مباشر",
    teacherName: "", employeeNo: "", jobTitle: "معلم المرحلة التأسيسية أدبي", nationality: "", specialization: "",
    grade: "الأول", section: "A", yearsTrack: "", yearsTotal: "",
    deputyName: "", feedbackAttendance: "تم", deputyNotes: "",
    generalRecommendations: "", nextSteps: "", trainingNeeds: "", additionalNotes: "",
    coordinatorName: "", discussionTime: "", teacherAttended: "نعم", sendDate: "",
  });
  const [scores, setScores] = useState<Record<string, number>>({});
  const [recs, setRecs] = useState<Record<string, string>>({});
  const [bankOpenFor, setBankOpenFor] = useState<string | null>(null);

  // حفظ المسودة تلقائياً (متصفح) — استعادة اختيارية
  const draft = useDraft<{ info: any; scores: any; recs: any }>("perf-draft-v1");
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (adding) draft.save({ info, scores, recs });
  }, [adding, info, scores, recs]);

  const reset = () => {
    setInfo({ ...info, date: "", lessonTitle: "", unit: "", teacherName: "", employeeNo: "",
      generalRecommendations: "", nextSteps: "", trainingNeeds: "", additionalNotes: "" });
    setScores({}); setRecs({}); setBankOpenFor(null); setAdding(false); draft.clear(); setRestored(true);
  };

  const save = async () => {
    if (!info.teacherName || !info.date) return;
    await create({
      date: info.date, day: info.day, subject: info.subject, unit: info.unit, lessonTitle: info.lessonTitle,
      visitType: info.visitType, visitNumber: info.visitNumber, startTime: info.startTime, endTime: info.endTime,
      teacherName: info.teacherName, employeeNo: info.employeeNo, jobTitle: info.jobTitle,
      nationality: info.nationality, specialization: info.specialization,
      grade: info.grade, section: info.section, yearsTrack: info.yearsTrack, yearsTotal: info.yearsTotal,
      followMode: info.followMode,
      deputyName: info.deputyName, feedbackAttendance: info.feedbackAttendance, deputyNotes: info.deputyNotes,
      indicators: PERF_ALL_CODES.map((code) => ({ code, score: scores[code] ?? -1, recommendation: recs[code] ?? "" })),
      generalRecommendations: info.generalRecommendations, nextSteps: info.nextSteps,
      trainingNeeds: info.trainingNeeds, additionalNotes: info.additionalNotes,
      coordinatorName: info.coordinatorName || settings?.coordinator, discussionTime: info.discussionTime,
      teacherAttended: info.teacherAttended, sendDate: info.sendDate,
    });
    reset();
  };

  const bankFor = (code: string) => (bank ?? []).filter((b) => b.code === code || b.code === "عام");

  const measured = PERF_ALL_CODES.filter((c) => scores[c] !== undefined && scores[c] >= 0);
  const total = measured.reduce((s, c) => s + (scores[c] ?? 0), 0);
  const max = measured.length * 3;
  const pct = max ? Math.round((total / max) * 100) : 0;

  if (visits === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="استمارة متابعة أداء معلم"
        desc="النموذج التأسيسي الكامل · 26 مؤشراً بتوصية لكل مؤشر · مع بنك التوصيات"
        icon="document-attach"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "استمارة جديدة"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
      </PageHero>

      {adding && (
        <>
          {draft.saved && !restored ? (
            <Card style={{ backgroundColor: colors.goldSoft, borderColor: colors.gold, borderWidth: 1 }}>
              <P style={{ fontSize: 13 }}>لديكِ مسودة محفوظة من جلسة سابقة. هل تريدين استعادتها؟</P>
              <Row>
                <Button title="استعادة المسودة" icon="refresh" small onPress={() => {
                  const d: any = draft.saved; if (d?.info) setInfo(d.info); if (d?.scores) setScores(d.scores); if (d?.recs) setRecs(d.recs); setRestored(true);
                }} />
                <Button title="تجاهل" variant="ghost" small onPress={() => { draft.clear(); setRestored(true); }} />
              </Row>
            </Card>
          ) : null}
          {/* المعلومات الأساسية */}
          <Card>
            <H2>المعلومات الأساسية</H2>
            <Select label="اسم المعلم (الرباعي)" options={(teachers ?? []).map((t) => t.name)} value={info.teacherName}
              onChange={(v) => {
                const t = (teachers ?? []).find((x) => x.name === v) as any;
                setInfo((p) => ({
                  ...p, teacherName: v,
                  employeeNo: t?.employeeNumber ?? p.employeeNo,
                  nationality: t?.nationality ?? p.nationality,
                  specialization: t?.specialization ?? p.specialization,
                  jobTitle: t?.jobTitle ?? p.jobTitle,
                  subject: t?.subject ?? p.subject,
                  grade: t?.grade ?? p.grade,
                  section: t?.section ?? p.section,
                  yearsTrack: t?.yearsTrack ?? p.yearsTrack,
                  yearsTotal: t?.yearsTotal ?? p.yearsTotal,
                }));
              }} />
            <DateField label="التاريخ" value={info.date}
              onChange={(v) => setInfo((p) => ({ ...p, date: v }))} onDay={(d) => setInfo((p) => ({ ...p, day: d }))} />
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><Select label="المادة" options={["اللغة العربية", "التربية الإسلامية"]} value={info.subject} onChange={(v) => setInfo({ ...info, subject: v })} /></View>
              <View style={{ flex: 1 }}><Input label="الوحدة" value={info.unit} onChangeText={(v) => setInfo({ ...info, unit: v })} /></View>
            </Row>
            <Input label="عنوان الدرس" value={info.lessonTitle} onChangeText={(v) => setInfo({ ...info, lessonTitle: v })} />
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><Select label="نوع الزيارة" options={["كلي", "جزئي"]} value={info.visitType} onChange={(v) => setInfo({ ...info, visitType: v })} /></View>
              <View style={{ flex: 1 }}><Stepper label="رقم الزيارة" value={info.visitNumber} onChange={(v) => setInfo({ ...info, visitNumber: v })} min={1} max={12} /></View>
            </Row>
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><TimeField label="وقت البدء" value={info.startTime} onChange={(v) => setInfo({ ...info, startTime: v })} /></View>
              <View style={{ flex: 1 }}><TimeField label="وقت الانتهاء" value={info.endTime} onChange={(v) => setInfo({ ...info, endTime: v })} /></View>
            </Row>
          </Card>

          {/* بيانات المعلم */}
          <Card>
            <H2>بيانات خاصة بالمعلم</H2>
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="الرقم الوظيفي" value={info.employeeNo} onChangeText={(v) => setInfo({ ...info, employeeNo: v })} /></View>
              <View style={{ flex: 1 }}><Input label="الجنسية" value={info.nationality} onChangeText={(v) => setInfo({ ...info, nationality: v })} /></View>
            </Row>
            <Input label="المسمى الوظيفي" value={info.jobTitle} onChangeText={(v) => setInfo({ ...info, jobTitle: v })} />
            <Input label="التخصص" value={info.specialization} onChangeText={(v) => setInfo({ ...info, specialization: v })} />
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><Select label="الصف" options={["الأول", "الثاني"]} value={info.grade} onChange={(v) => setInfo({ ...info, grade: v })} /></View>
              <View style={{ flex: 1 }}><Select label="الشعبة" options={["A", "B", "C", "D", "E"]} value={info.section} onChange={(v) => setInfo({ ...info, section: v })} /></View>
            </Row>
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="سنوات الخبرة (مسار)" value={info.yearsTrack} onChangeText={(v) => setInfo({ ...info, yearsTrack: v })} /></View>
              <View style={{ flex: 1 }}><Input label="سنوات الخبرة (عام)" value={info.yearsTotal} onChangeText={(v) => setInfo({ ...info, yearsTotal: v })} /></View>
            </Row>
          </Card>

          {/* بيانات النائب */}
          <Card>
            <H2>بيانات خاصة بالنائب الأكاديمي</H2>
            <Input label="اسم النائب الرباعي" value={info.deputyName} onChangeText={(v) => setInfo({ ...info, deputyName: v })} placeholder={settings?.academicDeputy} />
            <Select label="حضور التغذية الراجعة" options={["تم", "لم يتم"]} value={info.feedbackAttendance} onChange={(v) => setInfo({ ...info, feedbackAttendance: v })} />
            <Input label="ملاحظات" value={info.deputyNotes} onChangeText={(v) => setInfo({ ...info, deputyNotes: v })} multiline />
          </Card>

          {/* مجالات المتابعة */}
          {PERF_DOMAINS.map((d) => (
            <Card key={d.domain}>
              <H2 >{d.domain}</H2>
              {d.indicators.map((ind) => {
                const items = bankFor(ind.code);
                const open = bankOpenFor === ind.code;
                return (
                  <View key={ind.code} style={styles.indBlock}>
                    <P style={{ fontSize: 13, color: colors.text, marginBottom: 8 }}>{ind.code} {ind.text}</P>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      {SCORE_OPTIONS.map((o) => (
                        <Chip key={o.v} label={o.label} active={scores[ind.code] === o.v} onPress={() => setScores({ ...scores, [ind.code]: o.v })} />
                      ))}
                    </View>
                    <Input placeholder="التوصية / الملاحظة لهذا المؤشر…" value={recs[ind.code] ?? ""}
                      onChangeText={(v) => setRecs({ ...recs, [ind.code]: v })} multiline />
                    <Row style={{ gap: 6, flexWrap: "wrap" }}>
                      <Button title="اقترح" icon="sparkles" small
                        onPress={() => {
                          const cur = (recs[ind.code] ?? "").trim();
                          const pool = items.filter((b) => !cur.includes(b.text));
                          const ex = pool.find((b) => b.code === ind.code) ?? pool[0];
                          if (ex) setRecs({ ...recs, [ind.code]: (cur ? cur + "\n" : "") + ex.text });
                        }} />
                      <Button title={`من البنك${items.length ? ` (${items.length})` : ""}`} icon="albums-outline" variant="outline" small
                        onPress={() => setBankOpenFor(open ? null : ind.code)} />
                      <Button title="حفظ بالبنك" icon="bookmark-outline" variant="ghost" small
                        onPress={() => { const t = (recs[ind.code] ?? "").trim(); if (t) addBank({ code: ind.code, text: t }); }} />
                    </Row>
                    {open && (
                      <Card style={{ backgroundColor: colors.bg, marginTop: 8 }}>
                        <P muted style={{ fontSize: 12, marginBottom: 6 }}>اختر فقرة لإدراجها (المؤشر {ind.code} + العام):</P>
                        {items.length === 0 ? <P muted style={{ fontSize: 12.5 }}>لا توجد فقرات محفوظة بعد — اكتب توصية واضغط «حفظ بالبنك».</P> :
                          items.map((b) => (
                            <Row key={b._id} style={{ justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                              <Pressable style={{ flex: 1 }} onPress={() => { const cur = (recs[ind.code] ?? "").trim(); if (!cur.includes(b.text)) setRecs({ ...recs, [ind.code]: (cur ? cur + "\n" : "") + b.text }); }}>
                                <P style={{ fontSize: 12.5 }}>{b.text}</P>
                                {b.code === "عام" ? <Badge label="عام" tone="muted" /> : null}
                              </Pressable>
                              <IconBtn name="trash-outline" color={colors.danger} onPress={() => removeBank({ id: b._id })} />
                            </Row>
                          ))}
                      </Card>
                    )}
                  </View>
                );
              })}
            </Card>
          ))}

          <Card style={{ backgroundColor: colors.primarySoft }}>
            <Row style={{ justifyContent: "space-between" }}>
              <H2>نسبة الأداء (للمقاس): {pct}%</H2>
              <Badge label={`${total} / ${max}`} tone="primary" />
            </Row>
          </Card>

          {/* الأقسام الختامية */}
          <Card>
            <H2>التوصيات الختامية</H2>
            <Input label="التوصيات العامة" value={info.generalRecommendations} onChangeText={(v) => setInfo({ ...info, generalRecommendations: v })} multiline />
            <Input label="الخطوات القادمة" value={info.nextSteps} onChangeText={(v) => setInfo({ ...info, nextSteps: v })} multiline />
            <Input label="الاحتياجات التدريبية" value={info.trainingNeeds} onChangeText={(v) => setInfo({ ...info, trainingNeeds: v })} multiline />
            <Input label="ملاحظات إضافية" value={info.additionalNotes} onChangeText={(v) => setInfo({ ...info, additionalNotes: v })} multiline />
          </Card>

          <Card>
            <H2>المناقشة والتوقيع</H2>
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><TimeField label="وقت المناقشة" value={info.discussionTime} onChange={(v) => setInfo({ ...info, discussionTime: v })} /></View>
              <View style={{ flex: 1 }}><Select label="حضر/ت المعلم/ة المناقشة" options={["نعم", "لا"]} value={info.teacherAttended} onChange={(v) => setInfo({ ...info, teacherAttended: v })} /></View>
            </Row>
            <DateField label="تاريخ إرسال الاستمارة" value={info.sendDate} onChange={(v) => setInfo((p) => ({ ...p, sendDate: v }))} />
            <Button title="حفظ الاستمارة" icon="checkmark" onPress={save} />
          </Card>
        </>
      )}

      {!adding && (visits.length === 0 ? (
        <Empty text="لا توجد استمارات أداء بعد" actionTitle="استمارة جديدة" onAction={() => setAdding(true)} icon="document-attach-outline" />
      ) : visits.map((v, vi) => {
        const m = (v.indicators ?? []).filter((x: any) => x.score >= 0);
        const t = m.reduce((s: number, x: any) => s + x.score, 0);
        const mx = m.length * 3;
        return (
          <AnimatedItem key={v._id} index={vi}>
            <Card style={{ paddingVertical: 12 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <P style={{ color: colors.text, fontSize: 15 }}>{v.teacherName}</P>
                  <P muted style={{ fontSize: 12.5 }}>{v.subject} • {v.grade} {v.section} • {v.date}{v.unit ? ` • ${v.unit}` : ""}</P>
                  <Row style={{ marginTop: 4 }}>
                    <Badge label={v.visitType} tone="accent" />
                    {mx ? <Badge label={`${Math.round((t / mx) * 100)}%`} tone="success" /> : null}
                  </Row>
                </View>
                <Row>
                  <SourceFileBtn storageId={(v as any).sourceFileId} />
                  <IconBtn name="print-outline" color={colors.primary} onPress={() => printPerformanceVisit(v, settings ?? {})} />
                  <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: v._id })} />
                </Row>
              </Row>
            </Card>
          </AnimatedItem>
        );
      }))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  indBlock: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  sBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  sTxt: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: 13 },
});
