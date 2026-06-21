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
