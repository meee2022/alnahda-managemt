import React, { useState } from "react";
import { View, Platform } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Chip, Select, PageHero, HeroBtn, AnimatedItem } from "../lib/ui";
import { colors } from "../lib/theme";
import { printStudentsSkillSheet } from "../lib/printTemplates";

const GRADES = ["الأول", "الثاني"];
const SECTIONS = ["A", "B", "C", "D", "E"];
const READING = ["ممتاز", "جيد جداً", "جيد", "ضعيف"];
const WRITING = ["ممتاز", "جيد جداً", "ضعيف"];

export default function Students() {
  const [grade, setGrade] = useState("الأول");
  const [section, setSection] = useState("A");
  const students = useQuery(api.students.list, { grade, section });
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.students.create);
  const update = useMutation(api.students.update);
  const remove = useMutation(api.students.remove);
  const bulkCreate = useMutation(api.students.bulkCreate);

  const [importMsg, setImportMsg] = useState("");
  const importCsv = () => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".csv,text/csv,text/plain";
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      // تجاهل صف العناوين إن وُجد
      const start = /اسم|name/i.test(lines[0] ?? "") ? 1 : 0;
      const list = lines.slice(start).map((l) => {
        const c = l.split(/[,،;\t]/).map((x) => x.trim());
        return { name: c[0] || "", grade: c[1] || grade, section: c[2] || section, readingLevel: c[3] || "", writingLevel: c[4] || "" };
      }).filter((s) => s.name);
      if (!list.length) { setImportMsg("لم يُعثر على أسماء في الملف."); return; }
      const r = await bulkCreate({ students: list });
      setImportMsg(`تم استيراد ${r.added} طالبة.`);
      setTimeout(() => setImportMsg(""), 4000);
    };
    input.click();
  };

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", readingLevel: "", writingLevel: "", behavior: "", notes: "" });

  const reset = () => { setForm({ name: "", readingLevel: "", writingLevel: "", behavior: "", notes: "" }); setAdding(false); setEditing(null); };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) await update({ id: editing as any, ...form });
    else await create({ ...form, grade, section });
    reset();
  };

  const printList = () => printStudentsSkillSheet(students ?? [], grade, section, settings ?? {});

  return (
    <Screen>
      <PageHero
        title="الطالبات"
        desc={`الصف ${grade} / ${section} — قياس مستوى مهارة القراءة والكتابة`}
        icon="school"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title="إضافة طالبة" icon="add" prominent onPress={() => { reset(); setAdding(true); }} />
        <HeroBtn title="استيراد من ملف (CSV)" icon="cloud-upload-outline" onPress={importCsv} />
        <HeroBtn title="طباعة الكشف" icon="print-outline" onPress={printList} />
      </PageHero>

      {importMsg ? <Card style={{ backgroundColor: colors.successSoft }}><P style={{ fontSize: 13, color: colors.success }}>{importMsg}</P></Card> : null}

      <Card>
        <Row style={{ flexWrap: "wrap" }}>
          {GRADES.map((g) => <Chip key={g} label={`الصف ${g}`} active={grade === g} onPress={() => setGrade(g)} />)}
          <View style={{ width: 12 }} />
          {SECTIONS.map((s) => <Chip key={s} label={s} active={section === s} onPress={() => setSection(s)} color={colors.accent} />)}
        </Row>
      </Card>

      {(adding || editing) && (
        <Card>
          <H2>{editing ? "تعديل بيانات طالبة" : `طالبة جديدة — ${grade} ${section}`}</H2>
          <Input label="اسم الطالبة" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Select label="مستوى القراءة" options={READING} value={form.readingLevel} onChange={(v) => setForm({ ...form, readingLevel: v })} />
          <Select label="مستوى الكتابة" options={WRITING} value={form.writingLevel} onChange={(v) => setForm({ ...form, writingLevel: v })} />
          <Input label="السلوك" value={form.behavior} onChangeText={(v) => setForm({ ...form, behavior: v })} />
          <Input label="ملاحظات" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
          <Row>
            <Button title="حفظ" icon="checkmark" small onPress={save} />
            <Button title="إلغاء" variant="ghost" small onPress={reset} />
          </Row>
        </Card>
      )}

      {students === undefined ? <Loading /> : students.length === 0 ? (
        <Empty text="لا توجد طالبات في هذه الشعبة" actionTitle="إضافة طالبة" onAction={() => { reset(); setAdding(true); }} icon="school-outline" />
      ) : students.map((s, i) => (
        <AnimatedItem key={s._id} index={i}>
        <Card style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <P style={{ color: colors.text, fontSize: 14.5 }}>{i + 1}. {s.name}</P>
              <Row style={{ marginTop: 4, flexWrap: "wrap" }}>
                {s.readingLevel ? <Badge label={`قراءة: ${s.readingLevel}`} tone={s.readingLevel === "ضعيف" ? "danger" : "success"} /> : null}
                {s.writingLevel ? <Badge label={`كتابة: ${s.writingLevel}`} tone={s.writingLevel === "ضعيف" ? "danger" : "primary"} /> : null}
              </Row>
            </View>
            <Row>
              <IconBtn name="pencil-outline" color={colors.primary} onPress={() => {
                setEditing(s._id);
                setAdding(false);
                setForm({ name: s.name, readingLevel: s.readingLevel ?? "", writingLevel: s.writingLevel ?? "", behavior: s.behavior ?? "", notes: s.notes ?? "" });
              }} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: s._id })} />
            </Row>
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
