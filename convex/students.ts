import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { grade: v.optional(v.string()), section: v.optional(v.string()) },
  handler: async (ctx, { grade, section }) => {
    let students = await ctx.db.query("students").collect();
    if (grade) students = students.filter((s) => s.grade === grade);
    if (section) students = students.filter((s) => s.section === section);
    return students.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    grade: v.string(),
    section: v.string(),
    level: v.optional(v.string()),
    readingLevel: v.optional(v.string()),
    writingLevel: v.optional(v.string()),
    behavior: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert("students", { ...args, active: true }),
});

// استيراد دفعة طالبات من ملف (CSV)
export const bulkCreate = mutation({
  args: {
    students: v.array(v.object({
      name: v.string(), grade: v.string(), section: v.string(),
      level: v.optional(v.string()), readingLevel: v.optional(v.string()),
      writingLevel: v.optional(v.string()), notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { students }) => {
    let added = 0;
    for (const s of students) {
      if (!s.name?.trim()) continue;
      await ctx.db.insert("students", { ...s, active: true });
      added++;
    }
    return { added };
  },
});

export const update = mutation({
  args: {
    id: v.id("students"),
    name: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    level: v.optional(v.string()),
    readingLevel: v.optional(v.string()),
    writingLevel: v.optional(v.string()),
    behavior: v.optional(v.string()),
    notes: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

export const classes = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("classes").collect()).sort((a, b) => (a.grade + a.section).localeCompare(b.grade + b.section, "ar")),
});
