import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const teacherFields = {
  jobTitle: v.optional(v.string()),
  employeeNumber: v.optional(v.string()),
  nationalId: v.optional(v.string()),
  nationality: v.optional(v.string()),
  specialization: v.optional(v.string()),
  grade: v.optional(v.string()),
  section: v.optional(v.string()),
  subject: v.optional(v.string()),
  yearsTrack: v.optional(v.string()),
  yearsTotal: v.optional(v.string()),
  followMode: v.optional(v.string()),
  hireDate: v.optional(v.string()),
  appointmentDate: v.optional(v.string()),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  license: v.optional(v.string()),
  level: v.optional(v.string()),
  subjects: v.optional(v.array(v.string())),
};

export const list = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("teachers").collect()).sort((a, b) => a.name.localeCompare(b.name, "ar")),
});

export const create = mutation({
  args: { name: v.string(), ...teacherFields },
  handler: async (ctx, args) => ctx.db.insert("teachers", { ...args, active: true }),
});

export const update = mutation({
  args: { id: v.id("teachers"), name: v.optional(v.string()), active: v.optional(v.boolean()), ...teacherFields },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("teachers") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// حذف المعلمات المكررة (نفس الرقم الوظيفي أو اسم مختصر مطابق لاسم أطول) — يُبقي الأكمل بياناتاً
export const dedupe = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("teachers").collect();
    const score = (t: any) => Object.values(t).filter((v) => v !== undefined && v !== "" && v !== false).length;
    const removed: string[] = [];
    const kept = [...all];
    // 1) تكرار بنفس الرقم الوظيفي
    const byEmp: Record<string, any[]> = {};
    for (const t of all) if (t.employeeNumber) (byEmp[t.employeeNumber] ??= []).push(t);
    for (const grp of Object.values(byEmp)) {
      if (grp.length < 2) continue;
      grp.sort((a, b) => score(b) - score(a));
      for (const dup of grp.slice(1)) { await ctx.db.delete(dup._id); removed.push(dup.name); }
    }
    // 2) اسم مختصر مبتلع داخل اسم رباعي (بدون رقم وظيفي) — مثل «حمدة الشمري» داخل «حمدة سليمان … الشمري»
    const remain = (await ctx.db.query("teachers").collect());
    for (const t of remain) {
      if (t.employeeNumber) continue;
      const parts = t.name.split(/\s+/);
      const longer = remain.find((o) => o._id !== t._id && o.name !== t.name && parts.every((p) => o.name.includes(p)) && o.name.length > t.name.length);
      if (longer) { await ctx.db.delete(t._id); removed.push(t.name); }
    }
    return { removed };
  },
});

// بيانات المعلمات المستخرجة من استمارات التوجيه التربوي واستمارات الزيارة المعبأة (للبذر/التحديث)
// matchName: اسم البحث عن السجل الموجود • name: الاسم الرباعي الرسمي
type RosterRow = { matchName: string; name: string; employeeNumber?: string; nationality?: string; specialization?: string; jobTitle?: string; grade?: string; section?: string; subject?: string; yearsTrack?: string; yearsTotal?: string; followMode?: string };
const JOB = "معلم المرحلة التأسيسية أدبي";
const ROSTER: RosterRow[] = [
  { matchName: "شعيع", name: "شعيع عبيد جهيم الشمري", employeeNumber: "61158", nationality: "قطري", specialization: "بكالوريوس لغة عربية", jobTitle: JOB, grade: "الأول", section: "A", subject: "اللغة العربية", yearsTrack: "15", yearsTotal: "17" },
  { matchName: "حمدة", name: "حمدة سليمان قعيس الشمري", employeeNumber: "81298", nationality: "قطري", specialization: "بكالوريوس لغة عربية", jobTitle: JOB, grade: "الثاني", section: "A", subject: "اللغة العربية" },
  { matchName: "مريم الشمري", name: "مريم ساير صحن الشمري", employeeNumber: "68130", nationality: "قطري", specialization: "بكالوريوس لغة عربية", jobTitle: JOB, grade: "الثاني", section: "D", subject: "اللغة العربية" },
  { matchName: "مشاعل", name: "مشاعل محمد عيد القحطاني", employeeNumber: "83895", nationality: "قطري", specialization: "بكالوريوس آداب دراسات أدبية", jobTitle: JOB, grade: "الثاني", section: "C", subject: "اللغة العربية" },
  { matchName: "نور الشمري", name: "نور ثنيان جهيم الشمري", employeeNumber: "141879", nationality: "قطري", specialization: "بكالوريوس دراسات عربية", jobTitle: JOB, grade: "الثاني", section: "B", subject: "اللغة العربية" },
  { matchName: "ضحى", name: "ضحى عبدالله مبارك السليطي", employeeNumber: "69760", nationality: "قطري", specialization: "علوم وآداب لغة عربية", jobTitle: JOB, grade: "الأول", section: "B", subject: "اللغة العربية" },
  { matchName: "هدى التميمي", name: "هدى التميمي", jobTitle: JOB, grade: "الثاني", subject: "اللغة العربية" },
  { matchName: "جوهرة", name: "جوهرة اليافعي", jobTitle: JOB, grade: "الثاني", section: "B", subject: "اللغة العربية" },
  { matchName: "ريناد", name: "ريناد الدوسري", jobTitle: JOB, grade: "الأول", section: "D", subject: "اللغة العربية" },
  { matchName: "صافية", name: "صافية المري", jobTitle: JOB, grade: "الأول", section: "C", subject: "اللغة العربية" },
];

