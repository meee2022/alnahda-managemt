import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen, Card, H2, P, Button, Loading, Row, Badge, PageHero, Select, Input, IconBtn, notify } from "../../lib/ui";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, fonts } from "../../lib/theme";
import {
  toSlots, toRows, checkRules, generateAsync, buildConfig, DAYS,
  type Slot, type Violation, type RuleConfig,
} from "../../lib/scheduleRules";
import { printTimetable, downloadTimetableHtml } from "../../lib/printTimetable";

const SUBJECTS = ["اللغة العربية", "التربية الإسلامية", "اللغة الإنجليزية", "الرياضيات", "العلوم"];
const SOFT_RULES: { id: string; label: string }[] = [
  { id: "islamicConsecutive", label: "الشرعية: أيامها متتالية لكل صف" },
  { id: "blocks", label: "البلوكات: حصتان متلاصقتان (والثالثة منفصلة)" },
  { id: "fairLast", label: "الحصة السابعة موزّعة بالعدل بين المعلمات" },
];

function VioList({ items, tone }: { items: Violation[]; tone: "danger" | "warn" }) {
  if (!items.length) return null;
  const c = tone === "danger" ? colors.danger : colors.goldDark;
  const bg = tone === "danger" ? colors.dangerSoft : colors.goldSoft;
  return (
    <View style={[ss.vbox, { backgroundColor: bg, borderColor: c + "55" }]}>
      {items.slice(0, 30).map((v, i) => <Text key={i} style={[ss.vtxt, { color: c }]}>• {v.msg}</Text>)}
      {items.length > 30 ? <Text style={[ss.vtxt, { color: c }]}>… و{items.length - 30} أخرى</Text> : null}
    </View>
  );
}

