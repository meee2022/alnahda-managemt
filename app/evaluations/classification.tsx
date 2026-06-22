import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Button, Loading, Row, Badge, Select, PageHero, HeroBtn, ExportMenu } from "../../lib/ui";
import { colors, fonts, radius } from "../../lib/theme";
import { TEACHER_CATEGORIES } from "../../lib/forms";
import { printTeacherClassification } from "../../lib/printTemplates";
import { setExportMode } from "../../lib/print";

// لون مميّز لكل فئة (ضمن هوية الموقع)
const CAT_TONE: Record<string, { color: string; soft: string }> = {
  "تطوير ذاتي": { color: colors.success, soft: colors.successSoft },
  "دعم عام": { color: colors.goldDark, soft: colors.goldSoft },
  "دعم مكثف": { color: colors.warning, soft: colors.warningSoft },
  "مستجد": { color: colors.primary, soft: colors.primarySoft },
};
const toneOf = (key: string) => CAT_TONE[key] ?? { color: colors.textSecondary, soft: colors.bg };
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");

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
        <Row style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
          <H2 style={{ marginBottom: 0 }}>تعيين المعلمات للفئات</H2>
          <P muted style={{ fontSize: 12.5 }}>
            {classifications.length} / {teachers.length} مُصنَّفة
          </P>
        </Row>
        <View style={{ marginTop: 8 }}>
          {teachers.map((t, idx) => {
            const cur = catOf(t.name);
            const curTone = cur ? toneOf(cur) : null;
            return (
              <View key={t._id} style={[styles.teacherRow, idx === 0 && { borderTopWidth: 0 }]}>
                <Row style={{ gap: 11, alignItems: "center" }}>
                  <View style={[styles.avatar, { backgroundColor: curTone ? curTone.color : colors.borderStrong }]}>
                    <Text style={styles.avatarTxt}>{initials(t.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tName}>{t.name}</Text>
                    {cur ? (
                      <Text style={[styles.tStatus, { color: curTone!.color }]}>
                        ● {TEACHER_CATEGORIES.find((c) => c.key === cur)?.label}
                      </Text>
                    ) : (
                      <Text style={styles.tStatusMuted}>لم تُصنَّف بعد</Text>
                    )}
                  </View>
                </Row>
                <Row style={{ flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                  {TEACHER_CATEGORIES.map((c) => {
                    const on = cur === c.key;
                    const tone = toneOf(c.key);
                    const short = c.label.replace(/^فئة\s+/, "");
                    return (
                      <Pressable
                        key={c.key}
                        onPress={() => setClass({ teacherName: t.name, category: c.key, term })}
                        style={[
                          styles.catChip,
                          on
                            ? { backgroundColor: tone.color, borderColor: tone.color }
                            : { backgroundColor: tone.soft, borderColor: tone.soft },
                        ]}
                      >
                        {on ? null : <View style={[styles.dot, { backgroundColor: tone.color }]} />}
                        <Text style={[styles.catTxt, on ? { color: "#fff" } : { color: tone.color }]}>{short}</Text>
                      </Pressable>
                    );
                  })}
                </Row>
              </View>
            );
          })}
        </View>
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
  teacherRow: { paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontFamily: fonts.bold, fontSize: 14, color: "#fff" },
  tName: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.text },
  tStatus: { fontFamily: fonts.medium, fontSize: 12, marginTop: 1 },
  tStatusMuted: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  catTxt: { fontFamily: fonts.semibold, fontSize: 12.5 },
  lbl: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent, textAlign: "right", marginTop: 8, marginBottom: 2 },
});
