import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// القيود الافتراضية — تُزرع مرة واحدة لتطابق القواعد المعتمدة حالياً،
// ثم تتحكم بها المنسقة من داخل التطبيق (إضافة/حذف/تعطيل).
const DEFAULTS = [
  { kind: "noFirstPeriod", teacherName: "ضحى", day: "", enabled: true },
  { kind: "reduceHours", teacherName: "نور", amount: 2, enabled: true },
  { kind: "noSubjectFirstOnDay", subject: "اللغة العربية", day: "الأحد", enabled: true },
  { kind: "minPerDay", subject: "اللغة العربية", amount: 2, enabled: true },
  { kind: "firstPrefer", subject: "اللغة الإنجليزية", enabled: true },
  { kind: "firstPrefer", subject: "الرياضيات", enabled: true },
  { kind: "firstPrefer", subject: "العلوم", enabled: true },
  { kind: "rule", ruleId: "islamicConsecutive", enabled: true },
  { kind: "rule", ruleId: "blocks", enabled: true },
  { kind: "rule", ruleId: "fairLast", enabled: true },
];

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("scheduleConstraints").collect(),
});

export const add = mutation({
  args: {
    kind: v.string(),
    teacherName: v.optional(v.string()),
    subject: v.optional(v.string()),
    day: v.optional(v.string()),
    amount: v.optional(v.number()),
    ruleId: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    await ctx.db.insert("scheduleConstraints", { ...a, enabled: true });
  },
});

export const setEnabled = mutation({
  args: { id: v.id("scheduleConstraints"), enabled: v.boolean() },
  handler: async (ctx, { id, enabled }) => { await ctx.db.patch(id, { enabled }); },
});

export const remove = mutation({
  args: { id: v.id("scheduleConstraints") },
  handler: async (ctx, { id }) => { await ctx.db.delete(id); },
});

// يزرع القيود الافتراضية إن كان الجدول فارغاً
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("scheduleConstraints").collect();
    if (existing.length) return { added: 0, existing: existing.length };
    for (const d of DEFAULTS) await ctx.db.insert("scheduleConstraints", d as any);
    return { added: DEFAULTS.length, existing: 0 };
  },
});