function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }} style={ss.tgRow}>
      <Ionicons name={on ? "checkbox" : "square-outline"} size={20} color={on ? colors.primary : colors.textMuted} />
      <Text style={[ss.tgTxt, !on && { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

export default function ScheduleBuilder() {
  const allSlots = useQuery(api.timetable.list, {});
  const cons = useQuery(api.scheduleConstraints.list, {});
  const importV2 = useMutation(api.timetable.importDeptV2);
  const applyGen = useMutation(api.timetable.applyGenerated);
  const addCon = useMutation(api.scheduleConstraints.add);
  const setEnabled = useMutation(api.scheduleConstraints.setEnabled);
  const removeCon = useMutation(api.scheduleConstraints.remove);
  const seedDefaults = useMutation(api.scheduleConstraints.seedDefaults);

  const [busy, setBusy] = useState<null | "import" | "gen" | "save" | "seed">(null);
  const [result, setResult] = useState<{ rows: Slot[]; dropped: Slot[]; violations: Violation[] } | null>(null);
  const [progress, setProgress] = useState(0);

  // نموذج إضافة قيد
  const [nfTeacher, setNfTeacher] = useState("");
  const [nfDay, setNfDay] = useState("كل الأيام");
  const [rhTeacher, setRhTeacher] = useState("");
  const [rhAmount, setRhAmount] = useState("2");
  const [nsSubject, setNsSubject] = useState(SUBJECTS[0]);
  const [nsDay, setNsDay] = useState("الأحد");

  const current = useMemo(() => toSlots(allSlots ?? []), [allSlots]);
  const teachers = useMemo(
    () => Array.from(new Set(current.map((s) => s.teacher))).sort((a, b) => a.localeCompare(b, "ar")),
    [current]
  );
  const cfg: RuleConfig = useMemo(() => buildConfig(cons ?? []), [cons]);
  const baseline = useMemo(() => {
    const b: Record<string, number> = {};
    for (const s of current) if (!s.fixed) b[s.teacher] = (b[s.teacher] || 0) + 1;
    return b;
  }, [current]);
  const cfgWithBase = useMemo(() => ({ ...cfg, _baseline: baseline } as any), [cfg, baseline]);

  const currentVios = useMemo(
    () => (current.length ? checkRules(current, cfgWithBase) : []),
    [current, cfgWithBase]
  );

  const split = (vs: Violation[]) => ({
    hard: vs.filter((v) => v.sev === "إلزامي" || v.sev === "تعارض"),
    soft: vs.filter((v) => v.sev === "تفضيلي"),
  });
  const cur = split(currentVios);
  const gen = result ? split(result.violations) : null;

  const rows = cons ?? [];
  const byKind = (k: string) => rows.filter((r: any) => r.kind === k);

  const runGenerate = async () => {
    if (!current.length) { notify("لا يوجد جدول محمّل. استوردي الجدول أولاً."); return; }
    setBusy("gen"); setProgress(0); setResult(null);
    try {
      const best = await generateAsync(current, cfg, {
        iterations: 12000, seeds: 3, onProgress: setProgress,
      });
      setResult({ rows: best.rows, dropped: best.dropped, violations: best.violations });
      const h = best.violations.filter((v) => v.sev !== "تفضيلي").length;
      notify(
        h === 0 ? "تم توليد جدول مطابق لكل القيود الإلزامية" : `تم التوليد — بقي ${h} مخالفة إلزامية`,
        h === 0 ? "success" : "warn"
      );
    } catch (e: any) {
      notify("تعذّر التوليد: " + String(e?.message ?? e).slice(0, 120), "error");
    } finally { setBusy(null); setProgress(0); }
  };

  const save = async () => {
    if (!result) return;
    if (typeof window !== "undefined" && !window.confirm("اعتماد الجدول المولَّد؟ سيحل محل جدول المعلمات الحالي.")) return;
    setBusy("save");
    try {
      const r = await applyGen({ entries: toRows(result.rows) });
      notify(`تم اعتماد الجدول: ${r.cells} حصة لـ ${r.teachers} معلمة`, "success");
      setResult(null);
    } catch (e: any) {
      notify("تعذّر الحفظ: " + String(e?.message ?? e).slice(0, 120), "error");
    } finally { setBusy(null); }
  };

  if (allSlots === undefined || cons === undefined) return <Loading />;
  const shown = result ? result.rows : current;

  return (
    <Screen>
      <PageHero
        title="مولّد الجدول"
        desc="اضبطي القيود ثم ولّدي الجدول — دون المساس بالجدول العام للمدرسة"
        icon="construct"
        gradient={["#3B0A14", "#5C1523"]}
      />

      {/* ===== القيود ===== */}
      <Card>
        <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
          <H2 style={{ marginBottom: 0 }}>قيود الجدول</H2>
          <Badge label={`${rows.filter((r: any) => r.enabled).length} مُفعّل`} tone="primary" />
        </Row>
        <P muted style={{ fontSize: 12.5, marginTop: 6 }}>
          هذه القيود يتبعها المولّد. أضيفي أو عطّلي ما تشائين — التغيير يسري فوراً على الفحص والتوليد.
        </P>

        {rows.length === 0 ? (
          <Button
            title={busy === "seed" ? "جارٍ التجهيز…" : "تجهيز القيود المعتمدة"}
            icon="sparkles-outline" loading={busy === "seed"} style={{ marginTop: 10, alignSelf: "flex-start" }}
            onPress={async () => {
              setBusy("seed");
              try { const r = await seedDefaults({}); notify(`تمت إضافة ${r.added} قيداً`, "success"); }
              finally { setBusy(null); }
            }}
          />
        ) : null}

        {/* منع الحصة الأولى */}
        <Text style={ss.sec}>منع الحصة الأولى</Text>
        {byKind("noFirstPeriod").map((r: any) => (
          <Row key={r._id} style={ss.cRow}>
            <Toggle on={r.enabled} label={`${r.teacherName} — ${r.day || "كل الأيام"}`} onPress={() => setEnabled({ id: r._id, enabled: !r.enabled })} />
            <IconBtn name="trash-outline" color={colors.danger} onPress={() => removeCon({ id: r._id })} />
          </Row>
        ))}
        <Row style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <View style={{ flex: 1, minWidth: 150 }}>
            <Select label="المعلمة" options={teachers} value={nfTeacher} onChange={setNfTeacher} searchable placeholder="اختاري…" />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Select label="اليوم" options={["كل الأيام", ...DAYS]} value={nfDay} onChange={setNfDay} />
          </View>
          <Button title="إضافة" icon="add" small variant="outline" onPress={async () => {
            if (!nfTeacher) { notify("اختاري المعلمة أولاً."); return; }
            await addCon({ kind: "noFirstPeriod", teacherName: nfTeacher, day: nfDay === "كل الأيام" ? "" : nfDay });
            setNfTeacher(""); notify("تمت إضافة القيد", "success");
          }} />
        </Row>

        {/* تخفيف الساعات */}
        <Text style={ss.sec}>تخفيف الساعات</Text>
        {byKind("reduceHours").map((r: any) => (
          <Row key={r._id} style={ss.cRow}>
            <Toggle on={r.enabled} label={`${r.teacherName} — تخفيف ${r.amount} حصة`} onPress={() => setEnabled({ id: r._id, enabled: !r.enabled })} />
            <IconBtn name="trash-outline" color={colors.danger} onPress={() => removeCon({ id: r._id })} />
          </Row>
        ))}
        <Row style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <View style={{ flex: 1, minWidth: 150 }}>
            <Select label="المعلمة" options={teachers} value={rhTeacher} onChange={setRhTeacher} searchable placeholder="اختاري…" />
          </View>
          <View style={{ width: 110 }}>
            <Input label="عدد الحصص" value={rhAmount} onChangeText={setRhAmount} keyboardType="numeric" />
          </View>
          <Button title="إضافة" icon="add" small variant="outline" onPress={async () => {
            const n = Number(rhAmount);
            if (!rhTeacher || !n || n < 1) { notify("اختاري المعلمة وعدداً صحيحاً."); return; }
            await addCon({ kind: "reduceHours", teacherName: rhTeacher, amount: n });
            setRhTeacher(""); notify("تمت إضافة التخفيف", "success");
          }} />
        </Row>

        {/* منع مادة في الحصة الأولى */}
        <Text style={ss.sec}>منع مادة في الحصة الأولى</Text>
        {byKind("noSubjectFirstOnDay").map((r: any) => (
          <Row key={r._id} style={ss.cRow}>
            <Toggle on={r.enabled} label={`${r.subject} — ${r.day || "كل الأيام"}`} onPress={() => setEnabled({ id: r._id, enabled: !r.enabled })} />
            <IconBtn name="trash-outline" color={colors.danger} onPress={() => removeCon({ id: r._id })} />
          </Row>
        ))}
        <Row style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <View style={{ flex: 1, minWidth: 150 }}>
            <Select label="المادة" options={SUBJECTS} value={nsSubject} onChange={setNsSubject} />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Select label="اليوم" options={["كل الأيام", ...DAYS]} value={nsDay} onChange={setNsDay} />
          </View>
          <Button title="إضافة" icon="add" small variant="outline" onPress={async () => {
            await addCon({ kind: "noSubjectFirstOnDay", subject: nsSubject, day: nsDay === "كل الأيام" ? "" : nsDay });
            notify("تمت إضافة القيد", "success");
          }} />
        </Row>

        {/* الحد الأدنى للحصص في اليوم */}
        <Text style={ss.sec}>الحد الأدنى لحصص اليوم</Text>
        {byKind("minPerDay").map((r: any) => (
          <Row key={r._id} style={ss.cRow}>
            <Toggle on={r.enabled} label={`${r.subject} — لا يوم بأقل من ${r.amount} حصة`} onPress={() => setEnabled({ id: r._id, enabled: !r.enabled })} />
            <IconBtn name="trash-outline" color={colors.danger} onPress={() => removeCon({ id: r._id })} />
          </Row>
        ))}

        {/* مواد الحصة الأولى المفضّلة */}
        <Text style={ss.sec}>يُفضّل في الحصة الأولى</Text>
        {byKind("firstPrefer").map((r: any) => (
          <Row key={r._id} style={ss.cRow}>
            <Toggle on={r.enabled} label={r.subject} onPress={() => setEnabled({ id: r._id, enabled: !r.enabled })} />
            <IconBtn name="trash-outline" color={colors.danger} onPress={() => removeCon({ id: r._id })} />
          </Row>
        ))}

        {/* القواعد التفضيلية */}
        <Text style={ss.sec}>قواعد تفضيلية</Text>
        {SOFT_RULES.map((sr) => {
          const row: any = rows.filter((r: any) => r.kind === "rule" && r.ruleId === sr.id)[0];
          const on = row ? row.enabled : false;
          return (
            <Toggle key={sr.id} on={on} label={sr.label} onPress={async () => {
              if (row) await setEnabled({ id: row._id, enabled: !on });
              else await addCon({ kind: "rule", ruleId: sr.id });
            }} />
          );
        })}
      </Card>

      {/* ===== الجدول الحالي ===== */}
      <Card>
        <H2>الجدول الحالي</H2>
        {current.length === 0 ? (
          <P muted style={{ fontSize: 13 }}>لا يوجد جدول محمّل بعد. استوردي الجدول الرسمي المحدّث للبدء.</P>
        ) : (
          <>
            <Row style={{ flexWrap: "wrap", marginBottom: 8 }}>
              <Badge label={`${current.filter((s) => !s.fixed).length} حصة تدريس`} tone="primary" />
              <Badge label={`${teachers.length} معلمة`} tone="muted" />
              <Badge label={cur.hard.length === 0 ? "لا مخالفات إلزامية" : `${cur.hard.length} مخالفة إلزامية`} tone={cur.hard.length ? "danger" : "success"} />
              <Badge label={`${cur.soft.length} تفضيلية`} tone="muted" />
            </Row>
            <VioList items={cur.hard} tone="danger" />
            <VioList items={cur.soft} tone="warn" />
          </>
        )}
        <Button
          title={busy === "import" ? "جارٍ الاستيراد…" : "استيراد الجدول الرسمي المحدّث"}
          icon="download-outline" variant="outline" loading={busy === "import"} style={{ marginTop: 10, alignSelf: "flex-start" }}
          onPress={async () => {
            if (typeof window !== "undefined" && !window.confirm("استيراد الجدول الرسمي المحدّث (٢٤ معلمة)؟ سيحل محل جدول المعلمات الحالي.")) return;
            setBusy("import");
            try {
              const r = await importV2({});
              setResult(null);
              notify(`تم الاستيراد: ${r.cells} حصة لـ ${r.teachers} معلمة`, "success");
            } catch (e: any) {
              notify("تعذّر الاستيراد: " + String(e?.message ?? e).slice(0, 120), "error");
            } finally { setBusy(null); }
          }}
        />
      </Card>

      {/* ===== التوليد ===== */}
      <Card style={{ backgroundColor: colors.goldSoft, borderColor: colors.gold, borderWidth: 1 }}>
        <Row style={{ gap: 8 }}>
          <Ionicons name="sparkles-outline" size={20} color={colors.goldDark} />
          <H2 style={{ marginBottom: 0 }}>توليد جدول جديد</H2>
        </Row>
        <P muted style={{ fontSize: 13, marginTop: 6 }}>
          يبحث عن أفضل ترتيب ضمن خانات القسم نفسها. الخانات الثابتة (تحضير/اجتماع/تطوير) وحصص الجدول العام لا تتحرك.
        </P>
        <Button title={busy === "gen" ? `جارٍ التوليد… ${Math.round(progress * 100)}%` : "توليد جدول جديد"} icon="construct-outline"
          loading={busy === "gen"} style={{ marginTop: 10, alignSelf: "flex-start" }} onPress={runGenerate} />
        {busy === "gen" ? (
          <View style={ss.bar}><View style={[ss.barFill, { width: `${Math.max(3, progress * 100)}%` }]} /></View>
        ) : null}
      </Card>

      {result && gen ? (
        <Card>
          <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
            <H2 style={{ marginBottom: 0 }}>الجدول المقترح</H2>
            <Badge label={gen.hard.length === 0 ? "✔ كل القيود الإلزامية محقّقة" : `${gen.hard.length} مخالفة`} tone={gen.hard.length ? "danger" : "success"} />
          </Row>
          <Row style={{ flexWrap: "wrap", marginTop: 8 }}>
            <Badge label={`إلزامية: ${cur.hard.length} ← ${gen.hard.length}`} tone={gen.hard.length <= cur.hard.length ? "success" : "danger"} />
            <Badge label={`تفضيلية: ${cur.soft.length} ← ${gen.soft.length}`} tone="muted" />
          </Row>
          {result.dropped.length ? (
            <P muted style={{ fontSize: 12.5, marginTop: 8 }}>
              الحصص المخفَّضة: {result.dropped.map((d) => `${d.teacher} ${d.day} ح${d.period}`).join(" — ")}
            </P>
          ) : null}
          <VioList items={gen.hard} tone="danger" />
          <VioList items={gen.soft} tone="warn" />
          <Row style={{ flexWrap: "wrap", marginTop: 10 }}>
            <Button title={busy === "save" ? "جارٍ الحفظ…" : "اعتماد وحفظ"} icon="checkmark" loading={busy === "save"} onPress={save} />
            <Button title="إلغاء المقترح" variant="ghost" onPress={() => setResult(null)} />
          </Row>
        </Card>
      ) : null}

      <Card>
        <H2>تصدير بالشكل الرسمي</H2>
        <P muted style={{ fontSize: 13, marginBottom: 10 }}>
          صفحة لكل معلمة بنفس تخطيط الجدول الرسمي (aSc) — جاهزة للطباعة A4 أفقي.
        </P>
        <Row style={{ flexWrap: "wrap" }}>
          <Button title={result ? "طباعة الجدول المقترح" : "طباعة الجدول الحالي"} icon="print-outline"
            variant="outline"
            onPress={() => { if (!shown.length) { notify("لا يوجد جدول للطباعة."); return; } printTimetable(shown); }} />
          <Button title="تنزيل ملف HTML للإرسال" icon="download-outline" variant="outline"
            onPress={() => {
              if (!shown.length) { notify("لا يوجد جدول للتنزيل."); return; }
              downloadTimetableHtml(shown, undefined, undefined, result ? "الجدول-المقترح.html" : "جدول-القسم.html");
              notify("تم تنزيل الملف — يمكنك إرساله كما هو", "success");
            }} />
        </Row>
      </Card>
    </Screen>
  );
}

const ss = StyleSheet.create({
  sec: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary, textAlign: "right", marginTop: 14, marginBottom: 4 },
  cRow: { justifyContent: "space-between", alignItems: "center" },
  tgRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5, flex: 1 },
  tgTxt: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.text, textAlign: "right", flex: 1 },
  vbox: { borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 8 },
  vtxt: { fontFamily: fonts.regular, fontSize: 12, textAlign: "right", lineHeight: 20 },
  bar: { height: 6, borderRadius: 3, backgroundColor: "#fff", overflow: "hidden", marginTop: 10 },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.goldDark },
});
