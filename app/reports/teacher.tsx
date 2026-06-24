import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Loading, Empty, Row, Badge, PageHero, ExportMenu, DataTable, type Col } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { setExportMode } from "../../lib/print";
import { printTeacherDossier } from "../../lib/printTemplates";

export default function TeacherReport() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const d = useQuery(api.analytics.teacherDossier, id ? { teacherId: id as any } : "skip");
  const settings = useQuery(api.admin.getSettings, {});

  if (!id) return <Empty text="لم تُحدّد المعلمة" icon="person-outline" />;
  if (d === undefined) return <Loading />;
  if (d === null) return <Empty text="المعلمة غير موجودة" icon="person-outline" />;

  const t = d.teacher as any;
  // قسم جدولي مرتّب — عنوان + عدّاد + جدول بيانات (أو رسالة فراغ)
  const SectionTable = ({ title, count, data, columns }: { title: string; count: number; data: any[]; columns: Col<any>[] }) => (
    <View style={{ marginBottom: 14 }}>
      <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <H2>{title}</H2>
        <Badge label={String(count)} tone={count ? "primary" : "muted"} />
      </Row>
      {count ? (
        <DataTable data={data} columns={columns} minWidth={520} />
      ) : (
        <Card><P muted style={{ fontSize: 12.5 }}>لا يوجد.</P></Card>
      )}
    </View>
  );

  return (
    <Screen>
      <PageHero
        title={t.name}
        desc={`${t.grade ?? ""}${t.section ? " " + t.section : ""} · ${t.subject ?? ""}${t.employeeNumber ? " · #" + t.employeeNumber : ""}`}
        icon="person"
        gradient={["#4A0F1B", "#5C1523"]}
      >
        <ExportMenu color="#fff" run={(m) => { setExportMode(m, `ملف المعلمة - ${t.name ?? ""}`); printTeacherDossier(d, settings ?? {}); }} />
      </PageHero>

      <SectionTable title="الاستئذانات" count={d.leaves.length} data={d.leaves}
        columns={[
          { key: "reason", label: "السبب", flex: 1.6, align: "right" },
          { key: "date", label: "التاريخ", width: 110, align: "center" },
          { key: "time", label: "الوقت", width: 120, align: "center",
            render: (x: any) => <P muted style={{ fontSize: 12 }}>{x.fromTime ? `${x.fromTime}-${x.toTime ?? ""}` : "—"}</P> },
        ]}
      />

      <SectionTable title="الغيابات" count={d.absences.length} data={d.absences}
        columns={[
          { key: "reason", label: "السبب", flex: 1.4, align: "right" },
          { key: "coverTeacher", label: "الاحتياط", flex: 1, align: "right" },
          { key: "date", label: "التاريخ", width: 110, align: "center" },
        ]}
      />

      <SectionTable title="حصص الاحتياط التي نفّذتها" count={d.coversDone.length} data={d.coversDone}
        columns={[
          { key: "absent", label: "عن المعلمة", flex: 1.4, align: "right",
            render: (x: any) => <P style={{ fontSize: 13 }}>عن {x.absent}</P> },
          { key: "cls", label: "الصف", flex: 1, align: "center",
            render: (x: any) => <P muted style={{ fontSize: 12.5 }}>{`${x.grade ?? ""} ${x.section ?? ""}`.trim() || "—"}</P> },
          { key: "date", label: "التاريخ", width: 110, align: "center" },
        ]}
      />

      <SectionTable title="الزيارات الصفية" count={d.visits.length} data={d.visits}
        columns={[
          { key: "subject", label: "المادة", flex: 1.4, align: "right" },
          { key: "type", label: "النوع", flex: 1, align: "center" },
          { key: "date", label: "التاريخ", width: 110, align: "center" },
        ]}
      />

      <SectionTable title="متابعات الأداء" count={d.perf.length} data={d.perf}
        columns={[
          { key: "subject", label: "المادة", flex: 1.4, align: "right" },
          { key: "unit", label: "الوحدة", flex: 1, align: "right" },
          { key: "date", label: "التاريخ", width: 110, align: "center" },
        ]}
      />

      <SectionTable title="التقييمات السنوية" count={d.annualEvals.length} data={d.annualEvals}
        columns={[
          { key: "year", label: "السنة", flex: 1, align: "right" },
          { key: "total", label: "النتيجة", width: 150, align: "center",
            render: (x: any) => <Badge label={`${x.total}% ${x.level ?? ""}`} tone={x.total >= 90 ? "success" : "primary"} /> },
        ]}
      />

      <P muted style={{ fontSize: 12.5, textAlign: "center", marginTop: 4 }}>التقارير الدورية: {d.periodicReports.length}</P>
    </Screen>
  );
}
