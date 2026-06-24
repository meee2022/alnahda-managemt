import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Platform } from "react-native";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../lib/auth";
import { Screen, Loading, Badge, Reveal, Row } from "../lib/ui";
import { colors, fonts, radius, shadow } from "../lib/theme";

type Module = {
  title: string; desc: string; icon: keyof typeof Ionicons.glyphMap;
  href: string; gradient: [string, string];
};

const GROUPS: { label: string; modules: Module[] }[] = [
  {
    label: "الإدارة اليومية",
    modules: [
      { title: "الاجتماعات", desc: "محاضر جماعية وفردية", icon: "chatbubbles", href: "/meetings", gradient: ["#4A0F1B", "#5C1523"] },
      { title: "جدول الزيارات الشهري", desc: "تخطيط زيارات المنسقة (بدون تقييم)", icon: "footsteps", href: "/visits", gradient: ["#A8853A", "#DFC48E"] },
      { title: "متابعة التوصيات", desc: "من المديرة والنائبات والموجهين", icon: "checkmark-done", href: "/recommendations", gradient: ["#3B0A14", "#5C1523"] },
      { title: "خطة متابعة الموجه", desc: "متابعة توصيات الموجه التربوي", icon: "git-network", href: "/registers/guide-plan", gradient: ["#4A0F1B", "#5C1523"] },
      { title: "سجل الاستئذان", desc: "استئذانات المعلمات اليومية", icon: "exit", href: "/registers/leave", gradient: ["#A8853A", "#DFC48E"] },
      { title: "سجل الاحتياط", desc: "حصص الاحتياط والبدائل", icon: "swap-horizontal", href: "/registers/cover", gradient: ["#3B0A14", "#5C1523"] },
    ],
  },
  {
    label: "المعلمات والطالبات",
    modules: [
      { title: "المعلمات", desc: "بيانات وملفات الفريق", icon: "people", href: "/teachers", gradient: ["#4A0F1B", "#5C1523"] },
      { title: "الطالبات", desc: "10 شعب · قياس القراءة والكتابة", icon: "school", href: "/students", gradient: ["#3B0A14", "#5C1523"] },
      { title: "التقرير الدوري", desc: "تقييم شهري بمقياس 1-3", icon: "clipboard", href: "/evaluations/periodic", gradient: ["#3B0A14", "#5C1523"] },
      { title: "التقييم السنوي", desc: "استمارة الوزارة · من 100", icon: "ribbon", href: "/evaluations/annual", gradient: ["#A8853A", "#DFC48E"] },
      { title: "استمارة تقييم الزيارة", desc: "التقييم بـ 22 مؤشراً + التوصيات", icon: "eye", href: "/evaluations/class-visit", gradient: ["#4A0F1B", "#5C1523"] },
      { title: "متابعة الأداء", desc: "النموذج التأسيسي · بنك التوصيات", icon: "document-attach", href: "/evaluations/performance", gradient: ["#3B0A14", "#5C1523"] },
      { title: "تصنيف الأداء", desc: "فئات المعلمين الأربع", icon: "git-branch", href: "/evaluations/classification", gradient: ["#3B0A14", "#5C1523"] },
    ],
  },
  {
    label: "الأكاديمي",
    modules: [
      { title: "التحصيل الأكاديمي", desc: "النتائج والقيمة المضافة", icon: "trending-up", href: "/academics/exams", gradient: ["#3B0A14", "#5C1523"] },
      { title: "الخطة الفصلية", desc: "متابعة تنفيذ الدروس أسبوعياً", icon: "calendar", href: "/academics/curriculum", gradient: ["#4A0F1B", "#5C1523"] },
      { title: "الأعمال الكتابية", desc: "متابعة تصحيح أعمال الطالبات", icon: "create", href: "/academics/written-work", gradient: ["#A8853A", "#DFC48E"] },
    ],
  },
  {
    label: "الخطط والتنظيم",
    modules: [
      { title: "الخطة السنوية", desc: "مجالات وإجراءات القسم السنوية", icon: "map", href: "/plans/annual", gradient: ["#4A0F1B", "#5C1523"] },
      { title: "خطة التحصيل", desc: "ثلاث مراحل بأهدافها وإجراءاتها", icon: "rocket", href: "/plans/achievement", gradient: ["#3B0A14", "#5C1523"] },
      { title: "جدول أعمال المنسقة", desc: "الفترات الزمنية والفعاليات", icon: "briefcase", href: "/plans/agenda", gradient: ["#A8853A", "#DFC48E"] },
    ],
  },
  {
    label: "التطوير والتقارير",
    modules: [
      { title: "الإحصائيات والتقارير", desc: "استئذان واحتياط وزيارات كل معلمة", icon: "stats-chart", href: "/reports/stats", gradient: ["#3B0A14", "#5C1523"] },
      { title: "المساعد الذكي (محادثة)", desc: "تحدّثي معه: تلخيص، خطط، صياغة، أسئلة", icon: "chatbubbles", href: "/chat", gradient: ["#3B0A14", "#5C1523"] },
      { title: "مساعد التوصيات", desc: "اكتبي المجال واحصلي على التوصية", icon: "sparkles", href: "/assistant", gradient: ["#A8853A", "#DFC48E"] },
      { title: "رفع وتحليل استمارة", desc: "ارفعي استمارة الموجِّهة ويحلّلها تلقائياً", icon: "cloud-upload", href: "/import", gradient: ["#4A0F1B", "#5C1523"] },
      { title: "التطوير المهني", desc: "حصر الدورات والقراءة المهنية", icon: "library", href: "/development", gradient: ["#4A0F1B", "#5C1523"] },
      { title: "التقرير الشهري", desc: "استمارة المنسقة للنائبة", icon: "document-text", href: "/reports/monthly", gradient: ["#3B0A14", "#5C1523"] },
      { title: "الإنجازات", desc: "نموذج إنجاز القسم", icon: "trophy", href: "/reports/achievements", gradient: ["#A8853A", "#DFC48E"] },
      { title: "لوحة التحكم", desc: "بيانات المدرسة والإعدادات", icon: "options", href: "/admin", gradient: ["#4A0F1B", "#5C1523"] },
    ],
  },
];