// بذر/تحديث بيانات المعلمات من الاستمارات — يطابق بـ matchName، يحدّث الحقول الفارغة + يرقّي الاسم للرباعي
export const seedRoster = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("teachers").collect();
    let added = 0, updated = 0;
    for (const row of ROSTER) {
      const { matchName, name, ...fields } = row;
      if (row.employeeNumber && !(fields as any).followMode) (fields as any).followMode = "مباشر";
      const match = existing.find((t) => t.name === name || t.name.includes(matchName) || matchName.includes(t.name));
      if (match) {
        const patch: Record<string, string> = {};
        // رقِّ الاسم القصير إلى الرباعي الرسمي إن كان الحالي أقصر
        if (name.length > match.name.length) patch.name = name;
        for (const [k, val] of Object.entries(fields)) {
          if (!val) continue;
          if (!(match as any)[k]) patch[k] = val as string;
        }
        if (Object.keys(patch).length) { await ctx.db.patch(match._id, patch); updated++; }
      } else {
        await ctx.db.insert("teachers", { name, ...fields, active: true });
        added++;
      }
    }
    return { added, updated };
  },
});

// ============================================================
// بيانات القسم الرسمية من ملف Excel (بيانات القسم 2026-2027) — 15 معلمة
// matchEmp: مطابقة بالرقم الوظيفي • matchName: مطابقة احتياطية بالاسم
// ============================================================
type ExcelRow = {
  name: string; employeeNumber: string; nationality: string; grade: string; section: string;
  jobTitle: string; nationalId: string; phone: string; email: string; matchName: string;
};
const DEPT_JOB_TEACHER = "معلمة مسار أدبي";
const DEPT_JOB_ASSISTANT = "معلم مساعد";
const DEPT_ROSTER: ExcelRow[] = [
  { name: "شعاع عبيد الشمري", employeeNumber: "61158", nationality: "قطرية", grade: "الأول", section: "A", jobTitle: DEPT_JOB_TEACHER, nationalId: "28563400047", phone: "66991344", email: "s.al-shammari2302@education.qa", matchName: "شعاع" },
  { name: "ضحى عبدالله السليطي", employeeNumber: "69760", nationality: "قطرية", grade: "الأول", section: "B", jobTitle: DEPT_JOB_TEACHER, nationalId: "28063401836", phone: "55417777", email: "d.al-sulaiti2410@education.qa", matchName: "ضحى" },
  { name: "صافية صالح المري", employeeNumber: "167882", nationality: "قطرية", grade: "الأول", section: "C", jobTitle: DEPT_JOB_TEACHER, nationalId: "2946304469", phone: "70272677", email: "s.marri1111@education.qa", matchName: "صافية" },
  { name: "ريناد سعيد الدوسري", employeeNumber: "186569", nationality: "قطرية", grade: "الأول", section: "D", jobTitle: DEPT_JOB_TEACHER, nationalId: "30063403318", phone: "33031233", email: "r.al-dosari1208@education.qa", matchName: "ريناد" },
  { name: "سارة محسن المسيفري", employeeNumber: "11361", nationality: "قطرية", grade: "الأول", section: "E", jobTitle: DEPT_JOB_TEACHER, nationalId: "27063402785", phone: "55830129", email: "s.al-hajri3108@education.qa", matchName: "سارة" },
  { name: "حمدة سليمان الشمري", employeeNumber: "81298", nationality: "قطرية", grade: "الثاني", section: "A", jobTitle: DEPT_JOB_TEACHER, nationalId: "28963403132", phone: "55325590", email: "h.al-shammari05081@education.qa", matchName: "حمدة سليمان" },
  { name: "نور ثنيان الشمري", employeeNumber: "63490", nationality: "قطرية", grade: "الثاني", section: "B", jobTitle: DEPT_JOB_TEACHER, nationalId: "28763400245", phone: "30043188", email: "n.al-shammari2610@education.qa", matchName: "نور" },
  { name: "مشاعل محمد القحطاني", employeeNumber: "83895", nationality: "قطرية", grade: "الثاني", section: "C", jobTitle: DEPT_JOB_TEACHER, nationalId: "28168200371", phone: "55007236", email: "m.alqahtani2105@education.qa", matchName: "مشاعل" },
  { name: "مريم ساير الشمري", employeeNumber: "68130", nationality: "قطرية", grade: "الثاني", section: "D", jobTitle: DEPT_JOB_TEACHER, nationalId: "28063403441", phone: "66807612", email: "m.al-shamari1505@education.qa", matchName: "مريم ساير" },
  { name: "منيفة عويد الشمري", employeeNumber: "63278", nationality: "قطرية", grade: "الثاني", section: "E", jobTitle: DEPT_JOB_TEACHER, nationalId: "2776820048", phone: "66652825", email: "m.alshammri0101@education.qa", matchName: "منيفة" },
  { name: "عائشة سلطان المسيفري", employeeNumber: "76827", nationality: "قطرية", grade: "الأول", section: "A", jobTitle: DEPT_JOB_ASSISTANT, nationalId: "27963400029", phone: "33555363", email: "a.almesaifri0506@education.qa", matchName: "عائشة سلطان" },
  { name: "هيام علي اليهري", employeeNumber: "76741", nationality: "قطرية", grade: "الأول", section: "B", jobTitle: DEPT_JOB_ASSISTANT, nationalId: "2746301784", phone: "55190666", email: "h.alyafei2701@education.qa", matchName: "هيام" },
  { name: "دلال عبيد الشمري", employeeNumber: "146601", nationality: "قطرية", grade: "الأول", section: "C", jobTitle: DEPT_JOB_ASSISTANT, nationalId: "28663400045", phone: "33007227", email: "d.shammari2611@education.qa", matchName: "دلال" },
  { name: "فاطمة خلف الشمري", employeeNumber: "111191", nationality: "قطرية", grade: "الأول", section: "D", jobTitle: DEPT_JOB_ASSISTANT, nationalId: "28963401419", phone: "66339696", email: "f.al-shammari1409@education.qa", matchName: "فاطمة" },
  { name: "حمدة ناصر النعيمي", employeeNumber: "76896", nationality: "قطرية", grade: "الأول", section: "E", jobTitle: DEPT_JOB_ASSISTANT, nationalId: "29063404416", phone: "50401113", email: "h.naimi1503@education.qa", matchName: "حمدة ناصر" },
];

