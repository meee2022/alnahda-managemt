import React, { useState, useMemo } from "react";
import { View, Text } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Input, Button, Loading, Empty, Row, IconBtn, Badge, PageHero, HeroBtn, AnimatedItem, ExportMenu, notify } from "../../lib/ui";
import { colors, fonts } from "../../lib/theme";
import { DateField } from "../../lib/pickers";
import { setExportMode } from "../../lib/print";
import { printDepartmentReport } from "../../lib/printForms2026";
import { DEPT_REPORT_ITEMS } from "../../lib/forms2026";

type Entry = { domain: string; item: string; done: string; notes: string };
const blank = (): Entry[] => DEPT_REPORT_ITEMS.map((d) => ({ domain: d.domain, item: d.item, done: "", notes: "" }));

export default function DepartmentReport() {
  const list = useQuery(api.forms2026.listDepartmentReports, {});
  const snap = useQuery(api.forms2026.departmentSnapshot, {});
  const settings = useQuery(api.admin.getSettings, {});
  const save = useMutation(api.forms2026.saveDepartmentReport);
  const remove = useMutation(api.forms2026.removeDepartmentReport);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [meta, setMeta] = useState({ reportNumber: "", date: "", deputyFeedback: "" });
  const [entries, setEntries] = useState<Entry[]>(blank());

  const domains = useMemo(() => Array.from(new Set(entries.map((e) => e.domain))), [entries]);
  const filled = entries.filter((e) => e.done.trim()).length;

  const reset = () => { setMeta({ reportNumber: "", date: "", deputyFeedback: "" }); setEntries(blank()); setAdding(false); setEditing(null); };

  const startEdit = (r: any) => {
    setMeta({ reportNumber: r.reportNumber ?? "", date: r.date ?? "", deputyFeedback: r.deputyFeedback ?? "" });
    const saved: Entry[] = (r.entries ?? []).map((e: any) => ({ domain: e.domain, item: e.item, done: e.done ?? "", notes: e.notes ?? "" }));
    // ادمج مع البنود الرسمية حتى لو تغيّر النموذج لاحقاً
    setEntries(blank().map((b) => saved.find((s) => s.item === b.item) ?? b));
    setEditing(r._id); setAdding(true);
  };

  /** يملأ البنود القابلة للحساب من سجلات التطبيق الفعلية */
  const autofill = () => {
    if (!snap) return;
    const map: Record<string, string> = {
      "متابعة الخطة الفصلية": `أُنجز ${snap.weeksDone} من ${snap.weeksTotal} أسبوعاً في الخطة الفصلية.`,
      "الاختبارات": `عدد تقارير الاختبارات المسجّلة: ${snap.exams}.`,
      "تحليل وقراءة النتائج": `تم تحليل نتائج ${snap.exams} اختباراً وتوثيقها في التطبيق.`,
      "تنفيذ خطة التطوير المهني": `عدد البرامج التدريبية المنفّذة: ${snap.trainings}.`,
      "الورش الداخلية": `${snap.trainingsInternal} ورشة داخلية.`,
      "الورش الخارجية": `${snap.trainingsExternal} برنامجاً خارجياً.`,
      "التطوير الذاتي للمنسق": `عدد القراءات المهنية الموثّقة: ${snap.readings}.`,
      "المنسق": `زيارات صفية منفّذة: ${snap.visitsDone} من ${snap.visitsPlanned} مخطّطة، ومنها ${snap.classVisits} استمارة زيارة و${snap.performanceVisits} استمارة متابعة أداء.`,
      "اجتماعات القسم": `${snap.meetingsGroup} اجتماعاً جماعياً و${snap.meetingsIndividual} اجتماعاً فردياً.`,
      "متابعة الاحتياط": `عدد حصص الاحتياط المسجّلة: ${snap.coverSlots}، وسجلات الاستئذان: ${snap.leaveRecords}.`,
      "المعلمات": `عدد الإنجازات الموثّقة: ${snap.achievements}.`,
    };
    let n = 0;
    setEntries(entries.map((e) => {
      const v = map[e.item];
      if (v && !e.done.trim()) { n++; return { ...e, done: v }; }
      return e;
    }));
    notify(n ? `عُبّئ ${n} بنداً من سجلات التطبيق — راجعيها وأكمِلي الباقي` : "البنود القابلة للحساب معبأة بالفعل", n ? "success" : "warn");
  };

  const submit = async () => {
    if (!filled) { notify("املئي بنداً واحداً على الأقل في «ما تم إنجازه»."); return; }
    await save({
      id: (editing as any) ?? undefined,
      reportNumber: meta.reportNumber, date: meta.date,
      year: settings?.academicYear ?? "2026-2027",
      entries: entries.map((e) => ({ domain: e.domain, item: e.item, done: e.done, notes: e.notes })),
      deputyFeedback: meta.deputyFeedback,
    });
    notify("تم حفظ تقرير القسم بنجاح", "success");
    reset();
  };

  if (list === undefined) return <Loading />;

  return (
    <Screen>
      <PageHero
        title="تقرير القسم"
        desc="التقرير الدوري للنائب الأكاديمي — 41 بنداً في 9 مجالات بالنموذج الرسمي"
        icon="document-text"
        gradient={["#3B0A14", "#5C1523"]}
      >
        <HeroBtn title={adding ? "إغلاق النموذج" : "تقرير جديد"} icon={adding ? "close" : "add"} prominent onPress={() => (adding ? reset() : setAdding(true))} />
      </PageHero>

      {adding && (
        <>
          <Card>
            <H2>{editing ? "تعديل التقرير" : "بيانات التقرير"}</H2>
            <Row style={{ gap: 8 }}>
              <View style={{ flex: 1 }}><Input label="رقم التقرير" value={meta.reportNumber} onChangeText={(v) => setMeta({ ...meta, reportNumber: v })} /></View>
              <View style={{ flex: 1 }}><DateField label="تاريخ تقديم التقرير" value={meta.date} onChange={(v) => setMeta({ ...meta, date: v })} /></View>
            </Row>
            <P muted style={{ fontSize: 12 }}>المدرسة: {settings?.school ?? "—"} • المنسقة: {settings?.coordinator ?? "—"} • النائبة الأكاديمية: {settings?.academicDeputy ?? "—"}</P>
          </Card>

          <Card style={{ backgroundColor: colors.goldSoft, borderColor: colors.gold, borderWidth: 1 }}>
            <H2>تعبئة تلقائية من سجلات التطبيق</H2>
            <P muted style={{ fontSize: 12.5, marginBottom: 10 }}>
              يملأ البنود القابلة للحساب (الخطة الفصلية، الاختبارات، التطوير المهني، الزيارات، الاجتماعات، الاحتياط، الإنجازات) من بياناتك الفعلية. لن يُستبدل أي بند كتبتِه بنفسك.
            </P>
            <Button title="تعبئة البنود من البيانات" icon="sparkles-outline" variant="outline" style={{ alignSelf: "flex-start" }} onPress={autofill} />
          </Card>

          <Card>
            <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
              <H2 style={{ marginBottom: 0 }}>بنود التقرير</H2>
              <Badge label={`${filled} / ${entries.length}`} tone={filled ? "success" : "muted"} />
            </Row>
            {domains.map((d) => (
              <View key={d} style={{ marginTop: 14 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13.5, color: colors.primary, textAlign: "right", marginBottom: 6 }}>{d}</Text>
                {entries.map((e, i) => e.domain !== d ? null : (
                  <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, marginBottom: 8 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 12.5, color: colors.text, textAlign: "right", marginBottom: 4 }}>{e.item}</Text>
                    <Input placeholder="ما تم إنجازه" value={e.done} onChangeText={(v) => setEntries(entries.map((x, j) => j === i ? { ...x, done: v } : x))} multiline />
                    <Input placeholder="ملاحظات / تحديات" value={e.notes} onChangeText={(v) => setEntries(entries.map((x, j) => j === i ? { ...x, notes: v } : x))} />
                  </View>
                ))}
              </View>
            ))}
            <Input label="التغذية الراجعة من النائب الأكاديمي" value={meta.deputyFeedback} onChangeText={(v) => setMeta({ ...meta, deputyFeedback: v })} multiline />
            <Row>
              <Button title={editing ? "حفظ التعديل" : "حفظ التقرير"} icon="checkmark" onPress={submit} />
              <Button title="إلغاء" variant="ghost" onPress={reset} />
            </Row>
          </Card>
        </>
      )}

      {list.length === 0 ? (
        <Empty text="لا توجد تقارير قسم بعد" actionTitle="تقرير جديد" onAction={() => setAdding(true)} icon="document-text-outline" />
      ) : list.map((r: any, i: number) => (
        <AnimatedItem key={r._id} index={i}>
          <Card style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <P style={{ color: colors.text, fontSize: 15 }}>تقرير القسم {r.reportNumber ? `رقم ${r.reportNumber}` : ""}</P>
                <Row style={{ flexWrap: "wrap", marginTop: 4 }}>
                  <Badge label={`${(r.entries ?? []).filter((e: any) => e.done).length} بند معبّأ`} tone="primary" />
                  {r.date ? <Badge label={r.date} tone="muted" /> : null}
                </Row>
              </View>
              <Row>
                <ExportMenu run={(m) => { setExportMode(m, `تقرير القسم ${r.reportNumber ?? ""}`); printDepartmentReport(r, settings ?? {}); }} />
                <IconBtn name="pencil-outline" color={colors.primary} onPress={() => startEdit(r)} />
                <IconBtn name="trash-outline" color={colors.danger} onPress={() => remove({ id: r._id })} />
              </Row>
            </Row>
          </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}
