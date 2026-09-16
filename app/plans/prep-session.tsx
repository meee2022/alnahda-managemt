import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem, ExportMenu, notify } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { DateField } from "../../lib/pickers";
import { setExportMode } from "../../lib/print";
import { printPrepSession } from "../../lib/printForms2026";
import { COLLECTIVE_PREP_ITEMS } from "../../lib/forms2026";

type Item = { item: string; status: string; notes: string };
type Asg = { lessons: string; teacher: string; dueDate: string };
const blank = (): Item[] => COLLECTIVE_PREP_ITEMS.map((i) => ({ item: i, status: "", notes: "" }));
const emptyAsg = (): Asg => ({ lessons: "", teacher: "", dueDate: "" });
const SUBJECTS = ["اللغة العربية", "التربية الإسلامية", "اللغة الإنجليزية", "الرياضيات", "العلوم"];

export default function PrepSession() {
  const list = useQuery(api.forms2026.listPrepSessions, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const save = useMutation(api.forms2026.savePrepSession);
  const remove = useMutation(api.forms2026.removePrepSession);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState({ date: "", time: "", subject: "", supervisor: "", attendees: "", coversFrom: "", coversTo: "", improvements: "", reflection: "" });
  const [items, setItems] = useState<Item[]>(blank());
  const [asgs, setAsgs] = useState<Asg[]>([emptyAsg()]);

  const done = items.filter((i) => i.status === "تم").length;

  const reset = () => {
    setF({ date: "", time: "", subject: "", supervisor: "", attendees: "", coversFrom: "", coversTo: "", improvements: "", reflection: "" });
    setItems(blank()); setAsgs([emptyAsg()]); setAdding(false); setEditing(null);
  };

  const startEdit = (r: any) => {
    setF({
      date: r.date ?? "", time: r.time ?? "", subject: r.subject ?? "", supervisor: r.supervisor ?? "",
      attendees: r.attendees ?? "", coversFrom: r.coversFrom ?? "", coversTo: r.coversTo ?? "",
      improvements: r.improvements ?? "", reflection: r.reflection ?? "",
    });
    const saved: Item[] = (r.items ?? []).map((x: any) => ({ item: x.item, status: x.status ?? "", notes: x.notes ?? "" }));
    setItems(blank().map((b) => saved.find((s) => s.item === b.item) ?? b));
    setAsgs((r.assignments ?? []).length ? r.assignments.map((a: any) => ({ lessons: a.lessons ?? "", teacher: a.teacher ?? "", dueDate: a.dueDate ?? "" })) : [emptyAsg()]);
    setEditing(r._id); setAdding(true);
  };

  const submit = async () => {
    if (!f.date) { notify("يرجى تحديد تاريخ الجلسة."); return; }
    await save({
      id: (editing as any) ?? undefined,
      date: f.date, time: f.time, subject: f.subject, supervisor: f.supervisor, attendees: f.attendees,
      coversFrom: f.coversFrom, coversTo: f.coversTo,
      items: items.map((i) => ({ item: i.item, status: i.status || undefined, notes: i.notes || undefined })),
      assignments: asgs.filter((a) => a.lessons.trim() || a.teacher.trim()),
      improvements: f.improvements, reflection: f.reflection,
    });
    notify("تم حفظ محضر جلسة التحضير الجماعي", "success");
    reset();
  };

  if (list === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="جلسة التحضير الجماعي"
        desc="محضر الجلسة الأسبوعية — 8 بنود وتكليفات وتأمل المنسقة بالنموذج الرسمي"
        icon="people"
        gradient={["#3B0A14", "#5C1523"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "جلسة جديدة"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
      </PageHero>

      {adding && (
        <>
          <Card>
            <H2>{editing ? "تعديل الجلسة" : "بيانات الجلسة"}</H2>
            <Row style={{ gap: 8 }}>
              <View style={{ flex: 1 }}><DateField label="تاريخ الجلسة" value={f.date} onChange={(v) => setF({ ...f, date: v })} /></View>
              <View style={{ flex: 1 }}><Input label="الوقت" value={f.time} onChangeText={(v) => setF({ ...f, time: v })} placeholder="مثال: 11:10" /></View>
            </Row>
            <Row style={{ gap: 8 }}>
              <View style={{ flex: 1 }}><Select label="المادة" options={SUBJECTS} value={f.subject} onChange={(v) => setF({ ...f, subject: v })} /></View>
              <View style={{ flex: 1 }}><Input label="المشرف على الجلسة" value={f.supervisor} onChangeText={(v) => setF({ ...f, supervisor: v })} placeholder={settings?.coordinator ?? ""} /></View>
            </Row>
            <Input label="أسماء الحضور" value={f.attendees} onChangeText={(v) => setF({ ...f, attendees: v })} multiline />
            <Row style={{ gap: 8 }}>
              <View style={{ flex: 1 }}><DateField label="المحضر له من" value={f.coversFrom} onChange={(v) => setF({ ...f, coversFrom: v })} /></View>
              <View style={{ flex: 1 }}><DateField label="إلى" value={f.coversTo} onChange={(v) => setF({ ...f, coversTo: v })} /></View>
            </Row>
          </Card>

          <Card>
            <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
              <H2 style={{ marginBottom: 0 }}>بنود الجلسة</H2>
              <Badge label={`${done} / ${items.length} تم`} tone={done ? "success" : "muted"} />
            </Row>
            {items.map((it, i) => (
              <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, marginBottom: 10, marginTop: 8 }}>
                <Text style={ss.item}>{i + 1}. {it.item}</Text>
                <Row style={{ gap: 6, marginTop: 6 }}>
                  {["تم", "لم يتم"].map((st) => {
                    const on = it.status === st;
                    return (
                      <Pressable key={st} accessibilityRole="button" accessibilityLabel={`${it.item}: ${st}`}
                        onPress={() => setItems(items.map((x, j) => j === i ? { ...x, status: on ? "" : st } : x))}
                        style={[ss.chip, on && (st === "تم" ? ss.chipOk : ss.chipNo)]}>
                        <Text style={[ss.chipTxt, on && { color: "#fff" }]}>{st}</Text>
                      </Pressable>
                    );
                  })}
                </Row>
                <Input placeholder="ملاحظات" value={it.notes} onChangeText={(v) => setItems(items.map((x, j) => j === i ? { ...x, notes: v } : x))} />
              </View>
            ))}
          </Card>

          <Card>
            <H2>التكليف</H2>
            {asgs.map((a, i) => (
              <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, marginBottom: 10 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <Badge label={`تكليف ${i + 1}`} tone="primary" />
                  {asgs.length > 1 ? <IconBtn name="close-circle-outline" color={colors.danger} onPress={() => setAsgs(asgs.filter((_, j) => j !== i))} /> : null}
                </Row>
                <Input label="أسماء الدروس" value={a.lessons} onChangeText={(v) => setAsgs(asgs.map((x, j) => j === i ? { ...x, lessons: v } : x))} />
                <Row style={{ gap: 8 }}>
                  <View style={{ flex: 1 }}><Select label="المعلم المسؤول" options={(teachers ?? []).map((t) => t.name)} value={a.teacher} onChange={(v) => setAsgs(asgs.map((x, j) => j === i ? { ...x, teacher: v } : x))} searchable placeholder="اختاري…" /></View>
                  <View style={{ flex: 1 }}><DateField label="تاريخ التسليم" value={a.dueDate} onChange={(v) => setAsgs(asgs.map((x, j) => j === i ? { ...x, dueDate: v } : x))} /></View>
                </Row>
              </View>
            ))}
            <Button title="إضافة تكليف" icon="add" variant="outline" small style={{ alignSelf: "flex-start" }} onPress={() => setAsgs([...asgs, emptyAsg()])} />
          </Card>

          <Card>
            <H2>التعديلات وتأمل المنسق</H2>
            <Input label="التعديلات والإضافات والمقترحات التي أثرت الجلسة" value={f.improvements} onChangeText={(v) => setF({ ...f, improvements: v })} multiline />
            <Input label="تأمل المنسقة (التحديات / مقترحات للتحسين)" value={f.reflection} onChangeText={(v) => setF({ ...f, reflection: v })} multiline />
            <Row>
              <Button title={editing ? "حفظ التعديل" : "حفظ المحضر"} icon="checkmark" onPress={submit} />
              <Button title="إلغاء" variant="ghost" onPress={reset} />
            </Row>
          </Card>
        </>
      )}

      {list.length === 0 ? (
        <Empty text="لا توجد جلسات مسجّلة بعد" actionTitle="جلسة جديدة" onAction={() => setAdding(true)} icon="people-outline" />
      ) : list.map((r: any, i: number) => (
        <AnimatedItem key={r._id} index={i}>
          <Card style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <P style={{ color: colors.text, fontSize: 15 }}>جلسة {r.subject || "تحضير جماعي"} — {r.date}</P>
                <Row style={{ flexWrap: "wrap", marginTop: 4 }}>
                  <Badge label={`${(r.items ?? []).filter((x: any) => x.status === "تم").length} بند تم`} tone="success" />
                  {(r.assignments ?? []).length ? <Badge label={`${r.assignments.length} تكليف`} tone="primary" /> : null}
                </Row>
              </View>
              <Row>
                <ExportMenu run={(m) => { setExportMode(m, `جلسة تحضير - ${r.date ?? ""}`); printPrepSession(r, settings ?? {}); }} />
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

const ss = StyleSheet.create({
  item: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text, textAlign: "right", lineHeight: 21 },
  chip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: "#fff" },
  chipOk: { backgroundColor: colors.success, borderColor: colors.success },
  chipNo: { backgroundColor: colors.danger, borderColor: colors.danger },
  chipTxt: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textSecondary },
});
