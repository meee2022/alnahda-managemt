import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Loading, Empty, Row, Badge, PageHero, HeroBtn } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { printTeacherDossier } from "../../lib/printTemplates";

const Line = ({ children }: { children: React.ReactNode }) => (
  <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>{children}</View>
);

export default function TeacherReport() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const d = useQuery(api.analytics.teacherDossier, id ? { teacherId: id as any } : "skip");
  const settings = useQuery(api.admin.getSettings, {});

  if (!id) return <Empty text="لم تُحدّد المعلمة" icon="person-outline" />;
  if (d === undefined) return <Loading />;
  if (d === null) return <Empty text="المعلمة غير موجودة" icon="person-outline" />;

  const t = d.teacher as any;
  const Section = ({ title, count, children }: { title: string; count: number; children?: React.ReactNode }) => (
    <Card>
      <Row style={{ justifyContent: "space-between", marginBottom: count ? 8 : 0 }}>
        <H2>{title}</H2>
        <Badge label={String(count)} tone={count ? "primary" : "muted"} />
      </Row>
      {count ? children : <P muted style={{ fontSize: 12.5 }}>لا يوجد.</P>}
    </Card>
  );

  return (
    <Screen>
      <PageHero
        title={t.name}
        desc={`${t.grade ?? ""}${t.section ? " " + t.section : ""} · ${t.subject ?? ""}${t.employeeNumber ? " · #" + t.employeeNumber : ""}`}
        icon="person"
        gradient={["#5E0E24", "#9A1B3C"]}
      >
        <HeroBtn title="طباعة الملف الكامل" icon="print-outline" prominent onPress={() => printTeacherDossier(d, settings ?? {})} />
      </PageHero>

      <Section title="الاستئذانات" count={d.leaves.length}>
        {d.leaves.map((x: any, i: number) => (
          <Line key={i}><Row style={{ justifyContent: "space-between" }}><P style={{ fontSize: 13 }}>{x.reason}</P><P muted style={{ fontSize: 12 }}>{x.date}{x.fromTime ? ` · ${x.fromTime}-${x.toTime ?? ""}` : ""}</P></Row></Line>
        ))}
      </Section>

      <Section title="الغيابات" count={d.absences.length}>
        {d.absences.map((x: any, i: number) => (
          <Line key={i}><Row style={{ justifyContent: "space-between" }}><P style={{ fontSize: 13 }}>{x.reason} — احتياط: {x.coverTeacher}</P><P muted style={{ fontSize: 12 }}>{x.date}</P></Row></Line>
        ))}
      </Section>

      <Section title="حصص الاحتياط التي نفّذتها" count={d.coversDone.length}>
        {d.coversDone.map((x: any, i: number) => (
          <Line key={i}><Row style={{ justifyContent: "space-between" }}><P style={{ fontSize: 13 }}>عن {x.absent} · {x.grade ?? ""} {x.section ?? ""}</P><P muted style={{ fontSize: 12 }}>{x.date}</P></Row></Line>
        ))}
      </Section>

      <Section title="الزيارات الصفية" count={d.visits.length}>
        {d.visits.map((x: any, i: number) => (
          <Line key={i}><Row style={{ justifyContent: "space-between" }}><P style={{ fontSize: 13 }}>{x.subject} · {x.type}</P><P muted style={{ fontSize: 12 }}>{x.date}</P></Row></Line>
        ))}
      </Section>

      <Section title="متابعات الأداء" count={d.perf.length}>
        {d.perf.map((x: any, i: number) => (
          <Line key={i}><Row style={{ justifyContent: "space-between" }}><P style={{ fontSize: 13 }}>{x.subject} {x.unit ? `· ${x.unit}` : ""}</P><P muted style={{ fontSize: 12 }}>{x.date}</P></Row></Line>
        ))}
      </Section>

      <Section title="التقييمات السنوية" count={d.annualEvals.length}>
        {d.annualEvals.map((x: any, i: number) => (
          <Line key={i}><Row style={{ justifyContent: "space-between" }}><P style={{ fontSize: 13 }}>{x.year}</P><Badge label={`${x.total}% ${x.level ?? ""}`} tone={x.total >= 90 ? "success" : "primary"} /></Row></Line>
        ))}
      </Section>

      <P muted style={{ fontSize: 12.5, textAlign: "center", marginTop: 4 }}>التقارير الدورية: {d.periodicReports.length}</P>
    </Screen>
  );
}
