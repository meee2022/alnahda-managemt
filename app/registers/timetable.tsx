import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Modal, Platform } from "react-native";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Row, PageHero, Select, Badge, notify } from "../../lib/ui";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, fonts, radius, gradients } from "../../lib/theme";

// أيام الدوام (الأحد–الخميس) وترتيب الحصص — مطابقة لجدول المدرسة وسجل الاحتياط
const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const PERIODS = ["1", "2", "3", "4", "5", "6", "7"];
const NON_TEACHING = new Set(["جلسة تحضير", "اجتماع القسم", "تطوير"]);
// اختصارات المواد لعرضها بوضوح داخل خلية مضغوطة (الاسم الكامل يبقى في نافذة التعديل)
const SUBJECT_SHORT: Record<string, string> = {
  "اللغة الإنجليزية": "إنجليزي",
  "اللغة العربية": "عربي",
  "التربية الإسلامية": "إسلامية",
  "الرياضيات": "رياضيات",
  "العلوم": "علوم",
};
const shortSubject = (s?: string) => (s ? SUBJECT_SHORT[s] ?? s : "");

// حدود خطأ صغيرة لعزل استعلام اختياري عن بقية الصفحة
class QuietBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {}
  render() { return this.state.failed ? null : this.props.children; }
}

function AllSlotsLoader({ onLoad }: { onLoad: (rows: any[] | undefined) => void }) {
  const rows = useQuery(api.timetable.list, {});
  React.useEffect(() => { onLoad(rows); }, [rows]);
  return null;
}

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
  const importChildhood = useMutation(api.timetable.importChildhood);
  const [importing, setImporting] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const extractTimetable = useAction(api.aiExtract.extractTimetable);

  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [teacherQuery, setTeacherQuery] = useState("");
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

  // بيانات مختصرة لكل معلمة (الصف والمادة الأساسية) لعرضها في بطاقات الاختيار.
  // تُحمَّل داخل حدود خطأ معزولة: إن تعذّر تحميلها تظهر البطاقات بدون التفاصيل بدل سقوط الصفحة.
  const [allSlots, setAllSlots] = useState<any[] | undefined>(undefined);
  const teacherMeta = React.useMemo(() => {
    const m: Record<string, { grade?: string; subject?: string; count: number }> = {};
    for (const s of allSlots ?? []) {
      if (NON_TEACHING.has(s.className)) continue;
      const info = (m[s.teacherName] = m[s.teacherName] || { count: 0 });
      info.count++;
      if (!info.grade) info.grade = String(s.className).split("/")[0];
      if (!info.subject && s.subject) info.subject = s.subject;
    }
    return m;
  }, [allSlots]);

  // ترتيب: المعلمات صاحبات الجدول أولاً، ثم أبجدياً — مع تصفية بالبحث
  const teacherCards = React.useMemo(() => {
    const q = teacherQuery.trim();
    let list = (teachers ?? []).map((t) => t.name);
    if (q) list = list.filter((n) => n.includes(q));
    return list.sort((a, b) => {
      const ha = teacherMeta[a] ? 0 : 1, hb = teacherMeta[b] ? 0 : 1;
      if (ha !== hb) return ha - hb;
      return a.localeCompare(b, "ar");
    });
  }, [teachers, teacherMeta, teacherQuery]);

  const getCellEntry = (day: string, period: string) =>
    (schedule ?? []).find((e) => e.day === day && e.period === period);

  const openModal = (day: string, period: string) => {
    const existing = getCellEntry(day, period);
    setClassName(existing?.className ?? "");
    setSubject(existing?.subject ?? "");
    setModal({ day, period, existing });
  };

  const saveCell = async () => {
    if (!selectedTeacher || !modal || !className.trim()) { notify("يرجى اختيار المعلمة وكتابة الصف/الشعبة."); return; }
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
      <QuietBoundary>
        <AllSlotsLoader onLoad={setAllSlots} />
      </QuietBoundary>

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

      <Card style={{ backgroundColor: colors.primaryTint, borderColor: colors.primary, borderWidth: 1 }}>
        <Row style={{ gap: 8 }}>
          <Ionicons name="school-outline" size={20} color={colors.primary} />
          <H2 style={{ marginBottom: 0 }}>الجدول الرسمي لمعلمات الطفولة</H2>
        </Row>
        <P muted style={{ fontSize: 13, marginTop: 6 }}>
          استيراد جداول 24 معلمة (الصفوف الأول والثاني) دفعة واحدة من الملف الرسمي المعتمد — يوفّق الأسماء مع القائمة ويضيف الناقص، ويُفعّل اقتراح الاحتياط تلقائياً.
        </P>
        <Button
          title={importing ? "جارٍ الاستيراد…" : "استيراد الجدول الرسمي للطفولة"}
          icon="download-outline"
          variant="outline"
          loading={importing}
          style={{ marginTop: 10, alignSelf: "flex-start" }}
          onPress={async () => {
            if (typeof window !== "undefined" && !window.confirm("استيراد جداول معلمات الطفولة (24 معلمة)؟ سيُستبدل جدول كل معلمة واردة بحصصها من الملف الرسمي.")) return;
            setImporting(true);
            try {
              const r = await importChildhood({});
              notify(`تم استيراد ${r.cells} حصة لـ ${r.teachers} معلمة (أُضيفت ${r.addedTeachers} معلمة جديدة).`, "success");
            } catch (e: any) {
              notify("تعذّر الاستيراد: " + String(e?.message ?? e).slice(0, 120), "error");
            } finally { setImporting(false); }
          }}
        />
      </Card>

      <Card>
        <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <H2 style={{ marginBottom: 0 }}>اختاري المعلمة</H2>
          <Badge label={`${teacherCards.length} معلمة`} tone="muted" />
        </Row>
        <Input
          value={teacherQuery}
          onChangeText={setTeacherQuery}
          placeholder="ابحثي بالاسم…"
        />
        <View style={styles.teacherGrid}>
          {teacherCards.map((name) => {
            const meta = teacherMeta[name];
            const active = selectedTeacher === name;
            const grade2 = meta?.grade === "الثاني";
            return (
              <Pressable
                key={name}
                style={[styles.tCard, active && styles.tCardActive]}
                onPress={() => setSelectedTeacher(active ? "" : name)}
              >
                <View style={[styles.tAvatar, { backgroundColor: grade2 ? colors.goldSoft : colors.primarySoft, borderColor: grade2 ? colors.gold : colors.primary }]}>
                  <Text style={[styles.tAvatarTxt, { color: grade2 ? colors.goldDark : colors.primary }]}>{name.slice(0, 1)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tName, active && { color: colors.primary }]} numberOfLines={1}>{name}</Text>
                  <Text style={styles.tSub} numberOfLines={1}>
                    {meta ? `${meta.grade ?? ""}${meta.subject ? " · " + shortSubject(meta.subject) : ""} · ${meta.count} حصة` : "لا يوجد جدول"}
                  </Text>
                </View>
                {active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
          {teacherCards.length === 0 ? (
            <P muted style={{ textAlign: "center", width: "100%", paddingVertical: 10 }}>لا توجد معلمة بهذا الاسم</P>
          ) : null}
        </View>
      </Card>

      {selectedTeacher ? (
        schedule === undefined ? (
          <Loading />
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {/* ترويسة الجدول: اسم المعلمة + ملخص الأسبوع */}
            <View style={styles.gridHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.gridHeadName}>{selectedTeacher}</Text>
                <Text style={styles.gridHeadSub}>الجدول الأسبوعي للحصص</Text>
              </View>
              <View style={styles.gridHeadStat}>
                <Text style={styles.gridHeadStatNum}>
                  {(schedule ?? []).filter((e) => !NON_TEACHING.has(e.className)).length}
                </Text>
                <Text style={styles.gridHeadStatLbl}>حصة تدريس</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              contentContainerStyle={{ minWidth: "100%" }}
            >
              <View style={{ flex: 1 }}>
                {/* Header row */}
                <View style={styles.row}>
                  <View style={[styles.headerCell, styles.cornerCell]}>
                    <Ionicons name="time-outline" size={15} color="#fff" />
                  </View>
                  {DAYS.map((d) => (
                    <View key={d} style={styles.headerCell}>
                      <Text style={styles.headerTxt}>{d}</Text>
                    </View>
                  ))}
                </View>
                {/* Period rows */}
                {PERIODS.map((p, pi) => (
                  <View key={p} style={styles.row}>
                    <View style={[styles.periodCell]}>
                      <Text style={styles.periodNum}>{p}</Text>
                      <Text style={styles.periodTxt}>الحصة</Text>
                    </View>
                    {DAYS.map((d) => {
                      const entry = getCellEntry(d, p);
                      const nonTeaching = entry ? NON_TEACHING.has(entry.className) : false;
                      return (
                        <Pressable
                          key={d}
                          style={[styles.cell, !entry ? (pi % 2 ? styles.cellEmptyAlt : styles.cellEmpty) : nonTeaching ? styles.cellNonTeaching : styles.cellFilled]}
                          onPress={() => openModal(d, p)}
                        >
                          {entry ? (
                            nonTeaching ? (
                              <Text style={styles.cellNonTxt} numberOfLines={2}>{entry.className}</Text>
                            ) : (
                              <>
                                <Text style={styles.cellClass} numberOfLines={1}>{entry.className}</Text>
                                {entry.subject ? (
                                  <Text style={styles.cellSubject} numberOfLines={1}>{shortSubject(entry.subject)}</Text>
                                ) : null}
                              </>
                            )
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

            {/* مفتاح الألوان */}
            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]} /><Text style={styles.legendTxt}>حصة تدريس</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]} /><Text style={styles.legendTxt}>تحضير / اجتماع / تطوير</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#fff", borderColor: colors.border }]} /><Text style={styles.legendTxt}>فراغ (متاحة للاحتياط)</Text></View>
            </View>
          </Card>
        )
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={40} color={colors.borderStrong} />
          <P style={{ textAlign: "center", color: colors.textSecondary, marginTop: 10 }}>
            اختاري معلمة لعرض جدولها الأسبوعي
          </P>
        </View>
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
  gridHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryTint,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gridHeadName: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  gridHeadSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  gridHeadStat: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    minWidth: 64,
  },
  gridHeadStatNum: { fontFamily: fonts.bold, fontSize: 20, color: "#fff", lineHeight: 24 },
  gridHeadStatLbl: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.goldSoft },
  row: { flexDirection: "row" },
  headerCell: {
    flex: 1,
    minWidth: 96,
    paddingVertical: 11,
    backgroundColor: colors.primary,
    borderWidth: 0.5,
    borderColor: "#ffffff22",
    alignItems: "center",
    justifyContent: "center",
  },
  cornerCell: { flex: 0, width: 62, minWidth: 62, backgroundColor: colors.primaryDeep },
  headerTxt: { color: "#fff", fontFamily: fonts.bold, fontSize: 13 },
  periodCell: {
    width: 62,
    paddingVertical: 10,
    backgroundColor: colors.goldSoft,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  periodNum: { fontFamily: fonts.bold, fontSize: 16, color: colors.goldDark, lineHeight: 18 },
  periodTxt: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted },
  cell: {
    flex: 1,
    minWidth: 96,
    minHeight: 60,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  cellFilled: { backgroundColor: colors.primarySoft },
  cellNonTeaching: { backgroundColor: colors.goldSoft },
  cellEmpty: { backgroundColor: "#fff" },
  cellEmptyAlt: { backgroundColor: "#FCFAF6" },
  cellClass: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary, textAlign: "center" },
  cellSubject: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.textSecondary, textAlign: "center", marginTop: 2 },
  cellNonTxt: { fontFamily: fonts.medium, fontSize: 11, color: colors.goldDark, textAlign: "center" },
  cellPlus: { fontSize: 18, color: "#EDE6D8" },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryTint,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: "center",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  legendTxt: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textSecondary },
  emptyState: { alignItems: "center", marginTop: 36, paddingHorizontal: 20 },
  teacherGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexGrow: 1,
    flexBasis: 190,
    minWidth: 165,
    maxWidth: 320,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  tCardActive: { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: colors.primaryTint },
  tAvatar: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  tAvatarTxt: { fontFamily: fonts.bold, fontSize: 18 },
  tName: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.text, textAlign: "right" },
  tSub: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, textAlign: "right", marginTop: 2 },
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
