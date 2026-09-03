// محرّك قواعد الجدول ومولّده — يعمل داخل التطبيق مباشرة.
// المبدأ: لا نغيّر الجدول العام للمدرسة إطلاقاً. نعيد ترتيب حصص القسم فقط
// داخل الخانات التي يشغلها القسم أصلاً، فتبقى الحاسب والرياضة والفنية في أماكنها.

export const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7];
export const FIXED_CELLS = new Set(["جلسة تحضير", "اجتماع القسم", "تطوير"]);

export const ARABIC = "اللغة العربية";
export const ISLAMIC = "التربية الإسلامية";
export const ENGLISH = "اللغة الإنجليزية";

const GRADE_N: Record<string, string> = { "الأول": "1", "الثاني": "2" };
const SEC_L: Record<string, string> = { "أ": "A", "ب": "B", "ج": "C", "د": "D", "هـ": "E" };

export type Slot = {
  teacher: string; day: string; period: number;
  classCode: string; className: string; subject: string; fixed: boolean;
};
export type Violation = { rule: number; sev: "تعارض" | "إلزامي" | "تفضيلي"; msg: string };

/** إعدادات القيود القابلة للتحكم من داخل التطبيق */
export type RuleConfig = {
  noFirstPeriod: { teacher: string; day: string }[];
  reduceHours: { teacher: string; amount: number }[];
  noSubjectFirstOnDay: { subject: string; day: string }[];
  minPerDay: { subject: string; min: number }[];
  firstPrefer: string[];
  toggles: Record<string, boolean>;
  includeTeachers?: string[];
};

export const EMPTY_CONFIG: RuleConfig = {
  noFirstPeriod: [], reduceHours: [], noSubjectFirstOnDay: [],
  minPerDay: [], firstPrefer: [], toggles: {},
};

/** يبني الإعدادات من صفوف جدول القيود في Convex */
export function buildConfig(rows: any[]): RuleConfig {
  const c: RuleConfig = {
    noFirstPeriod: [], reduceHours: [], noSubjectFirstOnDay: [],
    minPerDay: [], firstPrefer: [], toggles: {},
  };
  for (const r of rows ?? []) {
    if (!r.enabled) continue;
    if (r.kind === "noFirstPeriod") c.noFirstPeriod.push({ teacher: r.teacherName ?? "", day: r.day ?? "" });
    else if (r.kind === "reduceHours") c.reduceHours.push({ teacher: r.teacherName ?? "", amount: Number(r.amount ?? 0) });
    else if (r.kind === "noSubjectFirstOnDay") c.noSubjectFirstOnDay.push({ subject: r.subject ?? "", day: r.day ?? "" });
    else if (r.kind === "minPerDay") c.minPerDay.push({ subject: r.subject ?? "", min: Number(r.amount ?? 2) });
    else if (r.kind === "firstPrefer" && r.subject) c.firstPrefer.push(r.subject);
    else if (r.kind === "rule" && r.ruleId) c.toggles[r.ruleId] = true;
  }
  return c;
}

const matchTeacher = (name: string, pat: string) =>
  !!pat && (name === pat || name.indexOf(pat) === 0 || name.indexOf(pat) >= 0);

/** تحويل صفوف جدول Convex إلى صيغة المحرّك */
export function toSlots(rows: any[]): Slot[] {
  return (rows ?? []).map((r) => {
    const fixed = FIXED_CELLS.has(r.className);
    let classCode = "";
    if (!fixed) {
      const parts = String(r.className).split("/");
      classCode = (GRADE_N[(parts[0] || "").trim()] ?? "") + (SEC_L[(parts[1] || "").trim()] ?? "");
    }
    return {
      teacher: r.teacherName, day: r.day, period: Number(r.period),
      classCode, className: r.className, subject: r.subject ?? "", fixed,
    };
  }).filter((s) => s.period >= 1 && s.period <= 7 && DAYS.indexOf(s.day) >= 0);
}

/** إعادة الصيغة إلى صفوف Convex */
export function toRows(slots: Slot[]) {
  return slots.map((s) => ({
    teacherName: s.teacher, day: s.day, period: String(s.period),
    className: s.className, subject: s.subject || undefined,
  }));
}

const isTeach = (r: Slot) => !r.fixed;

