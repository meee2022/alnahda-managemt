import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, Chip, PageHero, HeroBtn, AnimatedItem } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { CLASS_VISIT_DOMAINS, CLASS_VISIT_FOLLOWUP, CLASS_VISIT_SCALE, SCORE_OPTIONS } from "../../lib/forms";
import { DateField } from "../../lib/pickers";
import { printClassVisit } from "../../lib/printTemplates";
import { SourceFileBtn } from "../../lib/sourceFile";

const ALL = CLASS_VISIT_DOMAINS.flatMap((d) => d.indicators.map((i) => i.code));

export default function ClassVisit() {
  const visits = useQuery(api.classVisits.list, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.classVisits.create);
  const update = useMutation(api.classVisits.update);
  const remove = useMutation(api.classVisits.remove);
  const bank = useQuery(api.performance.listBank, {});
  const addBank = useMutation(api.performance.addBank);
  const removeBank = useMutation(api.performance.removeBank);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    teacherName: "", subject: "اللغة العربية", grade: "الأول", section: "A",
    date: "", lessonTopic: "", visitor: "", visitType: "كلية",
  });
  const [scores, setScores] = useState<Record<string, number>>({});
  const [indRecs, setIndRecs] = useState<Record<string, string>>({});
  const [bankOpenFor, setBankOpenFor] = useState<string | null>(null);
  const [followup, setFollowup] = useState<string[]>([]);
  const [recs, setRecs] = useState("");

  const reset = () => { setForm({ teacherName: "", subject: "اللغة العربية", grade: "الأول", section: "A", date: "", lessonTopic: "", visitor: "", visitType: "كلية" }); setScores({}); setIndRecs({}); setBankOpenFor(null); setFollowup([]); setRecs(""); setAdding(false); setEditing(null); };

  const startEdit = (v: any) => {
    setEditing(v._id); setAdding(false); setBankOpenFor(null);
    setForm({
      teacherName: v.teacherName ?? "", subject: v.subject ?? "اللغة العربية",
      grade: v.grade ?? "الأول", section: v.section ?? "A", date: v.date ?? "",
      lessonTopic: v.lessonTopic ?? "", visitor: v.visitor ?? "", visitType: v.visitType ?? "كلية",
    });
    const sc: Record<string, number> = {};
    const rc: Record<string, string> = {};
    (v.scores ?? []).forEach((s: any) => { sc[s.code] = s.score; if (s.recommendation) rc[s.code] = s.recommendation; });
    setScores(sc); setIndRecs(rc);
    setFollowup([...(v.followup ?? [])]);
    setRecs(v.recommendations ?? "");
  };

  const bankFor = (code: string) => (bank ?? []).filter((b) => b.code === code || b.code === "عام");

  const save = async () => {
    if (!form.teacherName || !form.date) return;
    const payload = {
      ...form,
      scores: ALL.map((code) => ({ code, score: scores[code] ?? -1, recommendation: indRecs[code] ?? "" })),
      followup,
      recommendations: recs,
    };
    if (editing) await update({ id: editing as any, ...payload });
    else await create(payload);
    reset();
  };

  // حساب نسبة الإنجاز للمؤشرات المقيّمة
  const measured = ALL.filter((c) => scores[c] !== undefined && scores[c] >= 0);
  const total = measured.reduce((s, c) => s + (scores[c] ?? 0), 0);
  const max = measured.length * 3;
  const pct = max ? Math.round((total / max) * 100) : 0;

  const toggleFollow = (f: string) => setFollowup((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  if (visits === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="استمارة تقييم الزيارة"
        desc="تقييم الزيارة الصفية بـ 22 مؤشراً + التوصيات — مطابقة لاستمارة الوزارة"
        icon="eye"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "زيارة صفية جديدة"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
      </PageHero>

      {(adding || editing) && (
        <Card>
          <H2>{editing ? "تعديل استمارة الزيارة" : "المعلومات الأساسية"}</H2>
          <Select label="اسم المعلم" options={(teachers ?? []).map((t) => t.name)} value={form.teacherName}
            onChange={(v) => {
              const t = (teachers ?? []).find((x) => x.name === v) as any;
              setForm((p) => ({
                ...p, teacherName: v,
                subject: t?.subject ?? p.subject,
                grade: t?.grade ?? p.grade,
                section: t?.section ?? p.section,
              }));
            }} />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Select label="المادة" options={["اللغة العربية", "التربية الإسلامية"]} value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} /></View>
          </Row>
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Select label="الصف" options={["الأول", "الثاني"]} value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} /></View>
            <View style={{ flex: 1 }}><Select label="الشعبة" options={["A", "B", "C", "D", "E"]} value={form.section} onChange={(v) => setForm({ ...form, section: v })} /></View>
          </Row>
          <DateField label="اليوم / التاريخ" value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} />
          <Input label="موضوع الدرس" value={form.lessonTopic} onChangeText={(v) => setForm({ ...form, lessonTopic: v })} />
          <Input label="الزائر" value={form.visitor} onChangeText={(v) => setForm({ ...form, visitor: v })} placeholder={settings?.coordinator ?? "المنسقة"} />
          <Select label="نوع الزيارة" options={["كلية", "جزئية"]} value={form.visitType} onChange={(v) => setForm({ ...form, visitType: v })} />

          {CLASS_VISIT_DOMAINS.map((d) => (
            <View key={d.domain} style={{ marginBottom: 6 }}>
              <Text style={styles.domain}>{d.domain}</Text>
              {d.indicators.map((ind) => {
                const items = bankFor(ind.code);
                const open = bankOpenFor === ind.code;
                return (
                <View key={ind.code} style={styles.indRow}>
                  <P style={{ fontSize: 12.5, marginBottom: 8 }}>{ind.code} {ind.text}</P>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {SCORE_OPTIONS.map((o) => (
                      <Chip key={o.v} label={o.label} active={scores[ind.code] === o.v} onPress={() => setScores({ ...scores, [ind.code]: o.v })} />
                    ))}
                  </View>
                  <Input placeholder="التوصية لهذا المؤشر…" value={indRecs[ind.code] ?? ""}
                    onChangeText={(v2) => setIndRecs({ ...indRecs, [ind.code]: v2 })} multiline />
                  <Row style={{ gap: 6, flexWrap: "wrap" }}>
                    <Button title="اقترح" icon="sparkles" small
                      onPress={() => {
                        const cur = (indRecs[ind.code] ?? "").trim();
                        const pool = items.filter((b) => !cur.includes(b.text));
                        const ex = pool.find((b) => b.code === ind.code) ?? pool[0];
                        if (ex) setIndRecs({ ...indRecs, [ind.code]: (cur ? cur + "\n" : "") + ex.text });
                      }} />
                    <Button title={`من البنك${items.length ? ` (${items.length})` : ""}`} icon="albums-outline" variant="outline" small
                      onPress={() => setBankOpenFor(open ? null : ind.code)} />
                    <Button title="حفظ بالبنك" icon="bookmark-outline" variant="ghost" small
                      onPress={() => { const t = (indRecs[ind.code] ?? "").trim(); if (t) addBank({ code: ind.code, text: t }); }} />
                  </Row>
                  {open && (
                    <Card style={{ backgroundColor: colors.bg, marginTop: 8 }}>
                      {items.length === 0 ? <P muted style={{ fontSize: 12.5 }}>لا توجد فقرات محفوظة لهذا المؤشر بعد.</P> :
                        items.map((b) => (
                          <Row key={b._id} style={{ justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                            <Pressable style={{ flex: 1 }} onPress={() => { const cur = (indRecs[ind.code] ?? "").trim(); if (!cur.includes(b.text)) setIndRecs({ ...indRecs, [ind.code]: (cur ? cur + "\n" : "") + b.text }); }}>
                              <P style={{ fontSize: 12.5 }}>{b.text}</P>
                            </Pressable>
                            <IconBtn name="trash-outline" color={colors.danger} onPress={() => removeBank({ id: b._id })} />
                          </Row>
                        ))}
                    </Card>
                  )}
                </View>
                );
              })}
            </View>
          ))}

          <Card style={{ backgroundColor: colors.primarySoft }}>
            <Row style={{ justifyContent: "space-between" }}>
              <H2>نسبة الأداء (للمقاس): {pct}%</H2>
              <Badge label={`${total} / ${max}`} tone="primary" />
            </Row>
          </Card>

          <H2>متابعة المنسقة</H2>
          <Row style={{ flexWrap: "wrap", marginBottom: 10 }}>
            {CLASS_VISIT_FOLLOWUP.map((f) => (
              <Pressable key={f} onPress={() => toggleFollow(f)}
                style={[styles.follow, followup.includes(f) && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                <Text style={[styles.followTxt, followup.includes(f) && { color: colors.primary }]}>{followup.includes(f) ? "✔ " : ""}{f}</Text>
              </Pressable>
            ))}
          </Row>

          <Input label="ملاحظات وتوصيات عامّة" value={recs} onChangeText={setRecs} multiline />
          <Row style={{ gap: 10 }}>
            <Button title={editing ? "حفظ التعديلات" : "حفظ الاستمارة"} icon="checkmark" onPress={save} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
        </Card>
      )}

      {visits.length === 0 ? (
        <Empty text="لا توجد استمارات زيارة صفية بعد" actionTitle="زيارة جديدة" onAction={() => setAdding(true)} icon="eye-outline" />
      ) : visits.map((v, vi) => {
        const m = (v.scores ?? []).filter((x: any) => x.score >= 0);
        const t = m.reduce((s: number, x: any) => s + x.score, 0);
        const mx = m.length * 3;
        return (
          <AnimatedItem key={v._id} index={vi}>
            <Card style={{ paddingVertical: 12 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <P style={{ color: colors.text, fontSize: 15 }}>{v.teacherName}</P>
                  <P muted style={{ fontSize: 12.5 }}>{v.subject} • {v.grade} {v.section} • {v.date}</P>
                  <Row style={{ marginTop: 4 }}>
                    <Badge label={v.visitType} tone="accent" />
                    {mx ? <Badge label={`${Math.round((t / mx) * 100)}%`} tone="success" /> : null}
                  </Row>
                </View>
                <Row>
                  <SourceFileBtn storageId={(v as any).sourceFileId} />
                  <IconBtn name="print-outline" color={colors.primary} onPress={() => printClassVisit(v, settings ?? {})} />
                  <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEdit(v)} />
                  <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: v._id })} />
                </Row>
              </Row>
            </Card>
          </AnimatedItem>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  domain: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent, textAlign: "right", marginVertical: 8 },
  indRow: { flexDirection: "column", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  sBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  sTxt: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: 13 },
  follow: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8, marginBottom: 8 },
  followTxt: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textSecondary },
});
