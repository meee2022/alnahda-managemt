import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Button, Loading, Row, Badge, Select, PageHero, HeroBtn, ExportMenu } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { TEACHER_CATEGORIES } from "../../lib/forms";
import { printTeacherClassification } from "../../lib/printTemplates";
import { setExportMode } from "../../lib/print";

export default function Classification() {
  const teachers = useQuery(api.teachers.list, {});
  const classifications = useQuery(api.classVisits.listClassifications, {});
  const settings = useQuery(api.admin.getSettings, {});
  const setClass = useMutation(api.classVisits.setClassification);
  const [term, setTerm] = useState("الفصل الدراسي الثاني");

  if (teachers === undefined || classifications === undefined) return <Loading />;

  const catOf = (name: string) => classifications.find((c) => c.teacherName === name)?.category ?? "";

  const assignments: Record<string, string[]> = {};
  for (const cat of TEACHER_CATEGORIES) assignments[cat.key] = [];
  for (const c of classifications) {
    if (assignments[c.category]) assignments[c.category].push(c.teacherName);
  }

  const printSheet = () => printTeacherClassification(assignments, term, settings ?? {});

  return (
    <Screen>
      <PageHero
        title="تصنيف أداء المعلمين"
        desc="تصنيف كل معلمة وفق فئات الأداء الأربع — بالمعايير والإجراءات الرسمية"
        icon="git-branch"
        gradient={["#B0883A", "#D4B05C"]}
      >
        <ExportMenu heroTitle="تصدير التصنيف" run={(m) => { setExportMode(m, "تصنيف الأداء"); printSheet(); }} />
      </PageHero>

      <Card>
        <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Select label="الفصل الدراسي" options={["الفصل الدراسي الأول", "الفصل الدراسي الثاني"]} value={term} onChange={setTerm} />
          </View>
        </Row>
        <P muted style={{ fontSize: 12.5 }}>منسق المادة: {settings?.coordinator} • النائب الأكاديمي: {settings?.academicDeputy ?? "—"}</P>
      </Card>

      {/* تعيين كل معلمة لفئة */}
      <Card>
        <H2>تعيين المعلمات للفئات</H2>
        {teachers.map((t) => (
          <View key={t._id} style={styles.teacherRow}>
            <P style={{ color: colors.text, marginBottom: 6 }}>{t.name}</P>
            <Row style={{ flexWrap: "wrap", gap: 6 }}>
              {TEACHER_CATEGORIES.map((c) => {
                const on = catOf(t.name) === c.key;
                return (
                  <Pressable key={c.key} onPress={() => setClass({ teacherName: t.name, category: c.key, term })}
                    style={[styles.catChip, on && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Text style={[styles.catTxt, on && { color: "#fff" }]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </Row>
          </View>
        ))}
      </Card>

      {/* عرض الفئات بمعاييرها وإجراءاتها */}
      {TEACHER_CATEGORIES.map((c) => (
        <Card key={c.key}>
          <Row style={{ justifyContent: "space-between" }}>
            <H2>{c.label}</H2>
            <Badge label={`${assignments[c.key].length} معلمة`} tone="primary" />
          </Row>
          {assignments[c.key].length > 0 && (
            <Row style={{ flexWrap: "wrap", marginBottom: 8 }}>
              {assignments[c.key].map((n) => <Badge key={n} label={n} tone="muted" />)}
            </Row>
          )}
          <Text style={styles.lbl}>المعايير:</Text>
          <P style={{ fontSize: 13 }}>{c.criteria}</P>
          <Text style={styles.lbl}>الإجراءات:</Text>
          {c.actions.map((a, i) => <P key={i} style={{ fontSize: 13 }}>• {a}</P>)}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  teacherRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  catChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  catTxt: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  lbl: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent, textAlign: "right", marginTop: 8, marginBottom: 2 },
});
