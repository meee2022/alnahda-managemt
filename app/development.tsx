import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, Chip, PageHero, HeroBtn, AnimatedItem } from "../lib/ui";
import { colors } from "../lib/theme";
import { MONTHS } from "../lib/forms";
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

  const [adding, setAdding] = useState(false);
  const [tform, setTform] = useState({ teacherName: "", programName: "", date: "", month: "مايو", hours: "", type: "داخلي", category: "ورشة" });
  const [rform, setRform] = useState({ teacherName: "", date: "", bookTitle: "", summary: "" });

  const printTeacherSheet = (teacherName: string) =>
    printTrainingSheet(teacherName, (trainings ?? []).filter((t) => t.teacherName === teacherName), settings ?? {});

  return (
    <Screen>
      <PageHero
        title="التطوير المهني"
        desc="حصر البرامج التدريبية والقراءات المهنية لكل معلمة — بنموذج الحصر الرسمي"
        icon="library"
        gradient={["#5E0E24", "#9A1B3C"]}
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
          <H2>برنامج تدريبي جديد</H2>
          <Select label="المعلمة" options={(teachers ?? []).map((t) => t.name)} value={tform.teacherName} onChange={(v) => setTform({ ...tform, teacherName: v })} />
          <Input label="اسم البرنامج" value={tform.programName} onChangeText={(v) => setTform({ ...tform, programName: v })} />
          <Input label="التاريخ" value={tform.date} onChangeText={(v) => setTform({ ...tform, date: v })} />
          <Select label="الشهر" options={MONTHS} value={tform.month} onChange={(v) => setTform({ ...tform, month: v })} />
          <Input label="عدد الساعات" value={tform.hours} onChangeText={(v) => setTform({ ...tform, hours: v })} />
          <Select label="النوع" options={["داخلي", "خارجي"]} value={tform.type} onChange={(v) => setTform({ ...tform, type: v })} />
          <Select label="التصنيف" options={["ورشة", "مؤتمر", "درس مشاهدة", "بحث إجرائي", "مسابقة", "زيارة ميدانية"]} value={tform.category} onChange={(v) => setTform({ ...tform, category: v })} />
          <Button title="حفظ" icon="checkmark" onPress={async () => {
            if (!tform.teacherName || !tform.programName) return;
            await createTraining(tform);
            setAdding(false);
          }} />
        </Card>
      )}

      {adding && tab === "readings" && (
        <Card>
          <H2>قراءة مهنية جديدة</H2>
          <Select label="الموظفة" options={[settings?.coordinator ?? "", ...(teachers ?? []).map((t) => t.name)]} value={rform.teacherName} onChange={(v) => setRform({ ...rform, teacherName: v })} />
          <Input label="التاريخ" value={rform.date} onChangeText={(v) => setRform({ ...rform, date: v })} />
          <Input label="عنوان الكتاب" value={rform.bookTitle} onChangeText={(v) => setRform({ ...rform, bookTitle: v })} />
          <Input label="ماذا استفدت من الكتاب" value={rform.summary} onChangeText={(v) => setRform({ ...rform, summary: v })} multiline />
          <Button title="حفظ" icon="checkmark" onPress={async () => {
            if (!rform.bookTitle) return;
            await createReading(rform);
            setAdding(false);
          }} />
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
                <IconBtn name="print-outline" color={colors.primary} onPress={() => printTeacherSheet(t.teacherName)} />
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
                <IconBtn name="print-outline" color={colors.primary} onPress={() => printReading(r, settings ?? {})} />
                <IconBtn name="trash-outline" color={colors.danger} onPress={() => removeReading({ id: r._id })} />
              </Row>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
