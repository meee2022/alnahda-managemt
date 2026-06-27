import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, H2, P, Loading, Empty, Row, Badge, Button, IconBtn, PageHero, HeroBtn, AnimatedItem, ExportMenu, DataTable, type Col } from "../../lib/ui";
import { colors, fonts, shadow } from "../../lib/theme";
import { printTeacherStats } from "../../lib/printTemplates";
import { setExportMode } from "../../lib/print";
import { isAssistant, TEACHER_CATEGORIES } from "../../lib/forms";

// رسم أعمدة بسيط بدون مكتبة خارجية
function MiniBars({ data }: { data: { label: string; leaves: number; covers: number }[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.leaves, d.covers)));
  return (
    <View style={{ marginTop: 10 }}>
      <Row style={{ gap: 14, marginBottom: 8 }}>
        <Row style={{ gap: 5 }}><View style={[s.dot, { backgroundColor: colors.warning }]} /><Text style={s.legend}>استئذان</Text></Row>
        <Row style={{ gap: 5 }}><View style={[s.dot, { backgroundColor: colors.gold }]} /><Text style={s.legend}>احتياط</Text></Row>
      </Row>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: 120, gap: 8 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Row style={{ alignItems: "flex-end", gap: 3, height: 96 }}>
              <View style={{ width: 12, height: Math.max(3, (d.leaves / max) * 96), backgroundColor: colors.warning, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              <View style={{ width: 12, height: Math.max(3, (d.covers / max) * 96), backgroundColor: colors.gold, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
            </Row>
            <Text style={s.barLabel}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const StatChip = ({ label, value, icon, color, soft, href }: { label: string; value: number | string; icon: keyof typeof Ionicons.glyphMap; color: string; soft: string; href?: string }) => {
  const inner = (
    <>
      <View style={styles.chipTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.chipVal, { color }]}>{value}</Text>
          <Text style={styles.chipLbl}>{label}</Text>
        </View>
        <View style={[styles.chipOrb, { backgroundColor: color }]}>
          <Ionicons name={icon} size={19} color="#fff" />
        </View>
      </View>
      {href ? <Text style={[styles.chipHint, { color }]}>عرض التفاصيل ‹</Text> : null}
      <View style={[styles.chipStrip, { backgroundColor: color }]} />
    </>
  );
  if (!href) return <View style={[styles.chip, { backgroundColor: soft, borderColor: color + "26" }]}>{inner}</View>;
  return (
    <Pressable
      onPress={() => router.push(href as any)}
      style={({ hovered, pressed }: any) => [styles.chip, { backgroundColor: soft, borderColor: color + "26" }, hovered && styles.chipHover, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      {inner}
    </Pressable>
  );
};

// لون كل فئة أداء (ضمن الهوية)
const CAT_COLOR: Record<string, string> = {
  "تطوير ذاتي": colors.success, "دعم عام": colors.goldDark, "دعم مكثف": colors.warning, "مستجد": colors.primary,
};

// رأس قسم موحّد بهوية الموقع — أيقونة داخل دائرة ملوّنة + عنوان
function SectionHead({ icon, title, color = colors.primary, right }: { icon: keyof typeof Ionicons.glyphMap; title: string; color?: string; right?: React.ReactNode }) {
  return (
    <Row style={{ alignItems: "center", gap: 10, marginBottom: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: color + "1A", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ fontFamily: fonts.bold, fontSize: 15.5, color: colors.text, flex: 1, textAlign: "right" }}>{title}</Text>
      {right ?? null}
    </Row>
  );
}

// شريط تغطية بسيط (نسبة مئوية حقيقية)
function CoverageBar({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <View style={{ marginTop: 12 }}>
      <Row style={{ justifyContent: "space-between", marginBottom: 5 }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.text }}>{label}</Text>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 12.5, color }}>{done} / {total} · {pct}%</Text>
      </Row>
      <View style={{ height: 10, backgroundColor: colors.bg, borderRadius: 6, overflow: "hidden" }}>
        <View style={{ width: `${pct}%` as any, height: "100%", backgroundColor: color, borderRadius: 6 }} />
      </View>
    </View>
  );
}

// صف «بحاجة متابعة» — عنوان + عدد + أسماء كرقائق، يفتح القسم المعني
function NeedRow({ label, names, color, href }: { label: string; names: string[]; color: string; href: string }) {
  return (
    <Pressable onPress={() => router.push(href as any)} style={{ paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color }}>● {label}</Text>
        <Badge label={`${names.length}`} tone="muted" />
      </Row>
      <Row style={{ flexWrap: "wrap", gap: 5 }}>
        {names.slice(0, 12).map((n) => <Badge key={n} label={n} tone="muted" />)}
        {names.length > 12 ? <Badge label={`+${names.length - 12}`} tone="muted" /> : null}
      </Row>
    </Pressable>
  );
}

export default function Stats() {
  const data = useQuery(api.analytics.teacherStats, {});
  const settings = useQuery(api.admin.getSettings, {});
  const classifications = useQuery(api.classVisits.listClassifications, {});
  const exams = useQuery(api.academics.listExams, {});

  if (data === undefined) return <Loading />;
  const { rows, totals, alerts, monthly } = data as any;
  const alertTone: Record<string, any> = { danger: "danger", warn: "warning", info: "muted" };

  // تغطية القسم هذا الفصل — من بيانات حقيقية فقط
  const visited = (rows ?? []).filter((r: any) => r.classVisitCount > 0 || r.perfCount > 0).length;
  const evaluated = (rows ?? []).filter((r: any) => r.lastAnnualScore != null).length;
  const classifiedNames = new Set((classifications ?? []).map((c: any) => c.teacherName));
  const classifiedCount = (rows ?? []).filter((r: any) => classifiedNames.has(r.name)).length;

  // قوائم «بحاجة متابعة» — أسماء فعلية مأخوذة من السجلات
  const notVisited = (rows ?? []).filter((r: any) => r.classVisitCount === 0 && r.perfCount === 0).map((r: any) => r.name);
  const notClassified = (rows ?? []).filter((r: any) => !classifiedNames.has(r.name)).map((r: any) => r.name);
  const notEvaluated = (rows ?? []).filter((r: any) => r.lastAnnualScore == null).map((r: any) => r.name);

  // توزيع فئات الأداء — عدّ فعلي لكل فئة
  const catCounts: Record<string, number> = {};
  for (const c of (classifications ?? [])) catCounts[c.category] = (catCounts[c.category] ?? 0) + 1;
  const maxCat = Math.max(1, ...TEACHER_CATEGORIES.map((c) => catCounts[c.key] ?? 0));

  // اتجاه نسب التحصيل — متوسط نسبة التحصيل لكل اختبار (زمنياً)
  const examTrend = [...(exams ?? [])].reverse().map((e: any) => {
    const vals = (e.rows ?? []).map((r: any) => r.achievementRate).filter((v: any) => v != null && v !== "");
    const avg = vals.length ? Math.round(vals.reduce((a: number, b: number) => a + Number(b), 0) / vals.length) : 0;
    return { title: e.title ?? "اختبار", avg };
  }).filter((x: any) => x.avg > 0);
  const maxTrend = Math.max(1, ...examTrend.map((x: any) => x.avg));

  return (
    <Screen>
      <PageHero
        title="الإحصائيات والتقارير"
        desc="صورة فورية لكل معلمة — استئذان، احتياط، زيارات، تقييم — تُحسب تلقائياً"
        icon="stats-chart"
        gradient={["#4A0F1B", "#5C1523"]}
      >
        <ExportMenu heroTitle="تصدير التقرير" run={(m) => { setExportMode(m, "تقرير إحصائيات المعلمات"); printTeacherStats(rows, totals, settings ?? {}); }} />
      </PageHero>

      {/* إجماليات القسم */}
      <Card>
        <SectionHead icon="albums" title="إجمالي القسم" color={colors.primary} />
        <View style={styles.grid}>
          <StatChip label="معلمة" value={totals.teachers} icon="people" color={colors.primary} soft={colors.primarySoft} href="/teachers" />
          <StatChip label="استئذان" value={totals.leaves} icon="exit-outline" color={colors.warning} soft={colors.warningSoft} href="/registers/leave" />
          <StatChip label="حصة احتياط" value={totals.covers} icon="swap-horizontal" color={colors.goldDark} soft={colors.goldSoft} href="/registers/cover" />
          <StatChip label="زيارة صفية" value={totals.classVisits} icon="eye" color={colors.success} soft={colors.successSoft} href="/evaluations/class-visit" />
          <StatChip label="متابعة أداء" value={totals.perfVisits} icon="document-attach" color={colors.accent} soft={colors.accentSoft} href="/evaluations/performance" />
          <StatChip label="تقرير دوري" value={totals.periodic} icon="clipboard" color={colors.primaryDeep} soft={colors.primaryTint} href="/evaluations/periodic" />
        </View>
      </Card>

      {/* تغطية القسم — نِسب حقيقية تتحدّث مع إدخال البيانات */}
      <Card>
        <SectionHead icon="pie-chart" title="تغطية القسم" color={colors.success} />
        <P muted style={{ fontSize: 12.5 }}>كم معلمة شملتها المتابعة فعلياً (تتحدّث تلقائياً مع كل إدخال).</P>
        <CoverageBar label="زيارة صفية أو متابعة أداء" done={visited} total={totals.teachers} color={colors.success} />
        <CoverageBar label="تقييم سنوي مسجّل" done={evaluated} total={totals.teachers} color={colors.primary} />
        <CoverageBar label="مصنّفة في فئة أداء" done={classifiedCount} total={totals.teachers} color={colors.goldDark} />
      </Card>

      {/* بحاجة إلى متابعة — أسماء فعلية تنقصها متابعة هذا الفصل */}
      {(notVisited.length > 0 || notClassified.length > 0 || notEvaluated.length > 0) && (
        <Card>
          <SectionHead icon="flag" title="بحاجة إلى متابعة" color={colors.warning} />
          <P muted style={{ fontSize: 12.5 }}>اضغطي على أي بند للانتقال وإكماله.</P>
          {notVisited.length > 0 ? <NeedRow label="لم تُزر صفياً بعد" names={notVisited} color={colors.warning} href="/visits" /> : null}
          {notClassified.length > 0 ? <NeedRow label="غير مصنّفة في فئة أداء" names={notClassified} color={colors.goldDark} href="/evaluations/classification" /> : null}
          {notEvaluated.length > 0 ? <NeedRow label="بدون تقييم سنوي مسجّل" names={notEvaluated} color={colors.primary} href="/evaluations/annual" /> : null}
        </Card>
      )}

      {/* توزيع فئات الأداء — من التصنيف الفعلي */}
      {(classifications ?? []).length > 0 && (
        <Card>
          <SectionHead icon="git-branch" title="توزيع فئات الأداء" color={colors.goldDark} />
          {TEACHER_CATEGORIES.map((c) => {
            const n = catCounts[c.key] ?? 0;
            const col = CAT_COLOR[c.key] ?? colors.primary;
            return (
              <View key={c.key} style={{ marginTop: 10 }}>
                <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 12.5, color: colors.text }}>{c.label}</Text>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 12.5, color: col }}>{n}</Text>
                </Row>
                <View style={{ height: 10, backgroundColor: colors.bg, borderRadius: 6, overflow: "hidden" }}>
                  <View style={{ width: `${Math.round((n / maxCat) * 100)}%` as any, height: "100%", backgroundColor: col, borderRadius: 6 }} />
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {/* اتجاه نسب التحصيل — من نتائج الاختبارات الفعلية */}
      {examTrend.length > 0 && (
        <Card>
          <SectionHead icon="trending-up" title="اتجاه نسب التحصيل الأكاديمي" color={colors.primary} />
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: 130, gap: 8, marginTop: 12 }}>
            {examTrend.map((x: any, i: number) => (
              <View key={i} style={{ flex: 1, alignItems: "center", maxWidth: 70 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 11.5, color: colors.primary, marginBottom: 3 }}>{x.avg}%</Text>
                <View style={{ width: 22, height: Math.max(4, (x.avg / maxTrend) * 96), backgroundColor: colors.primary, borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
                <Text numberOfLines={2} style={{ fontFamily: fonts.regular, fontSize: 9.5, color: colors.textMuted, marginTop: 5, textAlign: "center" }}>{x.title}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* التنبيهات الذكية */}
      {alerts && alerts.length > 0 && (
        <Card style={{ borderColor: colors.warning, borderWidth: 1 }}>
          <SectionHead icon="notifications" title="تنبيهات تحتاج انتباهك" color={colors.warning} right={<Badge label={String(alerts.length)} tone="warning" />} />
          {alerts.map((a: any, i: number) => (
            <Row key={i} style={{ gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Ionicons name={a.level === "danger" ? "alert-circle" : a.level === "warn" ? "warning" : "information-circle"} size={17}
                color={a.level === "danger" ? colors.danger : a.level === "warn" ? colors.warning : colors.textMuted} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.text, textAlign: "right" }}>{a.name}</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, textAlign: "right" }}>{a.text}</Text>
              </View>
            </Row>
          ))}
        </Card>
      )}

      {/* الرسوم الشهرية */}
      {monthly && monthly.length > 0 && (
        <Card>
          <SectionHead icon="bar-chart" title="الاستئذان والاحتياط شهرياً" color={colors.gold} />
          <MiniBars data={monthly} />
        </Card>
      )}

      {/* مقارنة المعلمات */}
      {(() => {
        const ranked = [...rows].filter((r: any) => (r.leaveCount + r.absences + r.classVisitCount + r.perfCount) > 0)
          .sort((a: any, b: any) => (b.leaveCount + b.absences) - (a.leaveCount + a.absences)).slice(0, 8);
        if (!ranked.length) return null;
        const max = Math.max(1, ...ranked.map((r: any) => r.leaveCount + r.absences));
        return (
          <Card>
            <SectionHead icon="podium" title="مقارنة المعلمات (الاستئذان + الغياب)" color={colors.primary} />
            <View style={{ marginTop: 8, gap: 8 }}>
              {ranked.map((r: any) => (
                <View key={r.id}>
                  <Row style={{ justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.text }} numberOfLines={1}>{r.name}</Text>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.primary }}>{r.leaveCount + r.absences}</Text>
                  </Row>
                  <View style={{ height: 12, backgroundColor: colors.bg, borderRadius: 6, overflow: "hidden" }}>
                    <View style={{ width: `${Math.round(((r.leaveCount + r.absences) / max) * 100)}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 6 }} />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        );
      })()}

      {/* جدول ملخّص مرتّب لكل المعلمات */}
      {rows.length > 0 && (
        <Card>
          <SectionHead icon="grid" title="جدول ملخّص المعلمات" color={colors.primary} />
          <DataTable
            minWidth={760}
            data={rows}
            columns={[
              { key: "name", label: "المعلمة", flex: 1.6, align: "right",
                render: (r: any) => (
                  <Row style={{ width: "100%", alignItems: "center", gap: 6 }}>
                    <Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.text, textAlign: "right" }}>{r.name}</Text>
                    {isAssistant(r.jobTitle) ? <Badge label="مساعدة" tone="accent" /> : null}
                  </Row>
                ) },
              { key: "grade", label: "الصف", width: 90, align: "center",
                render: (r: any) => r.grade ? <Badge label={`${r.grade}${r.section ? " " + r.section : ""}`} tone="muted" /> : <Text style={{ color: colors.textMuted }}>—</Text> },
              { key: "leaveCount", label: "استئذان", width: 72, align: "center" },
              { key: "absences", label: "غياب", width: 64, align: "center" },
              { key: "coversDone", label: "احتياط", width: 72, align: "center" },
              { key: "classVisitCount", label: "زيارة صفية", width: 90, align: "center" },
              { key: "perfCount", label: "متابعة أداء", width: 96, align: "center" },
              { key: "rating", label: "التقييم", width: 96, align: "center",
                render: (r: any) => r.lastAnnualScore != null
                  ? <Badge label={`${r.lastAnnualScore}%`} tone={r.lastAnnualScore >= 90 ? "success" : "primary"} />
                  : <Text style={{ color: colors.textMuted }}>—</Text> },
            ] as Col<any>[]}
          />
        </Card>
      )}

      {rows.length > 0 && <View style={{ marginTop: 4 }}><SectionHead icon="list" title="تفاصيل كل معلمة" color={colors.primary} /></View>}
      {rows.length === 0 ? (
        <Empty text="لا توجد بيانات بعد — أدخلي السجلات والاستمارات وستظهر الإحصائيات تلقائياً" icon="stats-chart-outline" />
      ) : rows.map((r: any, i: number) => (
        <AnimatedItem key={r.id} index={i}>
          <Card style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <P style={{ color: colors.text, fontSize: 15 }}>{r.name}</P>
                <Row style={{ marginTop: 3, flexWrap: "wrap" }}>
                  {r.grade ? <Badge label={`${r.grade}${r.section ? " " + r.section : ""}`} tone="muted" /> : null}
                  {r.lastAnnualScore != null ? <Badge label={`تقييم ${r.lastAnnualScore}%`} tone={r.lastAnnualScore >= 90 ? "success" : "primary"} /> : null}
                </Row>
              </View>
              <IconBtn name="document-text-outline" color={colors.primary} onPress={() => router.push({ pathname: "/reports/teacher", params: { id: r.id } })} />
            </Row>
            <View style={styles.grid}>
              <StatChip label="استئذان" value={r.leaveCount} icon="exit-outline" color={colors.warning} soft={colors.warningSoft} />
              <StatChip label="احتياط نفّذته" value={r.coversDone} icon="swap-horizontal" color={colors.goldDark} soft={colors.goldSoft} />
              <StatChip label="غياب" value={r.absences} icon="close-circle" color={colors.danger} soft={colors.dangerSoft} />
              <StatChip label="زيارة صفية" value={r.classVisitCount} icon="eye" color={colors.success} soft={colors.successSoft} />
              <StatChip label="متابعة أداء" value={r.perfCount} icon="document-attach" color={colors.accent} soft={colors.accentSoft} />
              <StatChip label="تقرير دوري" value={r.periodicCount} icon="clipboard" color={colors.primaryDeep} soft={colors.primaryTint} />
            </View>
            {(r.leaveDates?.length || r.classVisitDates?.length) ? (
              <View style={{ marginTop: 10, gap: 6 }}>
                {r.leaveDates?.length ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <Text style={s.dateLbl}>أيام الاستئذان:</Text>
                    {r.leaveDates.map((d: string, k: number) => <Badge key={k} label={d} tone="warning" />)}
                  </View>
                ) : null}
                {r.classVisitDates?.length ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <Text style={s.dateLbl}>تواريخ الزيارة الصفية:</Text>
                    {r.classVisitDates.map((d: string, k: number) => <Badge key={k} label={d} tone="accent" />)}
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        </AnimatedItem>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  chip: { minWidth: 158, flexGrow: 1, flexBasis: 158, borderRadius: 16, paddingTop: 13, paddingBottom: 15, paddingHorizontal: 14, borderWidth: 1, overflow: "hidden", ...(Platform.OS === "web" ? { transitionDuration: "150ms" as any, cursor: "pointer" as any } : {}) },
  chipHover: { transform: [{ translateY: -2 }], ...shadow.card } as any,
  chipTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  chipOrb: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  chipVal: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 30 },
  chipLbl: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textSecondary, marginTop: 1 },
  chipHint: { fontFamily: fonts.medium, fontSize: 10.5, marginTop: 8 },
  chipStrip: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3, opacity: 0.85 },
});

const s = StyleSheet.create({
  dot: { width: 10, height: 10, borderRadius: 3 },
  legend: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  barLabel: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.textMuted, marginTop: 5 },
  dateLbl: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textSecondary },
});
