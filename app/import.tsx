import React, { useState } from "react";
import { View, Text, Platform } from "react-native";
import { router } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, P, Button, Row, Badge, Chip, PageHero } from "../lib/ui";
import { colors, fonts } from "../lib/theme";

type Stage = "idle" | "uploading" | "extracting" | "review" | "saving";

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

export default function ImportForm() {
  const settings = useQuery(api.admin.getSettings, {});
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const extractForm = useAction(api.aiExtract.extractForm);
  const createPerf = useMutation(api.performance.create);
  const createVisit = useMutation(api.classVisits.create);

  const [formType, setFormType] = useState<"performance" | "classVisit">("performance");
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [storageId, setStorageId] = useState<string | null>(null);

  const aiOn = settings?.aiEnabled === "true" || !!settings?.anthropicApiKey;

  const run = async () => {
    setError(null);
    const file = await pickFile();
    if (!file) return;
    setFileName(file.name);
    const mediaType = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    try {
      setStage("uploading");
      const url = await generateUploadUrl();
      const up = await fetch(url, { method: "POST", headers: { "Content-Type": mediaType }, body: file });
      const { storageId: sid } = await up.json();
      setStorageId(sid);

      setStage("extracting");
      const r = await extractForm({ storageId: sid as any, mediaType, formType });
      if (!r.ok) { setError(r.error ?? "تعذّر التحليل."); setStage("idle"); return; }
      setData(r.data);
      setStage("review");
    } catch (e: any) {
      setError(`خطأ: ${String(e?.message ?? e).slice(0, 160)}`);
      setStage("idle");
    }
  };

  const save = async () => {
    if (!data) return;
    setStage("saving");
    try {
      if (formType === "classVisit") {
        await createVisit({
          teacherName: data.teacherName || "", subject: data.subject || "اللغة العربية",
          grade: data.grade || "الأول", section: data.section || "A",
          date: data.date || "", lessonTopic: data.lessonTopic || "", visitor: data.visitor || (settings?.coordinator ?? ""),
          visitType: data.visitType || "كلية",
          scores: (data.scores ?? data.indicators ?? []).map((i: any) => ({ code: String(i.code), score: typeof i.score === "number" ? i.score : -1, recommendation: i.recommendation || "" })),
          recommendations: data.recommendations || data.generalRecommendations || "",
          sourceFileId: (storageId as any) ?? undefined,
        });
        router.replace("/evaluations/class-visit");
        return;
      }
      await createPerf({
        date: data.date || "", subject: data.subject || "اللغة العربية",
        unit: data.unit || "", lessonTitle: data.lessonTitle || "",
        visitType: data.visitType || "كلي",
        teacherName: data.teacherName || "", employeeNo: data.employeeNo || "",
        jobTitle: data.jobTitle || "", nationality: data.nationality || "", specialization: data.specialization || "",
        grade: data.grade || "الأول", section: data.section || "A",
        deputyName: data.deputyName || "",
        indicators: (data.indicators ?? []).map((i: any) => ({ code: String(i.code), score: typeof i.score === "number" ? i.score : -1, recommendation: i.recommendation || "" })),
        generalRecommendations: data.generalRecommendations || "", nextSteps: data.nextSteps || "",
        trainingNeeds: data.trainingNeeds || "", additionalNotes: data.additionalNotes || "",
        coordinatorName: settings?.coordinator,
        sourceFileId: (storageId as any) ?? undefined,
      });
      router.replace("/evaluations/performance");
    } catch (e: any) {
      setError(`تعذّر الحفظ: ${String(e?.message ?? e).slice(0, 160)}`);
      setStage("review");
    }
  };

  const busy = stage === "uploading" || stage === "extracting" || stage === "saving";
  const stageLabel = stage === "uploading" ? "جارٍ رفع الملف…" : stage === "extracting" ? "جارٍ تحليل الاستمارة بالذكاء الاصطناعي…" : stage === "saving" ? "جارٍ الحفظ…" : "";

  return (
    <Screen>
      <PageHero
        title="رفع وتحليل استمارة خارجية"
        desc="ارفعي استمارة الموجِّهة (PDF أو صورة) ويحلّلها الموقع ويعبّيها تلقائياً"
        icon="cloud-upload"
        gradient={["#4A0F1B", "#5C1523"]}
      />

      {!aiOn && (
        <Card style={{ backgroundColor: colors.warningSoft, borderColor: colors.warning, borderWidth: 1 }}>
          <Row style={{ gap: 8 }}>
            <Ionicons name="key-outline" size={18} color={colors.warning} />
            <P style={{ flex: 1, fontSize: 13 }}>التحليل الذكي يحتاج تفعيل مفتاح Anthropic API من «مساعد التوصيات» أولاً. بدونه لن يعمل الرفع التلقائي.</P>
          </Row>
          <Button title="فتح مساعد التوصيات للتفعيل" icon="sparkles" small variant="outline" onPress={() => router.push("/assistant")} />
        </Card>
      )}

      <Card>
        <H2>نوع الاستمارة</H2>
        <Row style={{ flexWrap: "wrap", marginTop: 4 }}>
          <Chip label="متابعة الأداء (التوجيه)" active={formType === "performance"} onPress={() => setFormType("performance")} />
          <Chip label="الزيارة الصفية" active={formType === "classVisit"} onPress={() => setFormType("classVisit")} />
        </Row>
      </Card>

      <Card>
        <H2>الخطوات</H2>
        <P muted style={{ fontSize: 13, lineHeight: 22 }}>
          ١) اضغطي «اختاري الملف» وحدّدي استمارة الموجِّهة (PDF أو صورة).{"\n"}
          ٢) ينفّذ الموقع الرفع ثم التحليل تلقائياً.{"\n"}
          ٣) راجعي البيانات المستخرجة ثم احفظيها — تُضاف لاستمارات متابعة الأداء.
        </P>
        <Button title="اختاري الملف وابدئي" icon="cloud-upload-outline" onPress={run} loading={busy} />
        {fileName ? <P muted style={{ fontSize: 12, marginTop: 6 }}>الملف: {fileName}</P> : null}
        {busy ? <P style={{ color: colors.primary, fontSize: 13, marginTop: 8 }}>{stageLabel}</P> : null}
        {error ? <P style={{ color: colors.danger, fontSize: 13, marginTop: 8 }}>{error}</P> : null}
      </Card>

      {stage === "review" && data && (
        <Card style={{ backgroundColor: colors.goldSoft }}>
          <Row style={{ justifyContent: "space-between" }}>
            <H2>راجعي البيانات المستخرجة</H2>
            <Badge label={`${(data.indicators ?? data.scores ?? []).length} مؤشر`} tone="primary" />
          </Row>
          <View style={{ marginTop: 6 }}>
            {[
              ["المعلمة", data.teacherName], ["الرقم الوظيفي", data.employeeNo], ["التخصص", data.specialization],
              ["المادة", data.subject], ["الصف/الشعبة", [data.grade, data.section].filter(Boolean).join(" ")],
              ["التاريخ", data.date], ["عنوان الدرس", data.lessonTitle], ["نوع الزيارة", data.visitType],
            ].filter(([, v]) => v).map(([k, v]: any, i) => (
              <Row key={i} style={{ justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 12.5, color: colors.textSecondary }}>{k}</Text>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.text, flex: 1, textAlign: "left" }}>{v}</Text>
              </Row>
            ))}
          </View>
          {data.generalRecommendations ? <P style={{ fontSize: 12.5, marginTop: 8 }}>التوصيات العامة: {data.generalRecommendations}</P> : null}
          <Row style={{ marginTop: 10 }}>
            <Button title="حفظ في الاستمارات" icon="checkmark" onPress={save} />
            <Button title="إلغاء" variant="ghost" small onPress={() => { setStage("idle"); setData(null); }} />
          </Row>
          <P muted style={{ fontSize: 11.5, marginTop: 6 }}>راجعي الدقة قبل الحفظ — يمكنك تعديل أي حقل لاحقاً من الاستمارة.</P>
        </Card>
      )}
    </Screen>
  );
}
