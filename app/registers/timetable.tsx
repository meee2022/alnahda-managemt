import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Modal, Platform } from "react-native";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Row, PageHero, Select, Badge } from "../../lib/ui";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, gradients } from "../../lib/theme";

const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const PERIODS = ["1", "2", "3", "4", "5", "6", "7", "8"];

function pickFile(): Promise<File | null> {
  return new Promise((resolve) => {
    if (Platform.OS !== "web" || typeof document === "undefined") return resolve(null);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,image/png,image/jpeg,image/jpg,image/webp";
    input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null);
    input.click();
  });
}

export default function TimetablePage() {
  const teachers = useQuery(api.teachers.list, {});
  const settings = useQuery(api.admin.getSettings, {});
  const upsert = useMutation(api.timetable.upsert);
  const removeMut = useMutation(api.timetable.remove);
  const bulkUpsert = useMutation(api.timetable.bulkUpsert);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const extractTimetable = useAction(api.aiExtract.extractTimetable);

  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [modal, setModal] = useState<{ day: string; period: string; existing?: any } | null>(null);
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");

  // رفع الجدول المطبوع + استخراج تلقائي بالذكاء
  const [upStage, setUpStage] = useState<"idle" | "uploading" | "extracting" | "saving">("idle");
  const [upMsg, setUpMsg] = useState<string | null>(null);
  const [upErr, setUpErr] = useState<string | null>(null);
  const aiOn = settings?.aiEnabled === "true" || !!settings?.anthropicApiKey;

  const handleUpload = async () => {
    setUpErr(null); setUpMsg(null);
    const file = await pickFile();
    if (!file) return;
    const mediaType = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    try {
      setUpStage("uploading");
      const url = await generateUploadUrl();
      const up = await fetch(url, { method: "POST", headers: { "Content-Type": mediaType }, body: file });
      const { storageId: sid } = await up.json();

      setUpStage("extracting");
      const r = await extractTimetable({ storageId: sid as any, mediaType });
      if (!r.ok) { setUpErr(r.error ?? "تعذّر التحليل."); setUpStage("idle"); return; }
      const entries = (r.data?.entries ?? []) as any[];
      if (entries.length === 0) { setUpErr("لم يتم العثور على حصص في الملف. تأكدي من وضوح الصورة."); setUpStage("idle"); return; }

      setUpStage("saving");
      const res = await bulkUpsert({ entries, replaceTeachers: true });
      setUpMsg(`تم استيراد ${res.cells} حصة لـ ${res.teachers} معلمة من الجدول المرفوع.`);
      setUpStage("idle");
    } catch (e: any) {
      setUpErr(`خطأ: ${String(e?.message ?? e).slice(0, 160)}`);
      setUpStage("idle");
    }
  };
  const upBusy = upStage !== "idle";

  const schedule = useQuery(
    api.timetable.byTeacher,
    selectedTeacher ? { teacherName: selectedTeacher } : { teacherName: "" }
  );

  const teacherNames = (teachers ?? []).map((t) => t.name);

  const getCellEntry = (day: string, period: string) =>
    (schedule ?? []).find((e) => e.day === day && e.period === period);

  const openModal = (day: string, period: string) => {
    const existing = getCellEntry(day, period);
    setClassName(existing?.className ?? "");
    setSubject(existing?.subject ?? "");
    setModal({ day, period, existing });
  };

  const saveCell = async () => {
    if (!selectedTeacher || !modal || !className.trim()) return;
    await upsert({
      teacherName: selectedTeacher,
      day: modal.day,
      period: modal.period,
      className: className.trim(),
      subject: subject.trim() || undefined,
    });
    setModal(null);
  };

  const deleteCell = async () => {
    if (!modal?.existing) return;
    await removeMut({ id: modal.existing._id });
    setModal(null);
  };

  return (
    <Screen>
      <PageHero
        title="جدول حصص المعلمات"
        desc="أدخل جدول حصص كل معلمة لتفعيل اقتراح الاحتياط الذكي"
        icon="grid-outline"
        gradient={gradients.heroDeep}
      />

      {/* رفع الجدول المطبوع وتعبئته تلقائياً بالذكاء */}
      <Card style={{ backgroundColor: colors.goldSoft, borderColor: colors.gold, borderWidth: 1 }}>
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Row style={{ gap: 8 }}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.goldDark} />
              <H2 style={{ marginBottom: 0 }}>رفع الجدول المطبوع</H2>
            </Row>
            <P muted style={{ fontSize: 13, marginTop: 6 }}>
              ارفعي صورة أو PDF لجدول الحصص، وسيقرأه الذكاء الاصطناعي ويملأ حصص كل معلمة تلقائياً.
            </P>
          </View>
        </Row>
        <Button
          title={
            upStage === "uploading" ? "جارٍ الرفع…"
            : upStage === "extracting" ? "جارٍ القراءة بالذكاء…"
            : upStage === "saving" ? "جارٍ الحفظ…"
            : "اختيار ملف الجدول"
          }
          icon="document-attach"
          onPress={handleUpload}
          disabled={upBusy || !aiOn}
          style={{ marginTop: 12 }}
        />
        {!aiOn ? (
          <P style={{ fontSize: 12.5, color: colors.danger, marginTop: 8 }}>
            فعّلي مفتاح Anthropic API من مساعد التوصيات لتشغيل القراءة التلقائية.
          </P>
        ) : null}
        {upMsg ? (
          <View style={ss.okBox}><Ionicons name="checkmark-circle" size={18} color={colors.success} /><P style={{ flex: 1, fontSize: 13, color: colors.success }}>{upMsg}</P></View>
        ) : null}
        {upErr ? (
          <View style={ss.errBox}><Ionicons name="alert-circle" size={18} color={colors.danger} /><P style={{ flex: 1, fontSize: 13, color: colors.danger }}>{upErr}</P></View>
        ) : null}
      </Card>

      <Card>
        <Select
          label="المعلمة"
          options={teacherNames}
          value={selectedTeacher}
          onChange={setSelectedTeacher}
          searchable
          placeholder="اختاري المعلمة…"
        />
      </Card>

      {selectedTeacher ? (
        schedule === undefined ? (
          <Loading />
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              contentContainerStyle={{ minWidth: "100%" }}
            >
              <View style={{ flex: 1 }}>
                {/* Header row */}
                <View style={styles.row}>
                  <View style={[styles.headerCell, styles.cornerCell]}>
                    <Text style={styles.headerTxt}>الحصة</Text>
                  </View>
                  {DAYS.map((d) => (
                    <View key={d} style={styles.headerCell}>
                      <Text style={styles.headerTxt}>{d}</Text>
                    </View>
                  ))}
                </View>
                {/* Period rows */}
                {PERIODS.map((p) => (
                  <View key={p} style={styles.row}>
                    <View style={[styles.periodCell]}>
                      <Text style={styles.periodTxt}>الحصة {p}</Text>
                    </View>
                    {DAYS.map((d) => {
                      const entry = getCellEntry(d, p);
                      return (
                        <Pressable
                          key={d}
                          style={[styles.cell, entry ? styles.cellFilled : styles.cellEmpty]}
                          onPress={() => openModal(d, p)}
                        >
                          {entry ? (
                            <>
                              <Text style={styles.cellClass}>{entry.className}</Text>
                              {entry.subject ? (
                                <Text style={styles.cellSubject}>{entry.subject}</Text>
                              ) : null}
                            </>
                          ) : (
                            <Text style={styles.cellPlus}>+</Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>
        )
      ) : (
        <P style={{ textAlign: "center", color: colors.textSecondary, marginTop: 32 }}>
          اختاري معلمة لعرض جدولها
        </P>
      )}

      <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <Pressable style={styles.backdrop} onPress={() => setModal(null)}>
          <Pressable style={styles.sheet} onPress={(ev) => ev.stopPropagation()}>
            <H2 style={{ marginBottom: 12 }}>
              {modal?.day} — الحصة {modal?.period}
            </H2>
            <Input
              label="الصف والشعبة (مثال: الأول/أ)"
              value={className}
              onChangeText={setClassName}
              placeholder="الأول/أ"
            />
            <Input
              label="المادة (اختياري)"
              value={subject}
              onChangeText={setSubject}
              placeholder="رياضيات"
            />
            <Row style={{ gap: 8, marginTop: 8 }}>
              <Button title="حفظ" icon="checkmark" onPress={saveCell} style={{ flex: 1 }} />
              {modal?.existing && (
                <Button title="حذف" icon="trash-outline" variant="ghost" onPress={deleteCell}
                  style={{ flex: 1, borderColor: colors.danger }} />
              )}
            </Row>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#0008",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    width: "100%",
    maxWidth: 420,
  },
  row: { flexDirection: "row" },
  headerCell: {
    flex: 1,
    minWidth: 92,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderWidth: 0.5,
    borderColor: "#fff4",
    alignItems: "center",
    justifyContent: "center",
  },
  cornerCell: { flex: 0, width: 78, minWidth: 78 },
  headerTxt: { color: "#fff", fontFamily: fonts.bold, fontSize: 13 },
  periodCell: {
    width: 78,
    paddingVertical: 12,
    backgroundColor: colors.primaryTint,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  periodTxt: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary },
  cell: {
    flex: 1,
    minWidth: 92,
    minHeight: 56,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  cellFilled: { backgroundColor: "#e8f5e9" },
  cellEmpty: { backgroundColor: "#fafafa" },
  cellClass: { fontFamily: fonts.bold, fontSize: 13, color: "#1b5e20", textAlign: "center" },
  cellSubject: { fontFamily: fonts.regular, fontSize: 11, color: "#388e3c", textAlign: "center" },
  cellPlus: { fontSize: 22, color: colors.border },
});

const ss = StyleSheet.create({
  okBox: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10,
    backgroundColor: colors.successSoft, borderRadius: radius.sm, padding: 10,
  },
  errBox: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10,
    backgroundColor: colors.dangerSoft, borderRadius: radius.sm, padding: 10,
  },
});
