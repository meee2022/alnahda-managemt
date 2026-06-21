import React, { useState, useRef } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, P, Input, Button, Row, PageHero } from "../lib/ui";
import { colors, fonts, radius } from "../lib/theme";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "لخّصي لي أداء القسم هذا الفصل",
  "اكتبي خطة تحسين لمعلمة ضعيفة في إدارة الصف",
  "مين المعلمات الأكثر استئذاناً؟",
  "اقترحي 3 أفكار لرفع التحصيل الأكاديمي",
];

export default function Chat() {
  const settings = useQuery(api.admin.getSettings, {});
  const chat = useAction(api.ai.chat);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const aiOn = settings?.aiEnabled === "true" || !!settings?.anthropicApiKey;

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setErr(null);
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const r = await chat({ messages: next });
      if (!r.ok) { setErr(r.error ?? "تعذّر الرد."); setBusy(false); return; }
      setMessages([...next, { role: "assistant", content: r.reply ?? "" }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <PageHero
        title="المساعد الذكي (محادثة)"
        desc="تحدّثي معه بكلامك: تلخيص، خطط تحسين، صياغة، أسئلة عن بيانات القسم"
        icon="chatbubbles"
        gradient={["#B0883A", "#D4B05C"]}
      />

      {!aiOn && (
        <Card style={{ backgroundColor: colors.warningSoft }}>
          <P style={{ fontSize: 13 }}>المحادثة تحتاج تفعيل مفتاح Anthropic API من «مساعد التوصيات».</P>
        </Card>
      )}

      {messages.length === 0 && (
        <Card>
          <P muted style={{ fontSize: 13, marginBottom: 8 }}>جرّبي تسألي:</P>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} onPress={() => send(s)}
                style={{ backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 12.5, color: colors.primary }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      <ScrollView ref={scrollRef} style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
        {messages.map((m, i) => (
          <View key={i} style={{ alignSelf: m.role === "user" ? "flex-start" : "flex-end", maxWidth: "88%" }}>
            <View style={{
              backgroundColor: m.role === "user" ? colors.primary : colors.card,
              borderColor: colors.border, borderWidth: m.role === "user" ? 0 : 1,
              borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10,
            }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 23, color: m.role === "user" ? "#fff" : colors.text, textAlign: "right" }}>{m.content}</Text>
            </View>
          </View>
        ))}
        {busy && (
          <View style={{ alignSelf: "flex-end" }}>
            <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted }}>يكتب…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {err ? <P style={{ color: colors.danger, fontSize: 12.5 }}>{err}</P> : null}

      <Card style={{ marginTop: 6 }}>
        <Input placeholder="اكتبي رسالتك…" value={input} onChangeText={setInput} multiline
          onSubmitEditing={() => send()} />
        <Row style={{ justifyContent: "space-between" }}>
          <Button title="إرسال" icon="send" small onPress={() => send()} loading={busy} />
          {messages.length > 0 ? <Button title="محادثة جديدة" icon="refresh" variant="ghost" small onPress={() => { setMessages([]); setErr(null); }} /> : null}
        </Row>
      </Card>
    </Screen>
  );
}
