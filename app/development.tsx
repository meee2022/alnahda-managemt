import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, Chip, PageHero, HeroBtn, AnimatedItem, ExportMenu, notify } from "../lib/ui";
import { colors } from "../lib/theme";
import { MONTHS } from "../lib/forms";
import { DateField } from "../lib/pickers";
import { setExportMode } from "../lib/print";
import { printTrainingSheet, printReading } from "../lib/printTemplates";

export default function Development() {
  const [tab, setTab] = useState<"trainings" | "readings">("trainings");
  const trainings = useQuery(api.development.listTrainings, {});
  const readings = useQuery(api.development.listReadings, {});
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const createTraining = useMutation(api.development.createTraining);
  const removeTraining = useMutation(api.development.removeTraining);
  const createReading = useMutation(api.development.createReading);
  const removeReading = useMutation(api.development.removeReading);
  const updateTraining = useMutation(api.development.updateTraining);
  const updateReading = useMutation(api.development.updateReading);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const T0 = { teacherName: "", programName: "", date: "", month: "مايو", hours: "", type: "داخلي", category: "ورشة" };
  const R0 = { teacherName: "", date: "", bookTitle: "", summary: "" };
  const [tform, setTform] = useState({ ...T0 });
  const [rform, setRform] = useState({ ...R0 });

  const reset = () => { setTform({ ...T0 }); setRform({ ...R0 }); setAdding(false); setEditing(null); };
  const startEditTraining = (t: any) => { setTform({ teacherName: t.teacherName ?? "", programName: t.programName ?? "", date: t.date ?? "", month: t.month ?? "مايو", hours: t.hours ?? "", type: t.type ?? "داخلي", category: t.category ?? "ورشة" }); setEditing(t._id); setAdding(true); };
  const startEditReading = (r: any) => { setRform({ teacherName: r.teacherName ?? "", date: r.date ?? "", bookTitle: r.bookTitle ?? "", summary: r.summary ?? "" }); setEditing(r._id); setAdding(true); };
  const saveTraining = async () => { if (!tform.teacherName || !tform.programName) { notify("يرجى اختيار المعلمة وإدخال اسم البرنامج."); return; } if (editing) await updateTraining({ id: editing as any, ...tform }); else await createTraining(tform); reset(); };
  const saveReading = async () => { if (!rform.bookTitle) { notify("يرجى إدخال عنوان الكتاب."); return; } if (editing) await updateReading({ id: editing as any, ...rform }); else await createReading(rform); reset(); };

  const printTeacherSheet = (teacherName: string) =>
    printTrainingSheet(teacherName, (trainings ?? []).filter((t) => t.teacherName === teacherName), settings ?? {});

  return (
    <Screen>
      <PageHero
        title="التطوير المهني"
        desc="حصر البرامج التدريبية والقراءات المهنية لكل معلمة — بنموذج الحصر الرسمي"
        icon="library"
        gradient={["#4A0F1B", "#5C1523"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "إضافة جديدة"} icon={adding ? "close" : "add"} prominent onPress={() => setAdding(!adding)} />
      </PageHero>

      <Card>
        <Row>
          <Chip label="البرامج التدريبية" active={tab === "trainings"} onPress={() => setTab("trainings")} />
          <Chip label="القراءة المهنية" active={tab === "readings"} onPress={() => setTab("readings")} color={colors.accent} />
        </Row>
      </Card>

      {adding && tab === "trainings" && (
        <Card>
          <H2>{editing ? "تعديل برنامج تدريبي" : "برنامج تدريبي جديد"}</H2>
          <Select label="المعلمة" options={(teachers ?? []).map((t) => t.name)} value={tform.teacherName} onChange={(v) => setTform({ ...tform, teacherName: v })} />
          <Input label="اسم البرنامج" value={tform.programName} onChangeText={(v) => setTform({ ...tform, programName: v })} />
          <DateField label="التاريخ" value={tform.date} onChange={(v) => setTform({ ...tform, date: v })} />
          <Select label="الشهر" options={MONTHS} value={tform.month} onChange={(v) => setTform({ ...tform, month: v })} />
          <Input label="عدد الساعات" value={tform.hours} onChangeText={(v) => setTform({ ...tform, hours: v })} />
          <Select label="النوع" options={["داخلي", "خارجي"]} value={tform.type} onChange={(v) => setTform({ ...tform, type: v })} />
          <Select label="التصنيف" options={["ورشة", "مؤتمر", "درس مشاهدة", "بحث إجرائي", "مسابقة", "زيارة ميدانية"]} value={tform.category} onChange={(v) => setTform({ ...tform, category: v })} />
          <Row>
            <Button title={editing ? "حفظ التعديل" : "حفظ"} icon="checkmark" onPress={saveTraining} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
        </Card>
      )}

      {adding && tab === "readings" && (
        <Card>
          <H2>{editing ? "تعديل قراءة مهنية" : "قراءة مهنية جديدة"}</H2>
          <Select label="الموظفة" options={[settings?.coordinator ?? "", ...(teachers ?? []).map((t) => t.name)]} value={rform.teacherName} onChange={(v) => setRform({ ...rform, teacherName: v })} />
          <DateField label="التاريخ" value={rform.date} onChange={(v) => setRform({ ...rform, date: v })} />
          <Input label="عنوان الكتاب" value={rform.bookTitle} onChangeText={(v) => setRform({ ...rform, bookTitle: v })} />
          <Input label="ماذا استفدت من الكتاب" value={rform.summary} onChangeText={(v) => setRform({ ...rform, summary: v })} multiline />
          <Row>
            <Button title={editing ? "حفظ التعديل" : "حفظ"} icon="checkmark" onPress={saveReading} />
            {editing ? <Button title="إلغاء" variant="ghost" onPress={reset} /> : null}
          </Row>
        </Card>
      )}

      {tab === "trainings" ? (
        trainings === undefined ? <Loading /> : trainings.length === 0 ? <Empty /> : trainings.map((t) => (
          <Card key={t._id} style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <P style={{ color: colors.text, fontSize: 14.5 }}>{t.programName}</P>
                <P muted style={{ fontSize: 13 }}>{t.teacherName} • {t.date}{t.hours ? ` • ${t.hours} ساعة` : ""}</P>
                <Row style={{ marginTop: 4 }}>
                  <Badge label={t.type} tone={t.type === "خارجي" ? "accent" : "primary"} />
                  {t.category ? <Badge label={t.category} tone="muted" /> : null}
                </Row>
              </View>
              <Row>
                <ExportMenu run={(m) => { setExportMode(m, `تدريب - ${t.teacherName}`); printTeacherSheet(t.teacherName); }} />
                <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEditTraining(t)} />
                <IconBtn name="trash-outline" color={colors.danger} onPress={() => removeTraining({ id: t._id })} />
              </Row>
            </Row>
          </Card>
        ))
      ) : (
        readings === undefined ? <Loading /> : readings.length === 0 ? <Empty /> : readings.map((r) => (
          <Card key={r._id}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <H2>{r.bookTitle}</H2>
                <P muted style={{ fontSize: 13 }}>{r.teacherName} • {r.date}</P>
                <P style={{ fontSize: 13, marginTop: 6 }} >{r.summary.length > 220 ? r.summary.slice(0, 220) + "…" : r.summary}</P>
              </View>
              <Row>
                <ExportMenu run={(m) => { setExportMode(m, `قراءة مهنية - ${r.bookTitle ?? ""}`); printReading(r, settings ?? {}); }} />
                <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEditReading(r)} />
                <IconBtn name="trash-outline" color={colors.danger} onPress={() => removeReading({ id: r._id })} />
              </Row>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
