import React from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Loading, Row, Badge, ExportMenu, IconBtn } from "../../lib/ui";
import { colors } from "../../lib/theme";
import { setExportMode } from "../../lib/print";
import { printGroupMeeting, printIndividualMeeting } from "../../lib/printTemplates";

export default function MeetingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const meeting = useQuery(api.meetings.get, { id: id as any });
  const settings = useQuery(api.admin.getSettings, {});
  const sigUrl = useQuery(api.files.getUrl, (meeting as any)?.signatureId ? { storageId: (meeting as any).signatureId } : "skip");

  if (meeting === undefined) return <Loading />;
  if (!meeting) return <Screen><P>المحضر غير موجود</P></Screen>;

  const isGroup = meeting.type === "group";

  // تحويل صورة التوقيع إلى data URL لتُدمج في الطباعة/التصدير بدون مشاكل CORS
  const toDataUrl = async (url: string): Promise<string | undefined> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve) => { const fr = new FileReader(); fr.onload = () => resolve(fr.result as string); fr.onerror = () => resolve(undefined); fr.readAsDataURL(blob); });
    } catch { return undefined; }
  };

  const print = async () => {
    const sig = sigUrl ? await toDataUrl(sigUrl) : undefined;
    if (isGroup) printGroupMeeting(meeting, settings ?? {}, sig);
    else printIndividualMeeting(meeting, settings ?? {}, sig);
  };

  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <H2>{isGroup ? `محضر اجتماع (${meeting.number ?? ""})` : `اجتماع فردي — ${meeting.teacherName ?? ""}`}</H2>
          <Row>
            <IconBtn name="pencil-outline" color={colors.primary} onPress={() => router.push(`/meetings/new?id=${id}` as any)} />
            <ExportMenu run={async (m) => { setExportMode(m, `محضر اجتماع - ${meeting.number ?? meeting.date ?? ""}`); await print(); }} />
            <Badge label={meeting.date} tone="primary" />
          </Row>
        </Row>
        {meeting.place ? <P muted>المكان: {meeting.place} {meeting.time ? `• ${meeting.time}` : ""}</P> : null}
        {isGroup ? (
          <>
            <P>الحضور: {meeting.attendees ?? "-"}</P>
            <P>الغياب: {meeting.absentees || "لا يوجد"}</P>
          </>
        ) : (
          <P>{meeting.goal ?? ""}</P>
        )}
      </Card>

      {meeting.items.map((it, i) => (
        <Card key={i}>
          <H2>{it.title}</H2>
          <P>{it.content}</P>
        </Card>
      ))}

      {meeting.recommendations ? <Card><H2>التوصيات</H2><P>{meeting.recommendations}</P></Card> : null}
      {meeting.followUp ? <Card><H2>متابعة التوصيات</H2><P>{meeting.followUp}</P></Card> : null}
    </Screen>
  );
}