/** فحص كل القواعد وإرجاع المخالفات */
export function checkRules(rows: Slot[], cfg: RuleConfig = EMPTY_CONFIG): Violation[] {
  const v: Violation[] = [];
  const teachers = Array.from(new Set(rows.map((r) => r.teacher)));
  const byT: Record<string, Slot[]> = {};
  for (const r of rows) (byT[r.teacher] = byT[r.teacher] || []).push(r);
  const byC: Record<string, Slot[]> = {};
  for (const r of rows.filter(isTeach)) (byC[r.classCode] = byC[r.classCode] || []).push(r);

  const prefers = cfg.firstPrefer.length ? cfg.firstPrefer : [];
  for (const r of rows.filter(isTeach)) {
    for (const nf of cfg.noFirstPeriod) {
      if (r.period === 1 && matchTeacher(r.teacher, nf.teacher) && (!nf.day || nf.day === r.day))
        v.push({ rule: 1, sev: "إلزامي", msg: `${r.teacher}: حصة أولى ${r.day} (ممنوعة بالقيود)` });
    }
    for (const ns of cfg.noSubjectFirstOnDay) {
      if (r.period === 1 && r.subject === ns.subject && (!ns.day || ns.day === r.day))
        v.push({ rule: 2, sev: "إلزامي", msg: `${ns.subject} حصة أولى ${r.day} — ${r.teacher} (${r.classCode})` });
    }
    if (prefers.length && r.period === 1 && prefers.indexOf(r.subject) < 0)
      v.push({ rule: 6, sev: "تفضيلي", msg: `حصة أولى ${r.subject} — ${r.day} ${r.classCode} (${r.teacher})` });
  }

  for (const rh of cfg.reduceHours) {
    const t = teachers.filter((x) => matchTeacher(x, rh.teacher))[0];
    if (!t || !byT[t]) continue;
    const n = byT[t].filter(isTeach).length;
    const base = (cfg as any)._baseline?.[t];
    if (base != null && n > base - rh.amount)
      v.push({ rule: 3, sev: "إلزامي", msg: `نصاب ${t} = ${n} والمطلوب ${base - rh.amount} (تخفيف ${rh.amount})` });
  }

  for (const mp of cfg.minPerDay) {
    for (const t of teachers) {
      const rs = byT[t].filter(isTeach);
      if (!rs.some((r) => r.subject === mp.subject)) continue;
      for (const d of DAYS) {
        const n = rs.filter((r) => r.day === d).length;
        if (n > 0 && n < mp.min)
          v.push({ rule: 9, sev: "إلزامي", msg: `${t}: ${d} فيه ${n} حصة فقط (الحد الأدنى ${mp.min})` });
      }
    }
  }

  if (cfg.toggles.islamicConsecutive !== false) for (const key of Object.keys(byC)) {
    const rs = byC[key];
    const ds = Array.from(new Set(rs.filter((r) => r.subject === ISLAMIC).map((r) => DAYS.indexOf(r.day)))).sort((a, b) => a - b);
    if (ds.length > 1) {
      let ok = true;
      for (let i = 1; i < ds.length; i++) if (ds[i] - ds[i - 1] !== 1) ok = false;
      if (!ok) v.push({ rule: 5, sev: "تفضيلي", msg: `الشرعية ${key} أيامها غير متتالية: ${ds.map((i) => DAYS[i]).join("، ")}` });
    }
  }

  const bySub: Record<string, number[]> = {};
  for (const r of rows.filter(isTeach)) {
    const k = r.classCode + "|" + r.subject + "|" + r.day;
    (bySub[k] = bySub[k] || []).push(r.period);
  }
  if (cfg.toggles.blocks !== false) for (const k of Object.keys(bySub)) {
    const ps = bySub[k].sort((a, b) => a - b);
    if (ps.length < 2) continue;
    let runs = 1;
    for (let i = 1; i < ps.length; i++) if (ps[i] - ps[i - 1] !== 1) runs++;
    const allowed = Math.ceil(ps.length / 2);
    if (runs > allowed) {
      const parts = k.split("|");
      v.push({ rule: 7, sev: "تفضيلي", msg: `${parts[0]} ${parts[1]} ${parts[2]}: غير متلاصقة (${ps.join("،")})` });
    }
  }

  const last: Record<string, number> = {};
  for (const t of teachers) last[t] = byT[t].filter((r) => isTeach(r) && r.period === 7).length;
  const vals = Object.keys(last).map((k) => last[k]);
  if (cfg.toggles.fairLast !== false && vals.length) {
    const mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
    if (mx - mn > 1) {
      const hi = Object.keys(last).filter((t) => last[t] === mx);
      v.push({ rule: 8, sev: "تفضيلي", msg: `الحصة الأخيرة غير عادلة: من ${mn} إلى ${mx} (الأكثر: ${hi.join("، ")})` });
    }
  }

  const slotT: Record<string, boolean> = {}, slotC: Record<string, boolean> = {};
  for (const r of rows.filter(isTeach)) {
    const k = r.teacher + "|" + r.day + "|" + r.period;
    if (slotT[k]) v.push({ rule: 0, sev: "تعارض", msg: `${r.teacher} مزدوجة ${r.day} ح${r.period}` });
    slotT[k] = true;
    const k2 = r.classCode + "|" + r.day + "|" + r.period;
    if (slotC[k2]) v.push({ rule: 0, sev: "تعارض", msg: `الصف ${r.classCode} مزدوج ${r.day} ح${r.period}` });
    slotC[k2] = true;
  }
  return v;
}

