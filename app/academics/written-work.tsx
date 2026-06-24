import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Button, Loading, Empty, Row, Badge, Chip, Input, PageHero, HeroBtn, ExportMenu, AnimatedItem } from "../../lib/ui";
import { DateField } from "../../lib/pickers";
import { colors, fonts } from "../../lib/theme";
import { printWrittenWorkSheet } from "../../lib/printTemplates";
import { setExportMode } from "../../lib/print";
import { AiSuggest } from "../../lib/aiSuggest";

const KEY = ["0 ضعيف", "1 مقبول", "2 جيد", "3 متميز"];

export default function WrittenWork() {
  const [grade, setGrade] = useState("الثاني");
  const [section, setSection] = useState("A");
  const [subject, setSubject] = useState("التربية الإسلامية");
  const students = useQuery(api.students.list, { grade, section });
  const records = useQuery(api.academics.listWrittenWork, { grade, section, subject });
  const settings = useQuery(api.admin.getSettings, {});
  const upsert = useMutation(api.academics.upsertWrittenWork);

  const [selected, setSelected] = useState<string | null>(null);
  const [scores, setScores] = useState({ continuity: 0, accuracy: 0, reinforcement: 0, correction: 0 });
  const [date, setDate] = useState("");
  const [hw, setHw] = useState({ date: "", accuracy: 0, reinforcement: 0, correction: 0 });
  const [qz, setQz] = useState({ date: "", accuracy: 0, reinforcement: 0 });
  const [feedback, setFeedback] = useState("");

  const recFor = (name: string) => records?.find((r) => r.studentName === name);

  const save = async (studentName: string) => {
    const existing = recFor(studentName);
    await upsert({
      id: existing?._id,
      studentName, grade, section, subject,
      notebook: { date, ...scores },
      homework: hw,
      quizzes: qz,
      feedback,
    });
    setSelected(null);
    setScores({ continuity: 0, accuracy: 0, reinforcement: 0, correction: 0 });
    setHw({ date: "", accuracy: 0, reinforcement: 0, correction: 0 });
    setQz({ date: "", accuracy: 0, reinforcement: 0 });
    setFeedback("");
  };

  // صف أزرار 0-3 قابل لإعادة الاستخدام
  const ScoreRow = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
    <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
      <Text style={st.lbl}>{label}</Text>
      <Row>
        {[0, 1, 2, 3].map((n) => (
          <Pressable key={n} onPress={() => onChange(n)}
            style={[st.scoreBtn, value === n && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <Text style={[st.scoreText, value === n && { color: colors.white }]}>{n}</Text>
          </Pressable>
        ))}
      </Row>
    </Row>
  );

  const printSheet = () => printWrittenWorkSheet(students ?? [], records ?? [], { grade, section, subject }, settings ?? {});

  return (
    <Screen>
      <PageHero
        title="الأعمال الكتابية"
        desc={`متابعة تصحيح أعمال الطالبات — ${subject} / الصف ${grade} ${section}`}
        icon="create"
        gradient={["#A8853A", "#DFC48E"]}
      >
        <ExportMenu heroTitle="تصدير الاستمارة" run={(m) => { setExportMode(m, "متابعة الأعمال الكتابية"); printSheet(); }} />
      </PageHero>

      <Card>
        <Row style={{ flexWrap: "wrap" }}>
          {["الأول", "الثاني"].map((g) => <Chip key={g} label={`الصف ${g}`} active={grade === g} onPress={() => setGrade(g)} />)}
          <View style={{ width: 8 }} />
          {["A", "B", "C", "D", "E"].map((s) => <Chip key={s} label={s} active={section === s} onPress={() => setSection(s)} color={colors.accent} />)}
        </Row>
        <Row style={{ flexWrap: "wrap", marginTop: 8 }}>
          {["اللغة العربية", "التربية الإسلامية"].map((sb) => <Chip key={sb} label={sb} active={subject === sb} onPress={() => setSubject(sb)} color={colors.gold} />)}
        </Row>
      </Card>

      <P muted style={{ fontSize: 12, marginBottom: 8 }}>مفتاح التقييم: 0 ضعيف • 1 مقبول • 2 جيد • 3 متميز — اضغطي على الطالبة لتسجيل المتابعة</P>

      {students === undefined || records === undefined ? <Loading /> : students.length === 0 ? <Empty /> : students.map((s, i) => {
        const r = recFor(s.name);
        const isOpen = selected === s.name;
        return (
          <Card key={s._id} style={{ paddingVertical: 12 }}>
            <Pressable onPress={() => {
              setSelected(isOpen ? null : s.name);
              if (!isOpen && r) {
                if (r.notebook) {
                  setScores({ continuity: r.notebook.continuity, accuracy: r.notebook.accuracy, reinforcement: r.notebook.reinforcement, correction: r.notebook.correction });
                  setDate(r.notebook.date);
                }
                if (r.homework) setHw(r.homework);
                if (r.quizzes) setQz(r.quizzes);
                setFeedback(r.feedback ?? "");
              }
            }}>
              <Row style={{ justifyContent: "space-between" }}>
                <P style={{ color: colors.text, fontSize: 14.5, flex: 1 }}>{i + 1}. {s.name}</P>
                {r?.notebook ? <Badge label={`متابعة: ${r.notebook.date || "✔"}`} tone="success" /> : <Badge label="لم تُتابع" tone="muted" />}
              </Row>
            </Pressable>

            {isOpen && (
              <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                <Badge label="المصدر الرئيسي / كراسات الطلبة" tone="primary" />
                <View style={{ height: 8 }} />
                <DateField label="التاريخ" value={date} onChange={setDate} />
                <ScoreRow label="الاستمرارية" value={scores.continuity} onChange={(n) => setScores({ ...scores, continuity: n })} />
                <ScoreRow label="الدقة" value={scores.accuracy} onChange={(n) => setScores({ ...scores, accuracy: n })} />
                <ScoreRow label="التعزيز" value={scores.reinforcement} onChange={(n) => setScores({ ...scores, reinforcement: n })} />
                <ScoreRow label="متابعة تصويب الأخطاء" value={scores.correction} onChange={(n) => setScores({ ...scores, correction: n })} />

                <Badge label="الواجبات المقيمة" tone="accent" />
                <View style={{ height: 8 }} />
                <DateField label="التاريخ" value={hw.date} onChange={(v) => setHw({ ...hw, date: v })} />
                <ScoreRow label="الدقة" value={hw.accuracy} onChange={(n) => setHw({ ...hw, accuracy: n })} />
                <ScoreRow label="التعزيز" value={hw.reinforcement} onChange={(n) => setHw({ ...hw, reinforcement: n })} />
                <ScoreRow label="متابعة تصويب الأخطاء" value={hw.correction} onChange={(n) => setHw({ ...hw, correction: n })} />

                <Badge label="التقييمات القصيرة" tone="gold" />
                <View style={{ height: 8 }} />
                <DateField label="التاريخ" value={qz.date} onChange={(v) => setQz({ ...qz, date: v })} />
                <ScoreRow label="الدقة" value={qz.accuracy} onChange={(n) => setQz({ ...qz, accuracy: n })} />
                <ScoreRow label="التعزيز" value={qz.reinforcement} onChange={(n) => setQz({ ...qz, reinforcement: n })} />

                <Input label="التغذية الراجعة" value={feedback} onChangeText={setFeedback} multiline />
                <AiSuggest prompt={`تغذية راجعة موجزة وبنّاءة للطالبة ${s.name} في ${subject} بناءً على درجاتها (الاستمرارية ${scores.continuity}، الدقة ${scores.accuracy}، التعزيز ${scores.reinforcement}، التصويب ${scores.correction} من 3).`}
                  onResult={(t) => setFeedback((p) => (p ? p + "\n" + t : t))} />
                <Button title="حفظ المتابعة" icon="checkmark" small onPress={() => save(s.name)} />
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const st = StyleSheet.create({
  lbl: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text },
  scoreBtn: { width: 32, height: 32, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginHorizontal: 2 },
  scoreText: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: 14 },
});