// عدّاد متحرك للأرقام
function CountUp({ value, style }: { value: number; style?: any }) {
  const [n, setN] = useState(0);
  const ref = useRef<any>(null);
  useEffect(() => {
    clearInterval(ref.current);
    if (value === 0) { setN(0); return; }
    const steps = 24;
    let i = 0;
    ref.current = setInterval(() => {
      i++;
      setN(Math.round((value * i) / steps));
      if (i >= steps) clearInterval(ref.current);
    }, 30);
    return () => clearInterval(ref.current);
  }, [value]);
  return <Text style={style}>{n}</Text>;
}

const MONTHS_AR = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const WEEKDAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// لوحة "اليوم" — استئذانات واحتياطات اليوم في مكان واحد
function TodayBoard() {
  const leaves = useQuery(api.registers.listLeave, {});
  const covers = useQuery(api.registers.listCover, {});
  const now = new Date();
  const todayStr = `${now.getDate()} ${MONTHS_AR[now.getMonth()]} ${now.getFullYear()}`;
  const dayName = WEEKDAYS_AR[now.getDay()];

  const todayLeaves = (leaves ?? []).filter((r: any) => r.date === todayStr).flatMap((r: any) => r.entries ?? []);
  const todayCovers = (covers ?? []).filter((r: any) => r.date === todayStr).flatMap((r: any) => r.entries ?? []);

  return (
    <View style={styles.today}>
      <View style={styles.todayHead}>
        <View style={styles.todayIcon}><Ionicons name="today" size={18} color="#fff" /></View>
        <Text style={styles.todayTitle}>لوحة اليوم · {dayName} {now.getDate()} {MONTHS_AR[now.getMonth()]}</Text>
      </View>
      <View style={styles.todayRow}>
        <Pressable style={styles.todayCard} onPress={() => router.push("/registers/leave" as any)}>
          <Text style={styles.todayNum}>{todayLeaves.length}</Text>
          <Text style={styles.todayLbl}>استئذان اليوم</Text>
          {todayLeaves.slice(0, 3).map((e: any, i: number) => <Text key={i} style={styles.todayName} numberOfLines={1}>• {e.teacherName}</Text>)}
        </Pressable>
        <Pressable style={styles.todayCard} onPress={() => router.push("/registers/cover" as any)}>
          <Text style={styles.todayNum}>{todayCovers.length}</Text>
          <Text style={styles.todayLbl}>حصة احتياط اليوم</Text>
          {todayCovers.slice(0, 3).map((e: any, i: number) => <Text key={i} style={styles.todayName} numberOfLines={1}>• {e.coverTeacher}</Text>)}
        </Pressable>
      </View>
      {todayLeaves.length === 0 && todayCovers.length === 0 ? (
        <Text style={styles.todayEmpty}>لا يوجد استئذان أو احتياط مُسجّل لليوم.</Text>
      ) : null}
    </View>
  );
}

