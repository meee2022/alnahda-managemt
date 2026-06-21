import React from "react";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Button, Loading, Row, Badge } from "../../lib/ui";
import { printGroupMeeting, printIndividualMeeting } from "../../lib/printTemplates";

export default function MeetingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const meeting = useQuery(api.meetings.get, { id: id as any });
  const settings = useQuery(api.admin.getSettings, {});

  if (meeting === undefined) return <Loading />;
  if (!meeting) return <Screen><P>المحضر غير موجود</P></Screen>;

  const isGroup = meeting.type === "group";

  const print = () => {
    if (isGroup) printGroupMeeting(meeting, settings ?? {});
    else printIndividualMeeting(meeting, settings ?? {});
  };

  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <H2>{isGroup ? `محضر اجتماع (${meeting.number ?? ""})` : `اجتماع فردي — ${meeting.teacherName ?? ""}`}</H2>
          <Badge label={meeting.date} tone="primary" />
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
        <Button title="طباعة المحضر" icon="print-outline" onPress={print} style={{ marginTop: 10 }} />
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
