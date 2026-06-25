import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Image, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, Input, Button, Row, IconBtn, P, PageHero } from "../../lib/ui";
import { DateField, TimeField } from "../../lib/pickers";
import { colors, radius, fonts } from "../../lib/theme";
import { AiSuggest } from "../../lib/aiSuggest";

export default function NewMeeting() {
  const { type = "group", id } = useLocalSearchParams<{ type?: string; id?: string }>();
  const create = useMutation(api.meetings.create);
  const update = useMutation(api.meetings.update);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const settings = useQuery(api.admin.getSettings, {});
  const existing = useQuery(api.meetings.get, id ? { id: id as any } : "skip");
  const [loaded, setLoaded] = useState(false);
  const [signatureId, setSignatureId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const sigUrl = useQuery(api.files.getUrl, signatureId ? { storageId: signatureId as any } : "skip");

  const pickSignature = async () => {
    if (Platform.OS !== "web") return;
    const file: File | null = await new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/*";
      (input as any).capture = "environment"; // يتيح الكاميرا على الجوال
      input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null);
      input.click();
    });
    if (!file) return;
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const up = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await up.json();
      setSignatureId(storageId);
    } finally { setUploading(false); }
  };
  // في وضع التعديل يُؤخذ النوع من المحضر المحمَّل، وإلا من رابط الإنشاء
  const isGroup = id ? existing?.type === "group" : type === "group";

  const [form, setForm] = useState({
    number: "", date: "", time: "", place: "غرفة المدرسات",
    leader: "منسقة القسم", attendees: isGroup ? "جميع معلمات القسم" : "",
    absentees: "", teacherName: "", goal: "", recommendations: "", followUp: "",
  });
  // بنك البنود المقترحة — تُضاف بضغطة، وليست إلزامية (كل اجتماع يختار ما يناسبه)
  const GROUP_ITEMS = [
    "أولويات المدرسة",
    "شكر وتقدير",
    "توصيات مديرة المدرسة والنائبة الأكاديمية",
    "نقل توصيات النائبة الإدارية",
    "المنسقة",
    "ممارسات متميزة",
    "الموجه التربوي",
    "نقل الخبرة",
  ];
  const INDIVIDUAL_ITEMS = [
    "التهيئة",
    "نشاط (1)",
    "نشاط (2)",
    "التدريب المستقل",
    "الغلق",
    "الأعمال الكتابية",
  ];
  const BANK = isGroup ? GROUP_ITEMS : INDIVIDUAL_ITEMS;
  // تبدأ فارغة — المنسقة تختار البنود التي تريدها لكل اجتماع
  const [items, setItems] = useState<{ title: string; content: string }[]>([]);

  // تعبئة النموذج من المحضر المحمَّل مرة واحدة عند وصول البيانات
  useEffect(() => {
    if (!id || loaded || !existing) return;
    setForm({
      number: existing.number ?? "",
      date: existing.date ?? "",
      time: existing.time ?? "",
      place: existing.place ?? "",
      leader: existing.leader ?? "",
      attendees: existing.attendees ?? "",
      absentees: existing.absentees ?? "",
      teacherName: existing.teacherName ?? "",
      goal: existing.goal ?? "",
      recommendations: existing.recommendations ?? "",
      followUp: existing.followUp ?? "",
    });
    setItems((existing.items ?? []).map((it) => ({ title: it.title, content: it.content })));
    setSignatureId((existing as any).signatureId ?? null);
    setLoaded(true);
  }, [id, loaded, existing]);

  const addItem = (title: string) => setItems((p) => [...p, { title, content: "" }]);
  const available = BANK.filter((b) => !items.some((it) => it.title === b));

  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.date.trim()) {
      if (typeof window !== "undefined") window.alert("يرجى تحديد تاريخ الاجتماع أولاً قبل الحفظ.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: isGroup ? "group" : "individual",
        ...form,
        items: items.filter((i) => i.title.trim() || i.content.trim()),
        signatureId: (signatureId as any) ?? undefined,
      };
      if (id) await update({ id: id as any, ...payload });
      else await create(payload);
      router.back();
    } catch (e: any) {
      if (typeof window !== "undefined") window.alert("تعذّر حفظ المحضر: " + String(e?.message ?? e).slice(0, 180));
      setSaving(false);
    }
  };

  return (
    <Screen>
      <PageHero
        title={id ? "تعديل المحضر" : isGroup ? "محضر اجتماع أكاديمي جديد" : "محضر اجتماع فردي جديد"}
        desc={`${settings?.school ?? ""} — يُحفظ ويُطبع بنفس النموذج الرسمي`}
        icon={isGroup ? "chatbubbles" : "person"}
        gradient={isGroup ? ["#4A0F1B", "#5C1523"] : ["#3B0A14", "#5C1523"]}
      />
      <Card>
        {isGroup && <Input label="رقم الاجتماع" value={form.number} onChangeText={(v) => setForm({ ...form, number: v })} />}
        <DateField label="التاريخ" value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} />
        <TimeField label="الوقت" value={form.time} onChange={(v) => setForm((p) => ({ ...p, time: v }))} />
        <Input label="المكان" value={form.place} onChangeText={(v) => setForm({ ...form, place: v })} />
        {isGroup ? (
          <>
            <Input label="الاجتماع بقيادة" value={form.leader} onChangeText={(v) => setForm({ ...form, leader: v })} />
            <Input label="الحضور" value={form.attendees} onChangeText={(v) => setForm({ ...form, attendees: v })} />
            <Input label="الغياب" value={form.absentees} onChangeText={(v) => setForm({ ...form, absentees: v })} />
          </>
        ) : (
          <>
            <Input label="اسم المعلمة" value={form.teacherName} onChangeText={(v) => setForm({ ...form, teacherName: v })} />
            <Input label="هدف الاجتماع" value={form.goal} onChangeText={(v) => setForm({ ...form, goal: v })} multiline />
          </>
        )}
      </Card>

      <Card>
        <H2>{isGroup ? "بنود الاجتماع" : "محاور الاجتماع"}</H2>
        <P muted style={{ marginBottom: 10 }}>
          اضغط على البند لإضافته — كل اجتماع يختار ما يناسبه، وليست كل البنود إلزامية.
        </P>

        {/* بنك البنود المقترحة — تُضاف بضغطة */}
        {available.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {available.map((b) => (
              <Pressable
                key={b}
                onPress={() => addItem(b)}
                style={({ hovered, pressed }: any) => [
                  {
                    flexDirection: "row", alignItems: "center", gap: 5,
                    backgroundColor: colors.primarySoft, borderColor: colors.primary,
                    borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
                  },
                  hovered && { backgroundColor: colors.primary },
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                {({ hovered }: any) => (
                  <>
                    <Ionicons name="add" size={15} color={hovered ? "#fff" : colors.primary} />
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: hovered ? "#fff" : colors.primary }}>{b}</Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* البنود المضافة */}
        {items.map((it, idx) => (
          <Card key={idx} style={{ backgroundColor: colors.bg, marginBottom: 8 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.primary, textAlign: "right", flex: 1 }}>
                {it.title || `بند ${idx + 1}`}
              </Text>
              <IconBtn name="close-circle-outline" color={colors.danger} onPress={() => setItems(items.filter((_, i) => i !== idx))} />
            </Row>
            {!it.title && (
              <Input label="عنوان البند" value={it.title} onChangeText={(v) => setItems(items.map((x, i) => (i === idx ? { ...x, title: v } : x)))} />
            )}
            <Input label="ما تم مناقشته" value={it.content} multiline onChangeText={(v) => setItems(items.map((x, i) => (i === idx ? { ...x, content: v } : x)))} />
          </Card>
        ))}

        <Button title="بند مخصص" icon="add" variant="outline" small onPress={() => addItem("")} />
      </Card>

      <Card>
        <Input label="التوصيات" value={form.recommendations} onChangeText={(v) => setForm({ ...form, recommendations: v })} multiline />
        <AiSuggest prompt={`توصيات اجتماع قسم المسار الأدبي${form.goal ? ` حول: ${form.goal}` : ""}.`}
          onResult={(t) => setForm((p) => ({ ...p, recommendations: p.recommendations ? p.recommendations + "\n" + t : t }))} />
        <Input label="متابعة التوصيات / خطوات قادمة" value={form.followUp} onChangeText={(v) => setForm({ ...form, followUp: v })} multiline />
        <AiSuggest prompt={`خطوات متابعة عملية لتنفيذ توصيات اجتماع القسم${form.goal ? ` حول: ${form.goal}` : ""}.`}
          onResult={(t) => setForm((p) => ({ ...p, followUp: p.followUp ? p.followUp + "\n" + t : t }))} />
      </Card>

      <Card>
        <H2>التوقيع</H2>
        <P muted style={{ marginBottom: 10 }}>ارفعي صورة التوقيع (من ألبوم الصور أو الكاميرا) لتظهر في الاستمارة عند الطباعة/التصدير.</P>
        {sigUrl ? (
          <View style={{ alignItems: "center", marginBottom: 10 }}>
            <Image source={{ uri: sigUrl }} style={{ width: 220, height: 110, resizeMode: "contain", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: "#fff" }} />
          </View>
        ) : null}
        <Row>
          <Button title={uploading ? "جارٍ الرفع…" : sigUrl ? "تغيير صورة التوقيع" : "رفع صورة التوقيع"} icon="cloud-upload-outline" variant="outline" small onPress={pickSignature} />
          {signatureId ? <Button title="إزالة" variant="ghost" small onPress={() => setSignatureId(null)} /> : null}
        </Row>
      </Card>

      <Card>
        <Button title={saving ? "جارٍ الحفظ…" : "حفظ المحضر"} icon="checkmark" loading={saving} disabled={saving} onPress={save} />
      </Card>
    </Screen>
  );
}