const W: Record<string, number> = { "تعارض": 1000, "إلزامي": 100, "تفضيلي": 1 };

export type SolveResult = {
  rows: Slot[];
  dropped: Slot[];
  violations: Violation[];
  score: number;
};

type Work = Slot & { _id: number };

/** مولّد الجدول: بحث محلي (تلدين محاكى) داخل خانات القسم فقط */
/** يجهّز سياق البحث: الخانات المتاحة والقيود الصلبة ودالة التقييم */
function prepare(all: Slot[], cfg: RuleConfig) {
  const baseline: Record<string, number> = {};
  for (const r of all) if (!r.fixed) baseline[r.teacher] = (baseline[r.teacher] || 0) + 1;
  const cfgB: any = { ...cfg, _baseline: baseline };

  const fixed = all.filter((r) => r.fixed);
  let lessons: Work[] = all.filter((r) => !r.fixed).map((r, i) => ({ ...r, _id: i }));

  // تخفيف الساعات حسب القيود: يُسقط الحصص من أكثر أيام المعلمة ازدحاماً
  const dropped: Slot[] = [];
  const allTeachers = Array.from(new Set(lessons.map((l) => l.teacher)));
  for (const rh of cfg.reduceHours) {
    const t = allTeachers.filter((x) => matchTeacher(x, rh.teacher))[0];
    if (!t) continue;
    for (let k = 0; k < (rh.amount || 0); k++) {
      const mine = lessons.filter((l) => l.teacher === t);
      if (!mine.length) break;
      const cnt: Record<string, number> = {};
      mine.forEach((l) => (cnt[l.day] = (cnt[l.day] || 0) + 1));
      const day = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
      const cand = mine.filter((l) => l.day === day).sort((a, b) => b.period - a.period)[0];
      dropped.push(cand);
      lessons = lessons.filter((l) => l._id !== cand._id);
    }
  }

  const classSlots: Record<string, Record<string, boolean>> = {};
  for (const l of lessons) {
    classSlots[l.classCode] = classSlots[l.classCode] || {};
    classSlots[l.classCode][l.day + "|" + l.period] = true;
  }
  for (const d of dropped) {
    classSlots[d.classCode] = classSlots[d.classCode] || {};
    classSlots[d.classCode][d.day + "|" + d.period] = true;
  }
  const slotsOf = (c: string) => Object.keys(classSlots[c] || {}).map((k) => {
    const parts = k.split("|"); return { day: parts[0], period: Number(parts[1]) };
  });

  const teacherBlocked: Record<string, boolean> = {};
  for (const f of fixed) teacherBlocked[f.teacher + "|" + f.day + "|" + f.period] = true;

  const feasible = (arr: Work[]) => {
    const t: Record<string, boolean> = {}, c: Record<string, boolean> = {};
    for (const l of arr) {
      const kt = l.teacher + "|" + l.day + "|" + l.period;
      const kc = l.classCode + "|" + l.day + "|" + l.period;
      if (t[kt] || c[kc] || teacherBlocked[kt]) return false;
      t[kt] = true; c[kc] = true;
    }
    return true;
  };

  const score = (arr: Work[]) => {
    let sc = checkRules((arr as Slot[]).concat(fixed), cfgB).reduce((a, x) => a + W[x.sev], 0);
    const last: Record<string, number> = {};
    for (const l of arr) { last[l.teacher] = last[l.teacher] || 0; if (l.period === 7) last[l.teacher]++; }
    const vals = Object.keys(last).map((k) => last[k]);
    if (vals.length) {
      const mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
      sc += 4 * Math.max(0, mx - mn - 1);
    }
    return sc;
  };

  return { fixed, lessons, slotsOf, feasible, score, classes: Object.keys(classSlots), cfgB, dropped };
}

