import React from "react";
import { Platform } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { IconBtn } from "./ui";
import { colors } from "./theme";

// زر يفتح الملف الأصلي المؤرشف للاستمارة (يظهر فقط عند وجود ملف)
export function SourceFileBtn({ storageId }: { storageId?: string }) {
  const url = useQuery(api.files.getUrl, storageId ? { storageId: storageId as any } : "skip");
  if (!storageId) return null;
  return (
    <IconBtn
      name="attach-outline"
      color={colors.accent}
      onPress={() => {
        if (url && Platform.OS === "web" && typeof window !== "undefined") window.open(url, "_blank");
      }}
    />
  );
}