// دمج وتحديث بيانات المعلمات من Excel: يطابق بالرقم الوظيفي ثم بالاسم،
// يحدّث الحقول الرسمية (Excel مرجع)، ويضيف الناقص، ويترك من ليس في Excel كما هو.
export const importFromExcel = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("teachers").collect();
    let added = 0, updated = 0;
    for (const row of DEPT_ROSTER) {
      const { matchName, ...data } = row;
      const fields = { ...data, followMode: "مباشر" as string };
      // مطابقة: نفس الرقم الوظيفي، أو الاسم يحتوي مقطع المطابقة
      const parts = matchName.split(/\s+/);
      const match = existing.find((t) =>
        (t.employeeNumber && t.employeeNumber === row.employeeNumber) ||
        parts.every((p) => t.name.includes(p))
      );
      if (match) {
        // Excel مرجعي: نكتب الحقول الرسمية فوق الموجود (الاسم الرسمي، الرقم، الإيميل...)
        await ctx.db.patch(match._id, { ...fields, name: row.name, active: true });
        updated++;
      } else {
        await ctx.db.insert("teachers", { ...fields, active: true });
        added++;
      }
    }
    // ضبط النائب الأكاديمي والمنسقة من بيانات القسم الرسمية
    const setSetting = async (key: string, value: string) => {
      const ex = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", key)).first();
      if (ex) await ctx.db.patch(ex._id, { value });
      else await ctx.db.insert("settings", { key, value });
    };
    await setSetting("academicDeputy", "رثعاء المري");
    await setSetting("coordinator", "عائشة علوي اليافعي");
    return { added, updated, total: DEPT_ROSTER.length };
  },
});

// مصالحة: حذف السجلات القديمة المكررة (بدون إيميل) التي لها مقابل رسمي من Excel (بإيميل)
// المطابقة: نفس الرقم الوظيفي، أو نفس الاسم الأول واللقب الأخير. يُبقي من لا مقابل له.
export const reconcileExcel = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("teachers").collect();
    const official = all.filter((t) => !!t.email); // سجلات Excel
    const removed: string[] = [];
    const firstLast = (n: string) => { const p = n.trim().split(/\s+/); return [p[0], p[p.length - 1]]; };
    for (const t of all) {
      if (t.email) continue; // لا نحذف سجلات Excel
      const [f, l] = firstLast(t.name);
      const hasOfficial = official.find((o) =>
        (t.employeeNumber && o.employeeNumber === t.employeeNumber) ||
        (() => { const [of, ol] = firstLast(o.name); return of === f && ol === l; })()
      );
      if (hasOfficial) { await ctx.db.delete(t._id); removed.push(t.name); }
    }
    return { removed, remaining: all.length - removed.length };
  },
});
