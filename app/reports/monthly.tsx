import React, { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, Select, PageHero, HeroBtn, AnimatedItem } from "../../lib/ui";
import { colors } from "../../lib/theme";
import { MONTHLY_SECTIONS, MONTHS } from "../../lib/forms";
import { printMonthlyReport } from "../../lib/printTemplates";

export default function MonthlyReports() {
  const reports = useQuery(api.reports.listMonthly, {});
  const settings = useQuery(api.admin.getSettings, {});
  const create = useMutation(api.reports.createMonthly);
  const remove = useMutation(api.reports.removeMonthly);
  const draftMonthly = useAction(api.ai.draftMonthly);

  const [adding, setAdding] = useState(false);
  const [month, setMonth] = useState("مايو");
  const [entries, setEntries] = useState<Record<string, { summary: string; notes: string }>>({});
  const [drafting, setDrafting] = useState(false);
  const [draftErr, setDraftErr] = useState<string | null>(null);

  const aiOn = settings?.aiEnabled === "true" || !!settings?.anthropicApiKey;

  const generate = async () => {
    setDraftErr(null); setDrafting(true);
    try {
      const r = await draftMonthly({ month, sections: MONTHLY_SECTIONS.map((s) => ({ domain: s.domain, subDomain: s.subDomain })) });
      if (!r.ok) { setDraftErr(r.error ?? "تعذّر التوليد."); return; }
      const next = { ...entries };
      for (const s of r.sections ?? []) {
        if (s.subDomain && s.summary) next[s.subDomain] = { summary: s.summary, notes: next[s.subDomain]?.notes ?? "" };
      }
      setEntries(next);
    } finally { setDrafting(false); }
  };

  const save = async () => {
    await create({
      month,
      year: settings?.academicYear ?? "2025-2026",
      sections: MONTHLY_SECTIONS.map((s) => ({
        domain: s.domain,
        subDomain: s.subDomain,
        summary: entries[s.subDomain]?.summary ?? "",
        notes: entries[s.subDomain]?.notes ?? "",
      })),
    });
    setAdding(false); setEntries({});
  };

  const printReport = (r: any) => printMonthlyReport(r, settings ?? {});

  if (reports === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="التقرير الشهري للمنسقة"
        desc="استمارة التقرير الشهري للنائبة الأكاديمية — 27 مجالاً فرعياً"
        icon="document-text"
        gradient={["#5A0C22", "#8A1538"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "تقرير شهري جديد"} icon={adding ? "close" : "add"} prominent onPress={() => setAdding(!adding)} />
      </PageHero>

      {adding && (
        <Card>
          <H2>التقرير الشهري للمنسقة</H2>
          <Select label="الشهر" options={MONTHS} value={month} onChange={setMonth} />
          <Button title={drafting ? "جارٍ التوليد بالذكاء…" : "توليد المسودة تلقائياً بالذكاء"} icon="sparkles" variant="outline" small
            loading={drafting} onPress={generate} style={{ alignSelf: "flex-start", marginBottom: 6 }} />
          {!aiOn ? <P muted style={{ fontSize: 11.5 }}>التوليد يحتاج تفعيل مفتاح Anthropic API من «مساعد التوصيات».</P> : null}
          {draftErr ? <P style={{ color: colors.danger, fontSize: 12 }}>{draftErr}</P> : null}
          {MONTHLY_SECTIONS.map((s) => (
            <View key={s.subDomain} style={{ marginBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 }}>
              <Row style={{ justifyContent: "flex-start" }}>
                <Badge label={s.domain} tone="primary" />
              </Row>
              <P style={{ color: colors.text, marginVertical: 4 }}>{s.subDomain}</P>
              <Input placeholder="ملخص ما تم..." value={entries[s.subDomain]?.summary ?? ""}
                onChangeText={(v) => setEntries({ ...entries, [s.subDomain]: { summary: v, notes: entries[s.subDomain]?.notes ?? "" } })} multiline />
            </View>
          ))}
          <Button title="حفظ التقرير" icon="checkmark" onPress={save} />
        </Card>
      )}

      {reports.length === 0 ? (
        <Empty text="لا توجد تقارير شهرية بعد" actionTitle="تقرير جديد" onAction={() => setAdding(true)} icon="document-text-outline" />
      ) : reports.map((r, ri) => (
        <AnimatedItem key={r._id} index={ri}>
        <Card style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <P style={{ color: colors.text, fontSize: 15 }}>التقرير الشهري — {r.month}</P>
              <Badge label={r.year} tone="muted" />
            </View>
            <Row>
              <IconBtn name="print-outline" color={colors.primary} onPress={() => printReport(r)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: r._id })} />
            </Row>
          </Row>
        </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
