import React, { useState } from "react";
import { View, Platform } from "react-native";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Row, Badge, PageHero } from "../lib/ui";
import { colors } from "../lib/theme";

export default function Admin() {
  const convex = useConvex();
  const settings = useQuery(api.admin.getSettings, {});
  const stats = useQuery(api.admin.dashboardStats, {});
  const setSetting = useMutation(api.admin.setSetting);
  const seed = useMutation(api.admin.seed);
  const seedBank = useMutation(api.performance.seedBank);
  const seedRoster = useMutation(api.teachers.seedRoster);
  const cleanupFiles = useMutation(api.files.cleanupOrphans);
  const [cleaning, setCleaning] = React.useState(false);

  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");
  const [backing, setBacking] = useState(false);

  const backup = async () => {
    setBacking(true);
    try {
      const dump = await convex.query(api.admin.exportAll, {});
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const d = new Date();
        a.href = url;
        a.download = `نسخة-احتياطية-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally { setBacking(false); }
  };

  if (settings === undefined) return <Loading />;

  const FIELDS: [string, string][] = [
    ["school", "اسم المدرسة"],
    ["department", "اسم القسم"],
    ["coordinator", "اسم المنسقة"],
    ["academicYear", "العام الأكاديمي"],
    ["principal", "مديرة المدرسة"],
    ["academicDeputy", "النائبة الأكاديمية"],
    ["adminDeputy", "النائبة الإدارية"],
    ["vision", "الرؤية (تظهر أسفل كل مطبوعة)"],
    ["mission", "الرسالة (تظهر أسفل كل مطبوعة)"],
  ];

  const save = async () => {
    for (const [key] of FIELDS) {
      const val = form[key];
      if (val !== undefined && val !== settings[key]) await setSetting({ key, value: val });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Screen>
      <PageHero
        title="لوحة التحكم"
        desc="بيانات المدرسة والقسم والأسماء الرسمية — تنعكس تلقائياً على كل الاستمارات والمطبوعات"
        icon="options"
        gradient={["#4A0F1B", "#5C1523"]}
      />

      <Card>
        <H2>بيانات المدرسة والقسم</H2>
        <P muted style={{ marginBottom: 10 }}>هذه البيانات تظهر تلقائياً في كل الاستمارات والمطبوعات.</P>
        {FIELDS.map(([key, label]) => (
          <Input key={key} label={label} value={form[key] ?? settings[key] ?? ""} onChangeText={(v) => setForm({ ...form, [key]: v })} />
        ))}
        <Row>
          <Button title="حفظ التغييرات" icon="checkmark" onPress={save} />
          {saved && <Badge label="تم الحفظ ✔" tone="success" />}
        </Row>
      </Card>

      <Card>
        <H2>قاعدة البيانات</H2>
        {stats && (
          <Row style={{ flexWrap: "wrap", marginBottom: 10 }}>
            <Badge label={`${stats.teachers} معلمة`} tone="primary" />
            <Badge label={`${stats.students} طالبة`} tone="accent" />
            <Badge label={`${stats.meetings} اجتماع`} tone="muted" />
            <Badge label={`${stats.visits} زيارة`} tone="muted" />
            <Badge label={`${stats.trainings} برنامج تدريبي`} tone="muted" />
          </Row>
        )}
        <P muted style={{ marginBottom: 10 }}>
          استيراد البيانات الأولية من ملفات القسم (أسماء المعلمات والطالبات والشعب). يعمل مرة واحدة فقط.
        </P>
        <Button title="استيراد البيانات الأولية" icon="cloud-download-outline" variant="outline" onPress={() => seed({})} />
      </Card>

      <Card>
        <H2>الاستيراد من الاستمارات المعبأة</H2>
        <P muted style={{ marginBottom: 10 }}>
          استخراج بنك التوصيات (أكثر من 190 توصية جاهزة) وبيانات المعلمات (الرقم الوظيفي، التخصص، الصف…) من الاستمارات السابقة. آمن لإعادة التشغيل — يتجاهل المكرر.
        </P>
        <Row style={{ flexWrap: "wrap" }}>
          <Button title="استيراد بنك التوصيات" icon="albums-outline" variant="outline"
            onPress={async () => { const r = await seedBank({}); setMsg(`أُضيفت ${r.added} توصية للبنك`); setTimeout(() => setMsg(""), 3000); }} />
          <Button title="استيراد بيانات المعلمات" icon="people-outline" variant="outline"
            onPress={async () => { const r = await seedRoster({}); setMsg(`معلمات جديدة: ${r.added} • محدّثة: ${r.updated}`); setTimeout(() => setMsg(""), 3000); }} />
        </Row>
        {msg ? <Badge label={msg} tone="success" /> : null}
      </Card>

      <Card>
        <H2>تنظيف الملفات المؤقتة</H2>
        <P muted style={{ marginBottom: 10 }}>
          يحذف ملفات الرفع القديمة المتراكمة (التي حُلّلت بالذكاء ولم تُؤرشف) لتوفير مساحة التخزين. آمن — يُبقي الملفات المرتبطة بالسجلات (توقيع الاجتماع، الملف الأصلي للزيارة ومتابعة الأداء).
        </P>
        <Button title={cleaning ? "جارٍ التنظيف…" : "تنظيف الملفات غير المرتبطة"} icon="trash-bin-outline" variant="outline" loading={cleaning}
          onPress={async () => {
            if (typeof window !== "undefined" && !window.confirm("حذف كل ملفات الرفع غير المرتبطة بأي سجل؟")) return;
            setCleaning(true);
            try { const r = await cleanupFiles({}); setMsg(`حُذف ${r.deleted} ملف (تحرير ~${r.freedKB} ك.ب) • أُبقي ${r.kept} مؤرشف`); setTimeout(() => setMsg(""), 5000); }
            finally { setCleaning(false); }
          }} />
        {msg ? <Badge label={msg} tone="success" /> : null}
      </Card>

      <Card>
        <H2>النسخ الاحتياطي</H2>
        <P muted style={{ marginBottom: 10 }}>
          حمّلي نسخة كاملة من كل بيانات القسم (المعلمات، الطالبات، الاستمارات، السجلات، البنك...) كملف واحد للأرشفة والأمان. يُنصح بعملها دورياً.
        </P>
        <Button title={backing ? "جارٍ التحضير…" : "تحميل نسخة احتياطية (JSON)"} icon="download-outline" variant="outline" loading={backing} onPress={backup} />
      </Card>

      <Card>
        <H2>عن المنصة</H2>
        <P>منصة إلكترونية لإدارة قسم المسار الأدبي — مدرسة النهضة الابتدائية للبنات.</P>
        <P muted style={{ fontSize: 12.5 }}>تشمل: الاجتماعات، الزيارات الصفية، تقييم المعلمات، متابعة الطالبات، التحصيل الأكاديمي، الخطط، التطوير المهني، التقارير، والطباعة الرسمية لكل الاستمارات.</P>
      </Card>
    </Screen>
  );
}
