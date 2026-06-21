import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, P, Input, Button, Row, IconBtn, Badge, Chip, PageHero } from "../lib/ui";
import { colors, fonts } from "../lib/theme";
import { CLASS_VISIT_DOMAINS, PERF_DOMAINS } from "../lib/forms";

// كل المؤشرات المتاحة للاختيار (من الاستمارتين، بدون تكرار الكود)
const ALL_INDICATORS: { code: string; text: string; domain: string }[] = [];
for (const d of [...PERF_DOMAINS, ...CLASS_VISIT_DOMAINS]) {
  for (const ind of d.indicators) {
    if (!ALL_INDICATORS.some((x) => x.code === ind.code)) ALL_INDICATORS.push({ code: ind.code, text: ind.text, domain: d.domain });
  }
}
const DOMAINS = [...new Set([...PERF_DOMAINS, ...CLASS_VISIT_DOMAINS].map((d) => d.domain))];

function copyText(t: string) {
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(t);
  } catch {}
}

export default function Assistant() {
  const generate = useAction(api.ai.generateRecommendation);
  const settings = useQuery(api.admin.getSettings, {});
  const setSetting = useMutation(api.admin.setSetting);

  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ source: string; text: string; suggestions: string[] } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const aiOn = settings?.aiEnabled === "true" || !!settings?.anthropicApiKey;

  const run = async () => {
    if (!prompt.trim() && !code) return;
    setLoading(true);
    try {
      const r = await generate({ prompt: prompt.trim() || (code ? ALL_INDICATORS.find((x) => x.code === code)?.text ?? "" : ""), code });
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const doCopy = (t: string) => { copyText(t); setCopied(t); setTimeout(() => setCopied(null), 1500); };

  const saveKey = async () => {
    await setSetting({ key: "anthropicApiKey", value: apiKey.trim() });
    setApiKey(""); setShowKey(false);
  };

  return (
    <Screen>
      <PageHero
        title="مساعد التوصيات الذكي"
        desc="اكتبي المجال أو وصف الحالة، واحصلي على توصية جاهزة — انسخيها للاستمارة مباشرة"
        icon="sparkles"
        gradient={["#B0883A", "#D4B05C"]}
      />

      <Card>
        <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <H2>اكتبي طلبك</H2>
          <Badge label={aiOn ? "الذكاء الاصطناعي مُفعّل" : "وضع البنك المحلي"} tone={aiOn ? "success" : "muted"} />
        </Row>
        <Input
          label="المجال أو وصف الحالة"
          placeholder="مثال: معلمة متميزة في إدارة الصف / التغذية الراجعة تحتاج تطوير"
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />

        <P muted style={{ fontSize: 12, marginTop: 4, marginBottom: 6 }}>أو اختاري المؤشر مباشرة:</P>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {ALL_INDICATORS.slice(0, 30).map((ind) => (
            <Chip key={ind.code} label={ind.code} active={code === ind.code} onPress={() => setCode(code === ind.code ? undefined : ind.code)} />
          ))}
        </View>
        {code ? <P style={{ fontSize: 12.5, color: colors.primary, marginTop: 6 }}>{ALL_INDICATORS.find((x) => x.code === code)?.text}</P> : null}

        <Button title={loading ? "جارٍ التوليد…" : "اقترح توصية"} icon="sparkles" onPress={run} style={{ marginTop: 10 }} />
      </Card>

      {result && (
        <Card style={{ backgroundColor: colors.goldSoft }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <H2>التوصية المقترحة</H2>
            <Badge label={result.source === "ai" ? "ذكاء اصطناعي" : "من البنك"} tone={result.source === "ai" ? "success" : "primary"} />
          </Row>
          <P style={{ fontSize: 14, lineHeight: 24, color: colors.text }}>{result.text}</P>
          <Row style={{ marginTop: 8 }}>
            <Button title={copied === result.text ? "تم النسخ ✓" : "نسخ"} icon="copy-outline" small variant="outline" onPress={() => doCopy(result.text)} />
          </Row>

          {result.suggestions.length > 1 && (
            <View style={{ marginTop: 12 }}>
              <P muted style={{ fontSize: 12.5, marginBottom: 6 }}>بدائل من البنك:</P>
              {result.suggestions.filter((s) => s !== result.text).map((s, i) => (
                <Pressable key={i} onPress={() => doCopy(s)} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Ionicons name={copied === s ? "checkmark-circle" : "copy-outline"} size={16} color={copied === s ? colors.success : colors.textMuted} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, textAlign: "right" }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Card>
      )}

      {/* تفعيل الذكاء الاصطناعي الحقيقي */}
      <Card>
        <Pressable onPress={() => setShowKey(!showKey)}>
          <Row style={{ justifyContent: "space-between" }}>
            <H2>تفعيل الذكاء الاصطناعي (اختياري)</H2>
            <Ionicons name={showKey ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
          </Row>
        </Pressable>
        {showKey && (
          <View style={{ marginTop: 8 }}>
            <P muted style={{ fontSize: 12.5, marginBottom: 8 }}>
              المساعد يعمل مجاناً من بنك التوصيات. لتفعيل التوليد الذكي الكامل (Claude)، أدخلي مفتاح Anthropic API هنا ويُحفظ بأمان في قاعدة بيانات قسمك.
            </P>
            <Input label="مفتاح Anthropic API" placeholder={aiOn ? "مفتاح محفوظ — أدخلي جديداً للتغيير" : "sk-ant-..."} value={apiKey} onChangeText={setApiKey} autoCapitalize="none" />
            <Row>
              <Button title="حفظ المفتاح" icon="key-outline" small onPress={saveKey} />
              {aiOn ? <Button title="إيقاف الذكاء الاصطناعي" variant="ghost" small onPress={async () => { await setSetting({ key: "anthropicApiKey", value: "" }); }} /> : null}
            </Row>
          </View>
        )}
      </Card>
    </Screen>
  );
}
