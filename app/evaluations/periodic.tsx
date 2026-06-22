import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem, ExportMenu } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { PERIODIC_DOMAINS, MONTHS } from "../../lib/forms";
import { setExportMode } from "../../lib/print";
import { printPeriodicReport } from "../../lib/printTemplates";

export default function PeriodicReports() {
  const reports = useQuery(api.evaluations.listPeriodic, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.evaluations.createPeriodic);
  const update = useMutation(api.evaluations.updatePeriodic);
  const remove = useMutation(api.evaluations.removePeriodic);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [month, setMonth] = useState("مايو");
  const [notes, setNotes] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [noteByPractice, setNoteByPractice] = useState<Record<string, string>>({});

  const allPractices = PERIODIC_DOMAINS.flatMap((d) => d.practices.map((p) => ({ domain: d.domain, practice: p })));

  const reset = () => { setTeacherName(""); setMonth("مايو"); setNotes(""); setScores({}); setNoteByPractice({}); setAdding(false); setEditing(null); };

  const startEdit = (r: any) => {
    setEditing(r._id); setAdding(false);
    setTeacherName(r.teacherName ?? "");
    setMonth(r.month ?? "مايو");
    setNotes(r.generalNotes ?? "");
    const m: Record<string, number> = {};
    const n: Record<string, string> = {};
    (r.scores ?? []).forEach((s: any) => { m[s.practice] = s.score; if (s.note) n[s.practice] = s.note; });
    setScores(m); setNoteByPractice(n);
  };

  const save = async () => {
    if (!teacherName) return;
    const payload = {
      teacherName, month, generalNotes: notes,
      scores: allPractices.map((x) => ({ domain: x.domain, practice: x.practice, score: scores[x.practice] ?? 0, note: noteByPractice[x.practice] || undefined })),
    };
    if (editing) await update({ id: editing as any, month: payload.month, generalNotes: payload.generalNotes, scores: payload.scores });
    else await create(payload);
    reset();
  };

  const printReport = (r: any) => printPeriodicReport(r, settings ?? {});

  if (reports === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="التقرير الدوري للمعلمات"
        desc="تقييم شهري بمقياس 1-3 على أربعة مجالات — يُطبع بنفس الاستمارة الرسمية"
        icon="clipboard"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "تقرير دوري جديد"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
      </PageHero>

      {(adding || editing) && (
        <Card>
          <H2>{editing ? "تعديل التقرير الدوري" : "تقرير دوري جديد"}</H2>
          <Select label="المعلمة" options={(teachers ?? []).map((t) => t.name)} value={teacherName} onChange={setTeacherName} />
          <Select label="الشهر" options={MONTHS} value={month} onChange={setMonth} />
          {PERIODIC_DOMAINS.map((d) => (
            <View key={d.domain} style={{ marginBottom: 10 }}>
              <Text style={styles.domain}>{d.domain}</Text>
              {d.practices.map((p) => (
                <View key={p} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <P style={{ flex: 1, fontSize: 13 }}>{p}</P>
                    <Row>
                      {[1, 2, 3].map((n) => (
                        <Pressable key={n} onPress={() => setScores({ ...scores, [p]: n })}
                          style={[styles.scoreBtn, scores[p] === n && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                          <Text style={[styles.scoreText, scores[p] === n && { color: colors.white }]}>{n}</Text>
                        </Pressable>
                      ))}
                    </Row>
                  </Row>
                  <Input placeholder="ملاحظة على هذا البند (اختياري)" value={noteByPractice[p] ?? ""} onChangeText={(v) => setNoteByPractice({ ...noteByPractice, [p]: v })} />
                </View>
              ))}
            </View>
          ))}
          <P muted style={{ fontSize: 12, marginBottom: 8 }}>مفتاح التقييم: 3 = مستكمل الأدلة • 2 = معظم الأدلة متوفرة • 1 = بعض الأدلة متوفرة</P>
          <Input label="ملاحظات عامة" value={notes} onChangeText={setNotes} multiline />
          <Row style={{ gap: 10 }}>
            <Button title={editing ? "حفظ التعديلات" : "حفظ التقرير"} icon="checkmark" onPress={save} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
        </Card>
      )}

      {reports.length === 0 ? (
        <Empty text="لا توجد تقارير دورية بعد" actionTitle="تقرير جديد" onAction={() => setAdding(true)} icon="clipboard-outline" />
      ) : reports.map((r, ri) => (
        <AnimatedItem key={r._id} index={ri}>
        <Card style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <P style={{ color: colors.text, fontSize: 15 }}>{r.teacherName}</P>
              <Badge label={`شهر ${r.month}`} tone="primary" />
            </View>
            <Row>
              <ExportMenu run={(m) => { setExportMode(m, `تقرير دوري - ${r.teacherName ?? ""}`); printPeriodicReport(r, settings ?? {}); }} />
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

const styles = StyleSheet.create({
  domain: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent, textAlign: "right", marginVertical: 8 },
  scoreBtn: { width: 32, height: 32, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginHorizontal: 2 },
  scoreText: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: 14 },
});