// تذكيرات سريعة على الرئيسية (من التنبيهات الذكية)
const ALERT_TONE: Record<string, { color: string; soft: string; icon: keyof typeof Ionicons.glyphMap }> = {
  danger: { color: colors.danger, soft: colors.dangerSoft, icon: "alert-circle" },
  warn: { color: colors.warning, soft: colors.warningSoft, icon: "warning" },
  info: { color: colors.primary, soft: colors.primarySoft, icon: "information-circle" },
};
const alertTone = (level: string) => ALERT_TONE[level] ?? ALERT_TONE.info;

function HomeAlerts() {
  const data = useQuery(api.analytics.teacherStats, {}) as any;
  const { width } = useWindowDimensions();
  const wide = width > 720;
  const alerts = data?.alerts ?? [];
  if (!alerts.length) return null;
  const top = alerts.slice(0, wide ? 6 : 4);
  const more = alerts.length - top.length;
  return (
    <View style={styles.today}>
      <View style={styles.alertHead}>
        <View style={styles.todayHead}>
          <View style={[styles.todayIcon, { backgroundColor: colors.warning }]}><Ionicons name="notifications" size={18} color="#fff" /></View>
          <Text style={styles.todayTitle}>تذكيرات تحتاج انتباهك</Text>
        </View>
        <View style={styles.alertCount}><Text style={styles.alertCountTxt}>{alerts.length}</Text></View>
      </View>
      <View style={styles.alertGrid}>
        {top.map((a: any, i: number) => {
          const t = alertTone(a.level);
          return (
            <Pressable
              key={i}
              onPress={() => router.push("/reports/stats" as any)}
              style={({ hovered }: any) => [
                styles.alertItem,
                { backgroundColor: t.soft, width: wide ? "48.6%" : "100%" },
                hovered && { borderColor: t.color },
              ]}
            >
              <View style={[styles.alertIcon, { backgroundColor: t.color }]}>
                <Ionicons name={t.icon} size={14} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertName} numberOfLines={1}>{a.name}</Text>
                <Text style={styles.alertText} numberOfLines={1}>{a.text}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {more > 0 ? (
        <Pressable onPress={() => router.push("/reports/stats" as any)} style={styles.alertMore}>
          <Text style={styles.alertMoreTxt}>عرض كل التذكيرات ({more} أخرى)</Text>
          <Ionicons name="arrow-back" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

// شريط "حالة القسم" — مؤشّر صحّة موحّد محسوب من التنبيهات والتوصيات والزيارات
function DeptStatus() {
  const data = useQuery(api.analytics.teacherStats, {}) as any;
  const stats = useQuery(api.admin.dashboardStats, {}) as any;
  if (!data || !stats) return null;
  const alerts = data.alerts ?? [];
  const danger = alerts.filter((a: any) => a.level === "danger").length;
  const warn = alerts.filter((a: any) => a.level === "warn").length;
  const pending = stats.pendingRecommendations ?? 0;

  let tone = colors.success, label = "وضع القسم ممتاز", icon: keyof typeof Ionicons.glyphMap = "checkmark-circle";
  if (danger > 0) { tone = colors.danger; label = "يحتاج متابعة عاجلة"; icon = "alert-circle"; }
  else if (warn > 0 || pending > 0) { tone = colors.warning; label = "انتباه مطلوب"; icon = "warning"; }

  const metrics = [
    { n: danger, l: "تنبيه حرج", c: colors.danger },
    { n: warn, l: "تنبيه", c: colors.warning },
    { n: pending, l: "توصية معلّقة", c: colors.primary },
    { n: stats.visitsDone ?? 0, l: "زيارة منفّذة", c: colors.success },
  ];

  return (
    <Reveal delay={40}>
      <Pressable onPress={() => router.push("/reports/stats" as any)} style={dsx.wrap}>
        <View style={[dsx.badge, { backgroundColor: tone }]}>
          <Ionicons name={icon} size={18} color="#fff" />
          <Text style={dsx.badgeTxt}>{label}</Text>
        </View>
        <View style={dsx.metrics}>
          {metrics.map((m) => (
            <View key={m.l} style={dsx.metric}>
              <Text style={[dsx.metricNum, { color: m.c }]}>{m.n}</Text>
              <Text style={dsx.metricLbl}>{m.l}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Reveal>
  );
}

const dsx = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 14,
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, ...shadow.card,
  } as any,
  badge: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  badgeTxt: { fontFamily: fonts.bold, fontSize: 13.5, color: "#fff" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 18, flex: 1, justifyContent: "flex-end" },
  metric: { alignItems: "center", minWidth: 64 },
  metricNum: { fontFamily: fonts.bold, fontSize: 19 },
  metricLbl: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.textSecondary, marginTop: 1 },
});

// ── لوحة ملخّص الأداء — متميّزات، انضباط، حالة الزيارات، رسم نشاط ──────
function InsightsBoard() {
  const data = useQuery(api.analytics.teacherStats, {}) as any;
  const { width } = useWindowDimensions();
  const wide = width > 720;
  if (!data) return null;
  const rows: any[] = data.rows ?? [];
  if (!rows.length) return null;

  const total = rows.length;
  const visited = rows.filter((r) => r.classVisitCount > 0 || r.perfCount > 0).length;
  const visitedPct = Math.round((visited / total) * 100);

  const scored = rows.filter((r) => r.lastAnnualScore != null).sort((a, b) => b.lastAnnualScore - a.lastAnnualScore);
  const useScore = scored.length > 0;
  const topPerformers = (useScore
    ? scored
    : [...rows].sort((a, b) => (b.classVisitCount + b.perfCount + b.periodicCount) - (a.classVisitCount + a.perfCount + a.periodicCount))
  ).slice(0, 5);

  const disciplined = [...rows].sort((a, b) => (a.leaveCount + a.absences) - (b.leaveCount + b.absences)).slice(0, 5);
  const completed = rows.filter((r) => r.classVisitCount > 0 && r.perfCount > 0 && r.periodicCount > 0);

  const activity = rows
    .map((r) => ({ name: r.name, val: r.classVisitCount + r.perfCount + r.periodicCount }))
    .filter((x) => x.val > 0)
    .sort((a, b) => b.val - a.val)
    .slice(0, 8);
  const actMax = Math.max(1, ...activity.map((a) => a.val));

  const half = { width: wide ? "48.6%" : "100%" } as any;

  const RankList = ({ items, value, suffix = "" }: { items: any[]; value: (r: any) => number | string; suffix?: string }) => (
    <View style={{ gap: 8 }}>
      {items.map((r, i) => (
        <Row key={r.id} style={{ justifyContent: "space-between" }}>
          <Row style={{ gap: 9, flex: 1 }}>
            <View style={[ib.rank, i === 0 ? ib.rankGold : i === 1 ? ib.rankSilver : i === 2 ? ib.rankBronze : ib.rankMuted]}>
              <Text style={[ib.rankTxt, i > 2 && { color: colors.textSecondary }]}>{i + 1}</Text>
            </View>
            <Text style={ib.name} numberOfLines={1}>{r.name}</Text>
          </Row>
          <Text style={ib.val}>{value(r)}{suffix}</Text>
        </Row>
      ))}
    </View>
  );

  return (
    <View style={{ marginTop: 28 }}>
      <View style={styles.groupHead}>
        <Text style={styles.groupLabel}>ملخّص الأداء</Text>
        <View style={styles.groupBar} />
      </View>

      <View style={ib.grid}>
        {/* المتميّزات */}
        <Reveal delay={60} style={half}>
          <View style={ib.card}>
            <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <Row style={{ gap: 8 }}><Ionicons name="trophy" size={18} color={colors.gold} /><Text style={ib.cardTitle}>المعلمات المتميّزات</Text></Row>
              <Badge label={useScore ? "بالتقييم السنوي" : "بالنشاط"} tone="gold" />
            </Row>
            <RankList items={topPerformers} value={(r) => useScore ? `${r.lastAnnualScore}%` : `${r.classVisitCount + r.perfCount + r.periodicCount}`} />
          </View>
        </Reveal>

        {/* الأكثر انضباطًا */}
        <Reveal delay={120} style={half}>
          <View style={ib.card}>
            <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <Row style={{ gap: 8 }}><Ionicons name="shield-checkmark" size={18} color={colors.success} /><Text style={ib.cardTitle}>الأكثر انضباطًا</Text></Row>
              <Badge label="الأقل استئذانًا وغيابًا" tone="success" />
            </Row>
            <RankList items={disciplined} value={(r) => r.leaveCount + r.absences} suffix=" غياب/استئذان" />
          </View>
        </Reveal>

        {/* حالة الزيارات — حلقة */}
        <Reveal delay={180} style={half}>
          <View style={ib.card}>
            <Row style={{ gap: 8, marginBottom: 12 }}><Ionicons name="locate" size={18} color={colors.primary} /><Text style={ib.cardTitle}>حالة الزيارات الصفية</Text></Row>
            <Row style={{ justifyContent: "space-around", alignItems: "center" }}>
              <View style={ib.ringWrap}>
                <View style={ib.ringTrack} />
                <View style={[ib.ringFill, { borderTopColor: colors.primary, borderRightColor: visitedPct > 25 ? colors.primary : "transparent", borderBottomColor: visitedPct > 50 ? colors.primary : "transparent", borderLeftColor: visitedPct > 75 ? colors.primary : "transparent", transform: [{ rotate: "45deg" }] }]} />
                <View style={ib.ringInner}><Text style={ib.ringPct}>{visitedPct}%</Text><Text style={ib.ringLbl}>تمّت زيارتهن</Text></View>
              </View>
              <View style={{ gap: 10 }}>
                <View><Text style={[ib.bigNum, { color: colors.success }]}>{visited}</Text><Text style={ib.smLbl}>معلمة زِيرت</Text></View>
                <View><Text style={[ib.bigNum, { color: colors.warning }]}>{total - visited}</Text><Text style={ib.smLbl}>بانتظار الزيارة</Text></View>
              </View>
            </Row>
          </View>
        </Reveal>

        {/* مكتملات المتابعة */}
        <Reveal delay={240} style={half}>
          <View style={ib.card}>
            <Row style={{ gap: 8, marginBottom: 12 }}><Ionicons name="checkmark-done-circle" size={18} color={colors.success} /><Text style={ib.cardTitle}>مكتملات المتابعة</Text></Row>
            <Text style={ib.completeHint}>زيارة صفية + متابعة أداء + تقرير دوري</Text>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
              <Text style={[ib.bigNum, { fontSize: 34, color: colors.primary }]}>{completed.length}<Text style={ib.ofTotal}> / {total}</Text></Text>
              <View style={{ flex: 1, marginRight: 14 }}>
                <View style={ib.barTrack}><View style={[ib.barFillGold, { width: `${Math.round((completed.length / total) * 100)}%` }]} /></View>
              </View>
            </Row>
          </View>
        </Reveal>

        {/* رسم النشاط — أنشط المعلمات */}
        {activity.length > 0 && (
          <Reveal delay={300} style={{ width: "100%" } as any}>
            <View style={ib.card}>
              <Row style={{ gap: 8, marginBottom: 14 }}><Ionicons name="bar-chart" size={18} color={colors.gold} /><Text style={ib.cardTitle}>أنشط المعلمات (زيارات + متابعات + تقارير)</Text></Row>
              <View style={{ gap: 10 }}>
                {activity.map((a) => (
                  <View key={a.name}>
                    <Row style={{ justifyContent: "space-between", marginBottom: 3 }}>
                      <Text style={ib.barName} numberOfLines={1}>{a.name}</Text>
                      <Text style={ib.barVal}>{a.val}</Text>
                    </Row>
                    <View style={ib.barTrack}>
                      <LinearGradient colors={[colors.gold, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[ib.barFill, { width: `${Math.round((a.val / actMax) * 100)}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Reveal>
        )}
      </View>
    </View>
  );
}

const ib = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "space-between" },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, ...shadow.card } as any,
  cardTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  rank: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  rankGold: { backgroundColor: "#FBF1D9", borderColor: "#E8CF94" },
  rankSilver: { backgroundColor: "#F3F4F6", borderColor: "#C9CDD3" },
  rankBronze: { backgroundColor: "#FBEFE6", borderColor: "#E0B58E" },
  rankMuted: { backgroundColor: colors.bg, borderColor: colors.border },
  rankTxt: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.primaryDark },
  name: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text, flex: 1 },
  val: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  bigNum: { fontFamily: fonts.bold, fontSize: 22 },
  smLbl: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSecondary },
  ringWrap: { width: 104, height: 104, alignItems: "center", justifyContent: "center" },
  ringTrack: { position: "absolute", width: 104, height: 104, borderRadius: 52, borderWidth: 9, borderColor: colors.bg },
  ringFill: { position: "absolute", width: 104, height: 104, borderRadius: 52, borderWidth: 9, borderColor: "transparent" },
  ringInner: { alignItems: "center" },
  ringPct: { fontFamily: fonts.bold, fontSize: 22, color: colors.primary },
  ringLbl: { fontFamily: fonts.medium, fontSize: 9.5, color: colors.textSecondary, marginTop: -2 },
  completeHint: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted },
  ofTotal: { fontFamily: fonts.medium, fontSize: 16, color: colors.textMuted },
  barTrack: { height: 11, backgroundColor: colors.bg, borderRadius: 6, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6 } as any,
  barFillGold: { height: "100%", borderRadius: 6, backgroundColor: colors.gold } as any,
  barName: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text, flex: 1 },
  barVal: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.primary },
});

export default function Dashboard() {
  const { loggedIn, ready, logout } = useAuth();
  const stats = useQuery(api.admin.dashboardStats, loggedIn ? {} : "skip");
  const settings = useQuery(api.admin.getSettings, loggedIn ? {} : "skip");
  const seed = useMutation(api.admin.seed);
  const { width } = useWindowDimensions();
  const wide = width > 720;

  useEffect(() => {
    if (settings && !settings.seeded) seed({}).catch(() => {});
  }, [settings]);

  if (!ready) return <Loading />;
  if (!loggedIn) return <Redirect href="/login" />;

  const now = new Date();
  const greeting = now.getHours() < 12 ? "صباح الخير" : "مساء الخير";
  const dateStr = now.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });

  let delay = 0;
  const nextDelay = () => (delay += 60);

  return (
    <Screen>
      {/* الترويسة */}
      <Reveal from="down">
        <LinearGradient
          colors={[colors.primaryDeep, colors.primaryDark, colors.primary]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.hero}
        >
          <View style={[styles.heroPattern, { pointerEvents: "none" }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.heroRing, { width: 260 + i * 130, height: 260 + i * 130 }]} />
            ))}
          </View>
          <View style={[styles.heroGold, { pointerEvents: "none" }]} />
          <View style={{ flex: 1 }}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.heroEyebrow}>{settings?.school ?? "مدرسة النهضة الابتدائية للبنات"}</Text>
            </View>
            <Text style={styles.heroTitle}>{greeting}، أ. {(settings?.coordinator ?? "").split(" ")[0] || "المنسقة"}</Text>
            <Text style={styles.heroSub}>
              {settings?.department ?? "قسم المسار الأدبي"}  ·  العام الأكاديمي {settings?.academicYear ?? ""}
            </Text>
            <View style={styles.dateChip}>
              <Ionicons name="calendar-clear-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.dateChipText}>{dateStr}</Text>
            </View>
          </View>
        </LinearGradient>
      </Reveal>

      {/* حالة القسم — مؤشّر صحّة موحّد */}
      <DeptStatus />

      {/* لوحة اليوم — أول حاجة تحت الترحيب */}
      <TodayBoard />
      <HomeAlerts />

      {/* الإحصائيات */}
      {stats === undefined ? (
        <Loading />
      ) : (
        <View style={styles.statGrid}>
          {[
            { label: "معلمة في القسم", value: stats.teachers, icon: "people" as const, g: ["#4A0F1B", "#5C1523"] as [string, string], tint: colors.primary },
            { label: "طالبة مسجلة", value: stats.students, icon: "school" as const, g: ["#3B0A14", "#5C1523"] as [string, string], tint: colors.primaryDark },
            { label: "زيارة صفية منفذة", value: stats.visitsDone, icon: "footsteps" as const, g: ["#A8853A", "#DFC48E"] as [string, string], tint: colors.gold },
            { label: "توصية بانتظار التنفيذ", value: stats.pendingRecommendations, icon: "alert" as const, g: ["#4A0F1B", "#5C1523"] as [string, string], tint: colors.primary },
          ].map((s, i) => (
            <Reveal key={s.label} delay={120 + i * 80} style={[styles.statWrap, { width: wide ? "23.5%" : "47.6%" }] as any}>
              <View style={styles.stat}>
                <View style={styles.statTopRow}>
                  <LinearGradient colors={s.g} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.statIcon}>
                    <Ionicons name={s.icon} size={18} color="#fff" />
                  </LinearGradient>
                </View>
                <CountUp value={s.value} style={styles.statValue} />
                <Text style={styles.statLabel}>{s.label}</Text>
                <View style={[styles.statAccent, { backgroundColor: s.tint }]} />
              </View>
            </Reveal>
          ))}
        </View>
      )}

      {/* ملخّص الأداء — متميّزات، انضباط، زيارات، نشاط */}
      <InsightsBoard />

      {/* المجموعات — بطاقات متدرجة ملونة */}
      {GROUPS.map((g, gi) => (
        <View key={g.label} style={{ marginTop: 28 }}>
          <Reveal delay={200 + gi * 90}>
            <View style={styles.groupHead}>
              <Text style={styles.groupLabel}>{g.label}</Text>
              <View style={styles.groupBar} />
            </View>
          </Reveal>
          <View style={styles.grid}>
            {g.modules.map((m, mi) => (
              <Reveal
                key={m.href}
                delay={260 + gi * 90 + mi * 70}
                style={{ width: wide ? "32%" : "100%" } as any}
              >
                <Pressable
                  onPress={() => router.push(m.href as any)}
                  style={({ hovered, pressed }: any) => [
                    styles.moduleWrap,
                    hovered && styles.moduleHover,
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View style={styles.module}>
                    <LinearGradient
                      colors={m.gradient}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.moduleIcon}
                    >
                      <Ionicons name={m.icon} size={22} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.moduleTitle}>{m.title}</Text>
                      <Text style={styles.moduleDesc}>{m.desc}</Text>
                    </View>
                    <View style={styles.moduleArrow}>
                      <Ionicons name="arrow-back" size={15} color={colors.primary} />
                    </View>
                  </View>
                </Pressable>
              </Reveal>
            ))}
          </View>
        </View>
      ))}

      {/* آخر النشاط */}
      {stats && stats.latestMeetings.length > 0 && (
        <Reveal delay={500} style={{ marginTop: 28 } as any}>
          <View style={styles.groupHead}>
            <Text style={styles.groupLabel}>آخر الاجتماعات</Text>
            <View style={styles.groupBar} />
          </View>
          <View style={styles.activityCard}>
            {stats.latestMeetings.map((m: any, i: number) => (
              <Pressable
                key={m._id}
                onPress={() => router.push(`/meetings/${m._id}`)}
                style={({ hovered }: any) => [
                  styles.activityRow,
                  i < stats.latestMeetings.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  hovered && { backgroundColor: colors.primaryTint },
                ]}
              >
                <LinearGradient colors={["#4A0F1B", "#5C1523"]} style={styles.activityDot} />
                <Text style={styles.activityText} numberOfLines={1}>
                  {m.type === "group" ? `محضر اجتماع أكاديمي (${m.number ?? ""})` : `اجتماع فردي${m.teacherName ? " — " + m.teacherName : ""}`}
                </Text>
                <Badge label={m.date} tone="muted" />
              </Pressable>
            ))}
          </View>
        </Reveal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.xl,
    padding: 28,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    ...shadow.raised,
  },
  heroPattern: { position: "absolute", left: -130, top: -120, alignItems: "center", justifyContent: "center" },
  heroRing: { position: "absolute", borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  heroGold: {
    position: "absolute", right: -60, bottom: -90, width: 220, height: 220, borderRadius: 999,
    backgroundColor: "rgba(201,154,46,0.18)",
  },
  heroLeaf: {
    position: "absolute", left: 22, bottom: 22, width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  dateChip: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
  },
  dateChipText: { fontFamily: fonts.medium, fontSize: 11.5, color: "rgba(255,255,255,0.9)" },
  eyebrowRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 7, marginBottom: 8 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  heroEyebrow: { fontFamily: fonts.medium, fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "right", letterSpacing: 0.4 },
  heroTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.white, textAlign: "right" },
  heroSub: { fontFamily: fonts.regular, fontSize: 13.5, color: "rgba(255,255,255,0.72)", textAlign: "right", marginTop: 6 },
  logoutBtn: {
    width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    ...(Platform.OS === "web" ? { transitionDuration: "150ms" as any, cursor: "pointer" as any } : {}),
  },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statWrap: { flexGrow: 1 },
  today: { marginTop: 24, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, ...shadow.card },
  todayHead: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 9, marginBottom: 12 },
  todayIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  todayTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text, textAlign: "right" },
  todayRow: { flexDirection: "row", gap: 10 },
  todayCard: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border },
  todayNum: { fontFamily: fonts.bold, fontSize: 26, color: colors.primary, textAlign: "right" },
  todayLbl: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textSecondary, textAlign: "right", marginBottom: 4 },
  todayName: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted, textAlign: "right" },
  todayEmpty: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textMuted, textAlign: "center", marginTop: 12 },
  alertHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  alertCount: {
    minWidth: 26, height: 24, borderRadius: 999, paddingHorizontal: 8,
    backgroundColor: colors.warningSoft, alignItems: "center", justifyContent: "center",
  },
  alertCountTxt: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.warning },
  alertGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  alertItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: "transparent",
    ...(Platform.OS === "web" ? { transitionDuration: "150ms" as any, cursor: "pointer" as any } : {}),
  },
  alertIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  alertName: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.text, textAlign: "right" },
  alertText: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textSecondary, textAlign: "right", marginTop: 1 },
  alertMore: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 12, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.primaryTint,
    ...(Platform.OS === "web" ? { cursor: "pointer" as any } : {}),
  },
  alertMoreTxt: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary },
  stat: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    paddingVertical: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border,
    overflow: "hidden", ...shadow.card,
  },
  statTopRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 12 },
  statIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: fonts.bold, fontSize: 28, color: colors.text, textAlign: "right", lineHeight: 32 },
  statLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, textAlign: "right", marginTop: 2 },
  statAccent: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3, opacity: 0.85 },
  groupHead: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 9, marginBottom: 12 },
  groupBar: { width: 22, height: 4, borderRadius: 2, backgroundColor: colors.gold },
  groupLabel: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.text, textAlign: "right" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  moduleWrap: {
    borderRadius: radius.lg + 2,
    ...(Platform.OS === "web" ? { transitionDuration: "200ms" as any, cursor: "pointer" as any } : {}),
    ...shadow.card,
  },
  moduleHover: { transform: [{ translateY: -3 }], ...shadow.raised, borderColor: colors.borderStrong },
  module: {
    flexDirection: "row", alignItems: "center", gap: 13,
    borderRadius: radius.lg + 2, padding: 16, overflow: "hidden",
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  moduleIcon: {
    width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center",
  },
  moduleTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary, textAlign: "right" },
  moduleDesc: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted, textAlign: "right", marginTop: 2 },
  moduleArrow: {
    width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  activityCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: "hidden", ...shadow.card,
  },
  activityRow: {
    flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 16, paddingVertical: 13,
    ...(Platform.OS === "web" ? { transitionDuration: "120ms" as any, cursor: "pointer" as any } : {}),
  },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityText: { flex: 1, fontFamily: fonts.medium, fontSize: 13.5, color: colors.text, textAlign: "right" },
});
