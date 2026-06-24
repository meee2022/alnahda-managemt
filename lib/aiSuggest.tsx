import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "./ui";

// زر «اقترح بالذكاء» يُعاد استخدامه بجانب أي حقل نصّي داخل الاستمارات.
// يستدعي مساعد التوصيات (Claude إن توفّر المفتاح، وإلا بنك التوصيات المحلي).
// prompt: وصف سياقي للحقل يُبنى من حالة الاستمارة الحالية.
// onResult: تتلقّى النص المقترح لتضعه/تدمجه في الحقل.
export function AiSuggest({
  prompt,
  onResult,
  label = "اقترح بالذكاء",
}: {
  prompt: string;
  onResult: (text: string) => void;
  label?: string;
}) {
  const generate = useAction(api.ai.generateRecommendation);
  const [loading, setLoading] = useState(false);
  return (
    <Button
      title={loading ? "جارٍ الاقتراح…" : label}
      icon="sparkles"
      variant="outline"
      small
      onPress={async () => {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        try {
          const r = await generate({ prompt });
          if (r?.text) onResult(r.text);
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}