type RunState = { cur: Work[]; curS: number; best: Work[]; bestS: number; it: number; rndState: number };

/** يشغّل جزءاً من دورات البحث ويعيد الحالة — يسمح بتقطيع العمل حتى لا تتجمّد الواجهة */
function runChunk(ctx: ReturnType<typeof prepare>, st: RunState, count: number, total: number) {
  let s = st.rndState >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const end = Math.min(st.it + count, total);
  for (; st.it < end; st.it++) {
    const T = 6 * (1 - st.it / total) + 0.05;
    const c = ctx.classes[Math.floor(rnd() * ctx.classes.length)];
    const idx: number[] = [];
    for (let i = 0; i < st.cur.length; i++) if (st.cur[i].classCode === c) idx.push(i);
    if (idx.length < 2) continue;
    const a = idx[Math.floor(rnd() * idx.length)];
    let trial: Work[];
    if (rnd() < 0.35) {
      const used: Record<string, boolean> = {};
      for (const i of idx) used[st.cur[i].day + "|" + st.cur[i].period] = true;
      const free = ctx.slotsOf(c).filter((sl) => !used[sl.day + "|" + sl.period]);
      if (!free.length) continue;
      const f = free[Math.floor(rnd() * free.length)];
      trial = st.cur.map((l) => ({ ...l }));
      trial[a].day = f.day; trial[a].period = f.period;
    } else {
      const b = idx[Math.floor(rnd() * idx.length)];
      if (a === b) continue;
      trial = st.cur.map((l) => ({ ...l }));
      const td = trial[a].day, tp = trial[a].period;
      trial[a].day = trial[b].day; trial[a].period = trial[b].period;
      trial[b].day = td; trial[b].period = tp;
    }
    if (!ctx.feasible(trial)) continue;
    const sc = ctx.score(trial);
    if (sc <= st.curS || rnd() < Math.exp((st.curS - sc) / T)) {
      st.cur = trial; st.curS = sc;
      if (sc < st.bestS) { st.bestS = sc; st.best = trial.map((l) => ({ ...l })); }
    }
  }
  st.rndState = s;
}

function initState(ctx: ReturnType<typeof prepare>, seed: number): RunState {
  const cur = ctx.lessons.map((l) => ({ ...l }));
  const bestS = ctx.score(cur);
  return { cur, curS: bestS, best: cur.map((l) => ({ ...l })), bestS, it: 0, rndState: seed >>> 0 };
}

/** مولّد الجدول (متزامن) — يُستخدم في الاختبارات والسكربتات */
export function generate(all: Slot[], cfg: RuleConfig = EMPTY_CONFIG, opts: { iterations?: number; seed?: number } = {}): SolveResult {
  const ctx = prepare(all, cfg);
  const total = opts.iterations ?? 60000;
  const st = initState(ctx, opts.seed ?? 1);
  runChunk(ctx, st, total, total);
  const rows = (st.best as Slot[]).concat(ctx.fixed);
  return { rows, dropped: ctx.dropped, violations: checkRules(rows, ctx.cfgB), score: st.bestS };
}

/**
 * مولّد الجدول (غير متزامن) — يقطّع العمل ويتنازل للمتصفح بين الأجزاء،
 * فتبقى الواجهة مستجيبة ويظهر تقدّم العملية.
 */
export async function generateAsync(
  all: Slot[],
  cfg: RuleConfig = EMPTY_CONFIG,
  opts: { iterations?: number; seeds?: number; onProgress?: (p: number) => void } = {}
): Promise<SolveResult> {
  const ctx = prepare(all, cfg);
  const total = opts.iterations ?? 12000;
  const seeds = opts.seeds ?? 3;
  const CHUNK = 1200;
  const yieldToUi = () => new Promise((r) => setTimeout(r, 0));

  let best: Work[] | null = null;
  let bestS = Infinity;

  for (let sd = 1; sd <= seeds; sd++) {
    const st = initState(ctx, sd);
    while (st.it < total) {
      runChunk(ctx, st, CHUNK, total);
      if (opts.onProgress) opts.onProgress(((sd - 1) * total + st.it) / (seeds * total));
      await yieldToUi();
    }
    if (st.bestS < bestS) { bestS = st.bestS; best = st.best; }
  }

  const rows = ((best ?? ctx.lessons) as Slot[]).concat(ctx.fixed);
  return { rows, dropped: ctx.dropped, violations: checkRules(rows, ctx.cfgB), score: bestS };
}
